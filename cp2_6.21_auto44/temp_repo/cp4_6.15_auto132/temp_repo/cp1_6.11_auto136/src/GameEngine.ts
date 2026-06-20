import {
  GameState,
  GameConfig,
  DEFAULT_CONFIG,
  ElementType,
  RuneSlot,
  Monster,
  Particle,
  Beam,
  Fragment,
  FloatingText,
  ALL_ELEMENTS,
  ELEMENT_COLORS,
  ELEMENT_WEAKNESSES
} from './types';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: GameConfig;
  private state: GameState;
  private currentTime: number = 0;
  private lastFrameTime: number = 0;
  private animationFrameId: number | null = null;
  private idCounter: number = 0;
  private slotPositions: { x: number; y: number }[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2D context');
    this.ctx = ctx;
    this.config = DEFAULT_CONFIG;
    this.state = this.initializeState();
    this.setupCanvas();
    this.updateSlotPositions();
  }

  private initializeState(): GameState {
    const slots: RuneSlot[] = [];
    for (let i = 0; i < this.config.INITIAL_SLOTS; i++) {
      const angle = (i / this.config.INITIAL_SLOTS) * Math.PI * 2 - Math.PI / 2;
      slots.push({
        index: i,
        angle,
        rune: null,
        ripplePhase: -1,
        isHighlighted: false
      });
    }

    return {
      playerHp: this.config.PLAYER_MAX_HP,
      maxPlayerHp: this.config.PLAYER_MAX_HP,
      fragments: 0,
      wave: 0,
      slots,
      monsters: [],
      particles: [],
      beams: [],
      fragmentsItems: [],
      floatingTexts: [],
      sequenceInput: [],
      targetSequence: this.generateTargetSequence(),
      isElementStorm: false,
      stormTimer: 0,
      stormElement: null,
      stormSuccessCount: 0,
      screenFlash: null,
      altarRadius: this.config.ALTAR_RADIUS,
      warningRadius: this.config.WARNING_RADIUS,
      lastWaveTime: 0,
      lastStormTime: 0,
      totalSlots: this.config.INITIAL_SLOTS,
      isRunning: false,
      selectedSlotIndex: null,
      showRunePanel: false,
      panelPosition: { x: 0, y: 0 },
      scale: 1,
      centerX: 0,
      centerY: 0
    };
  }

  private setupCanvas(): void {
    const resize = () => {
      const minDim = Math.min(window.innerWidth, window.innerHeight);
      const isMobile = window.innerWidth < 768;
      this.state.scale = isMobile ? 0.5 : 1;
      
      const canvasSize = isMobile ? minDim : minDim;
      this.canvas.width = canvasSize;
      this.canvas.height = canvasSize;
      
      this.state.centerX = canvasSize / 2;
      this.state.centerY = canvasSize / 2;
      this.state.altarRadius = this.config.ALTAR_RADIUS * this.state.scale;
      this.state.warningRadius = this.config.WARNING_RADIUS * this.state.scale;
      
      this.updateSlotPositions();
    };
    
    resize();
    window.addEventListener('resize', resize);
  }

  private updateSlotPositions(): void {
    this.slotPositions = this.state.slots.map(slot => {
      const x = this.state.centerX + Math.cos(slot.angle) * this.state.altarRadius * 0.85;
      const y = this.state.centerY + Math.sin(slot.angle) * this.state.altarRadius * 0.85;
      return { x, y };
    });
  }

  private generateId(): string {
    return `id_${++this.idCounter}_${Date.now()}`;
  }

  private generateTargetSequence(): ElementType[] {
    const length = Math.floor(Math.random() * 2) + 2;
    const sequence: ElementType[] = [];
    for (let i = 0; i < length; i++) {
      sequence.push(ALL_ELEMENTS[Math.floor(Math.random() * ALL_ELEMENTS.length)]);
    }
    return sequence;
  }

  private generateMonsterElement(): ElementType {
    return ALL_ELEMENTS[Math.floor(Math.random() * ALL_ELEMENTS.length)];
  }

  public getState(): GameState {
    return this.state;
  }

  public getConfig(): GameConfig {
    return this.config;
  }

  public getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  public start(): void {
    if (this.state.isRunning) return;
    this.state.isRunning = true;
    this.lastFrameTime = performance.now();
    this.state.lastWaveTime = this.lastFrameTime;
    this.state.lastStormTime = this.lastFrameTime;
    this.gameLoop();
  }

  public stop(): void {
    this.state.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private gameLoop = (): void => {
    if (!this.state.isRunning) return;
    
    const now = performance.now();
    const deltaTime = now - this.lastFrameTime;
    this.lastFrameTime = now;
    this.currentTime = now;
    
    this.update(deltaTime);
    
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  public update(deltaTime: number): void {
    if (deltaTime > 100) deltaTime = 100;

    this.updateTimers(deltaTime);
    this.updateMonsters(deltaTime);
    this.updateParticles(deltaTime);
    this.updateBeams(deltaTime);
    this.updateFragments(deltaTime);
    this.updateFloatingTexts(deltaTime);
    this.updateRippleEffects(deltaTime);
    this.updateScreenFlash(deltaTime);
    this.updateElementStorm(deltaTime);
    this.updateStormHighlight();
    this.checkGameOver();
  }

  private updateTimers(deltaTime: number): void {
    if (this.currentTime - this.state.lastWaveTime >= this.config.WAVE_INTERVAL) {
      this.spawnWave();
      this.state.lastWaveTime = this.currentTime;
    }

    if (!this.state.isElementStorm && 
        this.currentTime - this.state.lastStormTime >= this.config.STORM_INTERVAL) {
      this.triggerElementStorm();
    }
  }

  private updateMonsters(deltaTime: number): void {
    const toRemove: string[] = [];

    for (const monster of this.state.monsters) {
      const dx = this.state.centerX - monster.x;
      const dy = this.state.centerY - monster.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < this.state.altarRadius * 0.3 + monster.radius) {
        this.damagePlayer(this.config.MONSTER_DAMAGE);
        toRemove.push(monster.id);
        this.spawnParticles(monster.x, monster.y, '#FF0000', 10);
      } else {
        const speed = monster.speed * (deltaTime / 1000);
        monster.x += (dx / dist) * speed;
        monster.y += (dy / dist) * speed;
      }
    }

    this.state.monsters = this.state.monsters.filter(m => !toRemove.includes(m.id));
  }

  private updateParticles(deltaTime: number): void {
    for (let i = this.state.particles.length - 1; i >= 0; i--) {
      const p = this.state.particles[i];
      p.x += p.vx * (deltaTime / 1000);
      p.y += p.vy * (deltaTime / 1000);
      p.vy += 100 * (deltaTime / 1000);
      p.life -= deltaTime;
      
      if (p.life <= 0) {
        this.state.particles.splice(i, 1);
      }
    }
  }

  private updateBeams(deltaTime: number): void {
    for (let i = this.state.beams.length - 1; i >= 0; i--) {
      const beam = this.state.beams[i];
      beam.life -= deltaTime;
      
      if (beam.life <= 0) {
        this.state.beams.splice(i, 1);
      }
    }
  }

  private updateFragments(deltaTime: number): void {
    for (let i = this.state.fragmentsItems.length - 1; i >= 0; i--) {
      const f = this.state.fragmentsItems[i];
      f.life -= deltaTime;
      f.rotation += deltaTime * 0.005;
      
      const dx = f.targetX - f.x;
      const dy = f.targetY - f.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 5) {
        const speed = 100 * (deltaTime / 1000);
        f.x += (dx / dist) * speed;
        f.y += (dy / dist) * speed;
      }
      
      if (dist < 20) {
        this.collectFragment(f);
        this.state.fragmentsItems.splice(i, 1);
      } else if (f.life <= 0) {
        this.state.fragmentsItems.splice(i, 1);
      }
    }
  }

  private updateFloatingTexts(deltaTime: number): void {
    for (let i = this.state.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.state.floatingTexts[i];
      ft.life -= deltaTime;
      ft.y -= 30 * (deltaTime / 1000);
      
      if (ft.life <= 0) {
        this.state.floatingTexts.splice(i, 1);
      }
    }
  }

  private updateRippleEffects(deltaTime: number): void {
    for (const slot of this.state.slots) {
      if (slot.ripplePhase >= 0) {
        slot.ripplePhase += deltaTime;
        if (slot.ripplePhase >= this.config.RIPPLE_DURATION) {
          slot.ripplePhase = -1;
        }
      }
    }
  }

  private updateScreenFlash(deltaTime: number): void {
    if (this.state.screenFlash) {
      this.state.screenFlash.life -= deltaTime;
      if (this.state.screenFlash.life <= 0) {
        this.state.screenFlash = null;
      }
    }
  }

  private updateElementStorm(deltaTime: number): void {
    if (this.state.isElementStorm) {
      this.state.stormTimer -= deltaTime;
      if (this.state.stormTimer <= 0) {
        this.endElementStorm();
      }
    }
  }

  private updateStormHighlight(): void {
    if (this.state.isElementStorm && this.state.targetSequence.length > 0) {
      const nextExpectedIndex = this.state.sequenceInput.length;
      const nextExpectedElement = this.state.targetSequence[nextExpectedIndex];
      
      for (const slot of this.state.slots) {
        slot.isHighlighted = slot.rune?.element === nextExpectedElement;
      }
    } else {
      for (const slot of this.state.slots) {
        slot.isHighlighted = false;
      }
    }
  }

  public spawnWave(): void {
    if (this.state.monsters.length >= this.config.MAX_MONSTERS) return;
    
    this.state.wave++;
    const count = Math.floor(
      Math.random() * (this.config.MONSTERS_PER_WAVE[1] - this.config.MONSTERS_PER_WAVE[0] + 1)
    ) + this.config.MONSTERS_PER_WAVE[0];
    
    for (let i = 0; i < count; i++) {
      if (this.state.monsters.length >= this.config.MAX_MONSTERS) break;
      this.spawnMonster();
    }
  }

  private spawnMonster(): void {
    const angle = Math.random() * Math.PI * 2;
    const spawnDist = Math.max(this.canvas.width, this.canvas.height) * 0.6;
    const x = this.state.centerX + Math.cos(angle) * spawnDist;
    const y = this.state.centerY + Math.sin(angle) * spawnDist;
    
    const element = this.generateMonsterElement();
    const radius = Math.random() * (this.config.MONSTER_RADIUS[1] - this.config.MONSTER_RADIUS[0]) 
                   + this.config.MONSTER_RADIUS[0];
    const scaledRadius = radius * this.state.scale;
    
    let hp = this.config.MONSTER_BASE_HP + this.state.wave;
    let speed = Math.random() * (this.config.MONSTER_BASE_SPEED[1] - this.config.MONSTER_BASE_SPEED[0]) 
                + this.config.MONSTER_BASE_SPEED[0];
    
    if (this.state.isElementStorm) {
      hp = Math.floor(hp * 1.2);
      speed *= 1.5;
    }
    
    const colorVariation = Math.random();
    const colorStart = colorVariation > 0.5 ? '#2B0054' : '#540000';
    const colorEnd = colorVariation > 0.5 ? '#540000' : '#2B0054';
    
    const monster: Monster = {
      id: this.generateId(),
      x,
      y,
      radius: scaledRadius,
      hp,
      maxHp: hp,
      speed: speed * this.state.scale,
      element,
      weakness: ELEMENT_WEAKNESSES[element],
      colorStart,
      colorEnd
    };
    
    this.state.monsters.push(monster);
  }

  public triggerElementStorm(): void {
    this.state.isElementStorm = true;
    this.state.stormTimer = this.config.STORM_DURATION;
    this.state.stormElement = ALL_ELEMENTS[Math.floor(Math.random() * ALL_ELEMENTS.length)];
    this.state.stormSuccessCount = 0;
    this.state.lastStormTime = this.currentTime;
    
    for (const monster of this.state.monsters) {
      monster.maxHp = Math.floor(monster.maxHp * 1.2);
      monster.hp = Math.floor(monster.hp * 1.2);
      monster.speed *= 1.5;
    }
  }

  private endElementStorm(): void {
    this.state.isElementStorm = false;
    this.state.stormElement = null;
    
    const bonusCount = Math.floor(this.state.stormSuccessCount / 3) * 2;
    if (bonusCount > 0) {
      this.state.fragments += bonusCount;
      this.addFloatingText(
        this.state.centerX,
        this.state.centerY - 50,
        `+${bonusCount} 碎片!`,
        '#FFD700'
      );
    }
    
    this.state.stormSuccessCount = 0;
  }

  public handleClick(clickX: number, clickY: number): void {
    if (this.state.showRunePanel) {
      const panelElement = this.checkRunePanelClick(clickX, clickY);
      if (panelElement) {
        this.placeRune(this.state.selectedSlotIndex!, panelElement);
      }
      this.state.showRunePanel = false;
      this.state.selectedSlotIndex = null;
      return;
    }
    
    const slotIndex = this.getSlotAtPosition(clickX, clickY);
    if (slotIndex !== -1) {
      const slot = this.state.slots[slotIndex];
      
      if (!slot.rune) {
        this.state.selectedSlotIndex = slotIndex;
        this.state.showRunePanel = true;
        const pos = this.slotPositions[slotIndex];
        this.state.panelPosition = { x: pos.x, y: pos.y };
      } else {
        this.clickSlot(slotIndex);
      }
    }
  }

  private checkRunePanelClick(clickX: number, clickY: number): ElementType | null {
    const panelX = this.state.panelPosition.x;
    const panelY = this.state.panelPosition.y;
    const buttonRadius = 25 * this.state.scale;
    const spacing = 60 * this.state.scale;
    
    for (let i = 0; i < ALL_ELEMENTS.length; i++) {
      const btnX = panelX + (i - 2) * spacing;
      const btnY = panelY - 80 * this.state.scale;
      const dx = clickX - btnX;
      const dy = clickY - btnY;
      if (Math.sqrt(dx * dx + dy * dy) < buttonRadius) {
        return ALL_ELEMENTS[i];
      }
    }
    return null;
  }

  private getSlotAtPosition(x: number, y: number): number {
    const hitRadius = 30 * this.state.scale;
    
    for (let i = 0; i < this.slotPositions.length; i++) {
      if (i >= this.state.totalSlots) continue;
      const pos = this.slotPositions[i];
      const dx = x - pos.x;
      const dy = y - pos.y;
      if (Math.sqrt(dx * dx + dy * dy) < hitRadius) {
        return i;
      }
    }
    return -1;
  }

  public placeRune(slotIndex: number, element: ElementType): void {
    const slot = this.state.slots[slotIndex];
    if (!slot || slot.rune) return;
    
    slot.rune = {
      id: this.generateId(),
      element,
      slotIndex,
      pulsePhase: Math.random() * this.config.PULSE_PERIOD
    };
    
    this.spawnParticles(
      this.slotPositions[slotIndex].x,
      this.slotPositions[slotIndex].y,
      ELEMENT_COLORS[element],
      15
    );
  }

  private clickSlot(slotIndex: number): void {
    const slot = this.state.slots[slotIndex];
    if (!slot.rune) return;
    
    slot.ripplePhase = 0;
    
    const hasMonsterInWarning = this.state.monsters.some(m => {
      const dx = this.state.centerX - m.x;
      const dy = this.state.centerY - m.y;
      return Math.sqrt(dx * dx + dy * dy) < this.state.warningRadius + m.radius;
    });
    
    if (!hasMonsterInWarning) return;
    
    this.state.sequenceInput.push(slotIndex);
    
    const isCorrect = this.validatePartialSequence();
    if (!isCorrect) {
      this.handleMismatch();
      return;
    }
    
    if (this.state.sequenceInput.length === this.state.targetSequence.length) {
      this.handleCorrectSequence();
    }
  }

  private validatePartialSequence(): boolean {
    for (let i = 0; i < this.state.sequenceInput.length; i++) {
      const slotIndex = this.state.sequenceInput[i];
      const slot = this.state.slots[slotIndex];
      if (!slot.rune || slot.rune.element !== this.state.targetSequence[i]) {
        return false;
      }
    }
    return true;
  }

  private validateSequence(): boolean {
    if (this.state.sequenceInput.length !== this.state.targetSequence.length) return false;
    return this.validatePartialSequence();
  }

  private handleCorrectSequence(): void {
    if (this.state.isElementStorm) {
      this.state.stormSuccessCount++;
    }
    
    const targetMonster = this.findNearestMonsterInWarning();
    if (targetMonster) {
      const element = this.state.targetSequence[this.state.targetSequence.length - 1];
      this.fireBeam(targetMonster, element);
      this.damageMonster(targetMonster, this.config.DAMAGE_PER_HIT);
    }
    
    this.state.sequenceInput = [];
    this.state.targetSequence = this.generateTargetSequence();
  }

  private handleMismatch(): void {
    this.damagePlayer(this.config.MISMATCH_DAMAGE);
    this.state.screenFlash = { color: '#FF0000', life: 200 };
    this.state.sequenceInput = [];
  }

  private findNearestMonsterInWarning(): Monster | null {
    let nearest: Monster | null = null;
    let minDist = Infinity;
    
    for (const monster of this.state.monsters) {
      const dx = this.state.centerX - monster.x;
      const dy = this.state.centerY - monster.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < this.state.warningRadius + monster.radius && dist < minDist) {
        minDist = dist;
        nearest = monster;
      }
    }
    
    return nearest;
  }

  private fireBeam(monster: Monster, element: ElementType): void {
    const color = ELEMENT_COLORS[element];
    const beamLength = 300 * this.state.scale;
    const dx = monster.x - this.state.centerX;
    const dy = monster.y - this.state.centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    const beam: Beam = {
      id: this.generateId(),
      startX: this.state.centerX,
      startY: this.state.centerY,
      endX: monster.x,
      endY: monster.y,
      color,
      life: this.config.BEAM_DURATION,
      maxLife: this.config.BEAM_DURATION,
      width: 6 * this.state.scale,
      targetMonsterId: monster.id
    };
    
    this.state.beams.push(beam);
    
    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
      const t = i / particleCount;
      const px = this.state.centerX + dx * t;
      const py = this.state.centerY + dy * t;
      const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.5;
      const speed = 50 + Math.random() * 100;
      
      this.state.particles.push({
        id: this.generateId(),
        x: px,
        y: py,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 300 + Math.random() * 200,
        maxLife: 500,
        color,
        size: (3 + Math.random() * 4) * this.state.scale
      });
    }
  }

  public damageMonster(monster: Monster, damage: number): void {
    monster.hp -= damage;
    
    this.addFloatingText(
      monster.x,
      monster.y - monster.radius,
      `-${damage}`,
      '#FFFFFF'
    );
    
    if (monster.hp <= 0) {
      this.killMonster(monster);
    }
  }

  private killMonster(monster: Monster): void {
    const index = this.state.monsters.findIndex(m => m.id === monster.id);
    if (index === -1) return;
    
    this.state.monsters.splice(index, 1);
    
    this.spawnParticles(monster.x, monster.y, monster.colorEnd, 25);
    
    if (Math.random() < this.config.FRAGMENT_DROP_CHANCE) {
      this.spawnFragment(monster.x, monster.y);
    }
  }

  public damagePlayer(damage: number): void {
    this.state.playerHp = Math.max(0, this.state.playerHp - damage);
    this.addFloatingText(
      this.state.centerX,
      this.state.centerY - this.state.altarRadius - 30,
      `-${damage}`,
      '#FF3355'
    );
  }

  public spawnParticles(x: number, y: number, color: string, count: number): void {
    const availableSlots = this.config.MAX_PARTICLES - this.state.particles.length;
    count = Math.min(count, availableSlots);
    
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 150;
      
      this.state.particles.push({
        id: this.generateId(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 50,
        life: 500 + Math.random() * 500,
        maxLife: 1000,
        color,
        size: (2 + Math.random() * 4) * this.state.scale
      });
    }
  }

  private spawnFragment(x: number, y: number): void {
    const targetIndex = Math.floor(Math.random() * this.state.totalSlots);
    const targetPos = this.slotPositions[targetIndex];
    
    const fragment: Fragment = {
      id: this.generateId(),
      x,
      y,
      targetX: targetPos.x,
      targetY: targetPos.y,
      rotation: 0,
      life: this.config.FRAGMENT_LIFETIME,
      maxLife: this.config.FRAGMENT_LIFETIME
    };
    
    this.state.fragmentsItems.push(fragment);
  }

  private collectFragment(fragment: Fragment): void {
    this.state.fragments++;
    this.addFloatingText(fragment.x, fragment.y, '+1', '#FFD700');
    
    if (this.state.fragments >= this.config.FRAGMENTS_PER_UNLOCK && 
        this.state.totalSlots < this.config.MAX_SLOTS) {
      this.state.fragments -= this.config.FRAGMENTS_PER_UNLOCK;
      this.unlockSlot();
    }
  }

  private unlockSlot(): void {
    if (this.state.totalSlots >= this.config.MAX_SLOTS) return;
    
    this.state.totalSlots++;
    const newIndex = this.state.totalSlots - 1;
    
    for (let i = 0; i < this.state.totalSlots; i++) {
      this.state.slots[i].angle = (i / this.state.totalSlots) * Math.PI * 2 - Math.PI / 2;
    }
    
    this.updateSlotPositions();
    
    this.spawnParticles(this.state.centerX, this.state.centerY, '#FFD700', 100);
    
    this.addFloatingText(
      this.state.centerX,
      this.state.centerY,
      '槽位解锁!',
      '#FFD700'
    );
  }

  private addFloatingText(x: number, y: number, text: string, color: string): void {
    const ft: FloatingText = {
      id: this.generateId(),
      x,
      y,
      text,
      color,
      life: this.config.FLOATING_TEXT_DURATION,
      maxLife: this.config.FLOATING_TEXT_DURATION
    };
    this.state.floatingTexts.push(ft);
  }

  private checkGameOver(): void {
    if (this.state.playerHp <= 0) {
      this.stop();
    }
  }

  public getSlotPosition(index: number): { x: number; y: number } | null {
    if (index < 0 || index >= this.slotPositions.length) return null;
    return this.slotPositions[index];
  }
}
