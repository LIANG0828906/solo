import { v4 as uuidv4 } from 'uuid';
import {
  EventBus,
  Fragment,
  Slot,
  TimelineState,
  Particle,
  FragmentColor,
  SlotPosition,
  FRAGMENT_COLORS,
  SLOT_REQUIREMENTS,
  COLOR_MERGE_MAP
} from './PuzzleState';

export class LogicManager {
  private eventBus: EventBus;
  private fragments: Map<string, Fragment> = new Map();
  private slots: Map<SlotPosition, Slot> = new Map();
  private timelineState: TimelineState;
  private canvasWidth: number = 0;
  private canvasHeight: number = 0;
  private clockCenterX: number = 0;
  private clockCenterY: number = 0;
  private clockRadius: number = 0;
  private draggingFragmentId: string | null = null;
  private dragOffsetX: number = 0;
  private dragOffsetY: number = 0;
  private activatedSlots: Set<SlotPosition> = new Set();
  private collectedFragments: Set<FragmentColor> = new Set();
  private noiseTimer: number = 0;
  private singularityProgress: number = 0;
  private isGameComplete: boolean = false;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.timelineState = {
      timeSpeed: 1,
      timeOfDay: 'day',
      weather: 'clear',
      skyGradient: ['#87CEEB', '#E0F6FF'],
      darkness: 0,
      progress: 0,
      speedBoostTimer: 0,
      rainTimer: 0,
      nightTimer: 0
    };
  }

  initialize(canvasWidth: number, canvasHeight: number): void {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.clockCenterX = (canvasWidth - 280) / 2;
    this.clockCenterY = canvasHeight / 2;
    this.clockRadius = Math.min(canvasWidth, canvasHeight) * 0.225;

    this.createSlots();
    this.createFragments();
    this.emitTimelineChange();
  }

  private createSlots(): void {
    const slotPositions: { id: SlotPosition; angle: number }[] = [
      { id: '12', angle: -Math.PI / 2 },
      { id: '3', angle: 0 },
      { id: '6', angle: Math.PI / 2 },
      { id: '9', angle: Math.PI }
    ];

    const slotRadius = this.clockRadius + 80;

    slotPositions.forEach(({ id, angle }) => {
      const slot: Slot = {
        id,
        x: this.clockCenterX + Math.cos(angle) * slotRadius,
        y: this.clockCenterY + Math.sin(angle) * slotRadius,
        requiredColors: SLOT_REQUIREMENTS[id],
        state: 'empty',
        shakeOffset: { x: 0, y: 0 },
        glowIntensity: 0,
        errorTimer: 0,
        shakeTimer: 0
      };
      this.slots.set(id, slot);
    });
  }

  private createFragments(): void {
    const colors: FragmentColor[] = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];
    const gameAreaWidth = this.canvasWidth - 280;
    const margin = 100;

    colors.forEach((color) => {
      let x: number, y: number;
      let attempts = 0;
      do {
        x = margin + Math.random() * (gameAreaWidth - margin * 2);
        y = margin + Math.random() * (this.canvasHeight - margin * 2);
        attempts++;
      } while (this.isPositionInSlot(x, y) && attempts < 50);

      const fragment: Fragment = {
        id: uuidv4(),
        x,
        y,
        originalX: x,
        originalY: y,
        color,
        size: 40,
        rotation: Math.random() * Math.PI * 2,
        isDragging: false,
        mergedFrom: null,
        glowPhase: Math.random() * Math.PI * 2,
        returnAnimation: null
      };

      this.fragments.set(fragment.id, fragment);
      this.eventBus.emit({ type: 'fragment:created', payload: fragment });
    });
  }

  private isPositionInSlot(x: number, y: number): boolean {
    for (const slot of this.slots.values()) {
      const dist = Math.sqrt((x - slot.x) ** 2 + (y - slot.y) ** 2);
      if (dist < 60) return true;
    }
    return false;
  }

  handleMouseDown(x: number, y: number): void {
    if (this.isGameComplete) return;

    for (const fragment of this.fragments.values()) {
      const dist = Math.sqrt((x - fragment.x) ** 2 + (y - fragment.y) ** 2);
      if (dist < fragment.size) {
        this.draggingFragmentId = fragment.id;
        this.dragOffsetX = fragment.x - x;
        this.dragOffsetY = fragment.y - y;
        fragment.isDragging = true;
        break;
      }
    }
  }

  handleMouseMove(x: number, y: number): void {
    if (this.isGameComplete || !this.draggingFragmentId) return;

    const fragment = this.fragments.get(this.draggingFragmentId);
    if (!fragment) return;

    fragment.x = x + this.dragOffsetX;
    fragment.y = y + this.dragOffsetY;

    const gameAreaWidth = this.canvasWidth - 280;
    fragment.x = Math.max(fragment.size, Math.min(gameAreaWidth - fragment.size, fragment.x));
    fragment.y = Math.max(fragment.size, Math.min(this.canvasHeight - fragment.size, fragment.y));

    this.spawnTrailParticle(fragment);

    this.eventBus.emit({
      type: 'fragment:moved',
      payload: { id: fragment.id, x: fragment.x, y: fragment.y }
    });

    this.checkFragmentMerge();
  }

  handleMouseUp(): void {
    if (!this.draggingFragmentId) return;

    const fragment = this.fragments.get(this.draggingFragmentId);
    if (fragment) {
      fragment.isDragging = false;

      const slot = this.getSlotAtPosition(fragment.x, fragment.y);
      if (slot) {
        this.verifySlotInsertion(fragment, slot);
      } else {
        this.startReturnAnimation(fragment);
      }
    }

    this.draggingFragmentId = null;
  }

  private getSlotAtPosition(x: number, y: number): Slot | null {
    for (const slot of this.slots.values()) {
      const dist = Math.sqrt((x - slot.x) ** 2 + (y - slot.y) ** 2);
      if (dist < 45) return slot;
    }
    return null;
  }

  private verifySlotInsertion(fragment: Fragment, slot: Slot): void {
    const fragmentColors = this.getFragmentColors(fragment);
    const requiredColors = slot.requiredColors;

    const hasAllColors = requiredColors.every(color => fragmentColors.includes(color));

    if (hasAllColors && slot.state !== 'active') {
      this.activateSlot(slot, fragment, fragmentColors);
    } else if (slot.state !== 'active') {
      this.triggerSlotError(slot, fragment);
    } else {
      this.startReturnAnimation(fragment);
    }
  }

  private getFragmentColors(fragment: Fragment): FragmentColor[] {
    if (!fragment.mergedFrom) {
      return [fragment.color];
    }

    const colors: FragmentColor[] = [];
    const collectColors = (frag: Fragment): void => {
      if (frag.mergedFrom) {
        const f1 = this.fragments.get(frag.mergedFrom[0]);
        const f2 = this.fragments.get(frag.mergedFrom[1]);
        if (f1) collectColors(f1);
        if (f2) collectColors(f2);
      } else {
        if (!colors.includes(frag.color)) {
          colors.push(frag.color);
        }
      }
    };
    collectColors(fragment);
    return colors;
  }

  private activateSlot(slot: Slot, fragment: Fragment, colors: FragmentColor[]): void {
    slot.state = 'active';
    this.activatedSlots.add(slot.id);

    colors.forEach(c => this.collectedFragments.add(c));

    this.fragments.delete(fragment.id);

    this.eventBus.emit({
      type: 'slot:activated',
      payload: { slotId: slot.id, colors }
    });

    this.eventBus.emit({ type: 'audio:play', payload: 'merge' });

    this.timelineState.progress = this.activatedSlots.size / 4;
    this.emitTimelineChange();

    switch (slot.id) {
      case '12':
        this.activateSpeedBoost();
        break;
      case '3':
        this.activateRain();
        break;
      case '6':
        this.activateNight();
        break;
      case '9':
        this.activateSingularity();
        break;
    }

    this.updateUI();
  }

  private activateSpeedBoost(): void {
    this.timelineState.timeSpeed = 2;
    this.timelineState.speedBoostTimer = 3;
    this.timelineState.skyGradient = ['#FFD700', '#FFA500'];
    this.emitTimelineChange();
  }

  private activateRain(): void {
    this.timelineState.weather = 'rain';
    this.timelineState.rainTimer = 8;
    this.eventBus.emit({ type: 'audio:play', payload: 'rain' });
    this.emitTimelineChange();
  }

  private activateNight(): void {
    this.timelineState.timeOfDay = 'night';
    this.timelineState.darkness = 0.7;
    this.timelineState.nightTimer = 5;
    this.timelineState.skyGradient = ['#0a0a2e', '#4a0080'];
    this.emitTimelineChange();
  }

  private activateSingularity(): void {
    this.isGameComplete = true;
    this.singularityProgress = 0;
    this.eventBus.emit({ type: 'audio:play', payload: 'singularity' });

    this.fragments.clear();

    setTimeout(() => {
      this.eventBus.emit({
        type: 'game:complete',
        payload: { score: Math.floor(this.timelineState.progress * 100) }
      });
    }, 2000);
  }

  private triggerSlotError(slot: Slot, fragment: Fragment): void {
    slot.state = 'error';
    slot.errorTimer = 1;
    slot.shakeTimer = 0.3;
    this.noiseTimer = 0.5;

    this.eventBus.emit({ type: 'slot:error', payload: { slotId: slot.id } });
    this.eventBus.emit({ type: 'audio:play', payload: 'error' });

    this.startReturnAnimation(fragment);

    setTimeout(() => {
      slot.state = 'empty';
    }, 1000);
  }

  private startReturnAnimation(fragment: Fragment): void {
    fragment.returnAnimation = {
      active: true,
      startX: fragment.x,
      startY: fragment.y,
      targetX: fragment.originalX,
      targetY: fragment.originalY,
      progress: 0
    };
  }

  private checkFragmentMerge(): void {
    const fragmentArray = Array.from(this.fragments.values());

    for (let i = 0; i < fragmentArray.length; i++) {
      for (let j = i + 1; j < fragmentArray.length; j++) {
        const f1 = fragmentArray[i];
        const f2 = fragmentArray[j];

        if (f1.isDragging || f2.isDragging) continue;
        if (f1.mergedFrom || f2.mergedFrom) continue;

        const dist = Math.sqrt((f1.x - f2.x) ** 2 + (f1.y - f2.y) ** 2);

        if (dist < 60) {
          this.mergeFragments(f1, f2);
          return;
        }
      }
    }
  }

  private mergeFragments(f1: Fragment, f2: Fragment): void {
    const mergeKey = `${f1.color}+${f2.color}`;
    const newColor = COLOR_MERGE_MAP[mergeKey] || f1.color;

    const centerX = (f1.x + f2.x) / 2;
    const centerY = (f1.y + f2.y) / 2;

    const newFragment: Fragment = {
      id: uuidv4(),
      x: centerX,
      y: centerY,
      originalX: centerX,
      originalY: centerY,
      color: newColor,
      size: 50,
      rotation: (f1.rotation + f2.rotation) / 2,
      isDragging: false,
      mergedFrom: [f1.id, f2.id],
      glowPhase: 0,
      returnAnimation: null
    };

    this.spawnMergeParticles(f1, f2, centerX, centerY);

    this.fragments.delete(f1.id);
    this.fragments.delete(f2.id);
    this.fragments.set(newFragment.id, newFragment);

    this.eventBus.emit({
      type: 'fragment:merged',
      payload: { fragmentIds: [f1.id, f2.id], newFragment }
    });

    this.eventBus.emit({ type: 'audio:play', payload: 'merge' });
  }

  private spawnMergeParticles(f1: Fragment, f2: Fragment, x: number, y: number): void {
    const particles: Particle[] = [];
    const color1 = FRAGMENT_COLORS[f1.color];
    const color2 = FRAGMENT_COLORS[f2.color];

    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20 + Math.random() * 0.5;
      const speed = 50 + Math.random() * 100;
      const blend = Math.random();
      const color = blend < 0.5 ? color1 : color2;

      particles.push({
        id: uuidv4(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 6,
        color,
        opacity: 1,
        life: 0.5,
        maxLife: 0.5,
        type: 'merge'
      });
    }

    this.eventBus.emit({ type: 'particles:spawn', payload: particles });
  }

  private spawnTrailParticle(fragment: Fragment): void {
    if (Math.random() > 0.3) return;

    const particle: Particle = {
      id: uuidv4(),
      x: fragment.x + (Math.random() - 0.5) * 20,
      y: fragment.y + (Math.random() - 0.5) * 20,
      vx: 0,
      vy: 0,
      size: 3 + Math.random() * 4,
      color: FRAGMENT_COLORS[fragment.color],
      opacity: 0.8,
      life: 0.3,
      maxLife: 0.3,
      type: 'trail'
    };

    this.eventBus.emit({ type: 'particles:spawn', payload: [particle] });
  }

  spawnRainParticles(): void {
    if (this.timelineState.weather !== 'rain') return;

    const particles: Particle[] = [];
    const gameAreaWidth = this.canvasWidth - 280;

    for (let i = 0; i < 5; i++) {
      const angle = (15 * Math.PI) / 180;
      particles.push({
        id: uuidv4(),
        x: Math.random() * gameAreaWidth,
        y: -10,
        vx: Math.sin(angle) * 200,
        vy: Math.cos(angle) * 400,
        size: 1,
        color: 'rgba(100, 150, 255, 0.6)',
        opacity: 0.6,
        life: 3,
        maxLife: 3,
        type: 'rain',
        angle,
        length: 10
      });
    }

    this.eventBus.emit({ type: 'particles:spawn', payload: particles });
  }

  update(deltaTime: number): void {
    if (this.isGameComplete) {
      this.singularityProgress = Math.min(1, this.singularityProgress + deltaTime / 2);
      return;
    }

    for (const fragment of this.fragments.values()) {
      fragment.glowPhase += deltaTime * Math.PI * 2;

      if (fragment.returnAnimation?.active) {
        fragment.returnAnimation.progress += deltaTime / 0.15;
        const t = Math.min(1, fragment.returnAnimation.progress);
        const easeOut = 1 - Math.pow(1 - t, 3);

        fragment.x = fragment.returnAnimation.startX +
          (fragment.returnAnimation.targetX - fragment.returnAnimation.startX) * easeOut;
        fragment.y = fragment.returnAnimation.startY +
          (fragment.returnAnimation.targetY - fragment.returnAnimation.startY) * easeOut;

        if (t >= 1) {
          fragment.returnAnimation.active = false;
          fragment.returnAnimation = null;
        }
      }
    }

    for (const slot of this.slots.values()) {
      if (slot.shakeTimer > 0) {
        slot.shakeTimer -= deltaTime;
        slot.shakeOffset.x = (Math.random() - 0.5) * 20;
        slot.shakeOffset.y = (Math.random() - 0.5) * 20;
      } else {
        slot.shakeOffset = { x: 0, y: 0 };
      }

      if (slot.errorTimer > 0) {
        slot.errorTimer -= deltaTime;
        slot.glowIntensity = Math.sin(slot.errorTimer * Math.PI * 6) * 0.5 + 0.5;
      } else {
        slot.glowIntensity = slot.state === 'active' ? 1 : 0;
      }
    }

    if (this.noiseTimer > 0) {
      this.noiseTimer -= deltaTime;
    }

    this.updateTimelineEffects(deltaTime);
  }

  private updateTimelineEffects(deltaTime: number): void {
    if (this.timelineState.speedBoostTimer > 0) {
      this.timelineState.speedBoostTimer -= deltaTime;
      if (this.timelineState.speedBoostTimer <= 0) {
        this.timelineState.timeSpeed = 1;
        this.timelineState.skyGradient = ['#87CEEB', '#E0F6FF'];
        this.emitTimelineChange();
      }
    }

    if (this.timelineState.rainTimer > 0) {
      this.timelineState.rainTimer -= deltaTime;
      this.spawnRainParticles();
      if (this.timelineState.rainTimer <= 0) {
        this.timelineState.weather = 'clear';
        this.eventBus.emit({ type: 'audio:stop', payload: 'rain' });
        this.emitTimelineChange();
        this.updateUI();
      }
    }

    if (this.timelineState.nightTimer > 0) {
      this.timelineState.nightTimer -= deltaTime;
      if (this.timelineState.nightTimer <= 0) {
        this.timelineState.timeOfDay = 'day';
        this.timelineState.darkness = 0;
        this.timelineState.skyGradient = ['#87CEEB', '#E0F6FF'];
        this.emitTimelineChange();
      }
    }
  }

  private emitTimelineChange(): void {
    this.eventBus.emit({
      type: 'timeline:changed',
      payload: { ...this.timelineState }
    });
  }

  private updateUI(): void {
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const fragmentCount = document.getElementById('fragment-count');
    const weatherSun = document.getElementById('weather-sun');
    const weatherRain = document.getElementById('weather-rain');
    const weatherSnow = document.getElementById('weather-snow');

    if (progressBar) {
      const circumference = 314.16;
      const offset = circumference * (1 - this.timelineState.progress);
      progressBar.setAttribute('stroke-dashoffset', offset.toString());
    }

    if (progressText) {
      progressText.textContent = `${Math.floor(this.timelineState.progress * 100)}%`;
    }

    if (fragmentCount) {
      fragmentCount.textContent = this.collectedFragments.size.toString();
    }

    if (weatherSun && weatherRain && weatherSnow) {
      weatherSun.classList.remove('active');
      weatherRain.classList.remove('active');
      weatherSnow.classList.remove('active');

      switch (this.timelineState.weather) {
        case 'clear':
          weatherSun.classList.add('active');
          break;
        case 'rain':
          weatherRain.classList.add('active');
          break;
        case 'snow':
          weatherSnow.classList.add('active');
          break;
      }
    }
  }

  getFragments(): Fragment[] {
    return Array.from(this.fragments.values());
  }

  getSlots(): Slot[] {
    return Array.from(this.slots.values());
  }

  getTimelineState(): TimelineState {
    return this.timelineState;
  }

  getClockCenter(): { x: number; y: number } {
    return { x: this.clockCenterX, y: this.clockCenterY };
  }

  getClockRadius(): number {
    return this.clockRadius;
  }

  getNoiseTimer(): number {
    return this.noiseTimer;
  }

  getSingularityProgress(): number {
    return this.singularityProgress;
  }

  reset(): void {
    this.fragments.clear();
    this.slots.clear();
    this.activatedSlots.clear();
    this.collectedFragments.clear();
    this.draggingFragmentId = null;
    this.isGameComplete = false;
    this.singularityProgress = 0;
    this.noiseTimer = 0;

    this.timelineState = {
      timeSpeed: 1,
      timeOfDay: 'day',
      weather: 'clear',
      skyGradient: ['#87CEEB', '#E0F6FF'],
      darkness: 0,
      progress: 0,
      speedBoostTimer: 0,
      rainTimer: 0,
      nightTimer: 0
    };

    this.initialize(this.canvasWidth, this.canvasHeight);
    this.updateUI();
  }
}
