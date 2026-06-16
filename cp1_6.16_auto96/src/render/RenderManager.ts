import { v4 as uuidv4 } from 'uuid';
import {
  EventBus,
  Fragment,
  Slot,
  TimelineState,
  Particle,
  Gear,
  FragmentColor,
  FRAGMENT_COLORS,
  CHINESE_HOURS
} from '../game/PuzzleState';
import { ParticleSystem } from './ParticleSystem';
import { AudioManager } from './AudioManager';

export class RenderManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private eventBus: EventBus;
  private particleSystem: ParticleSystem;
  private audioManager: AudioManager;
  private width: number = 0;
  private height: number = 0;
  private clockCenterX: number = 0;
  private clockCenterY: number = 0;
  private clockRadius: number = 0;
  private gears: Gear[] = [];
  private backgroundCanvas: HTMLCanvasElement;
  private backgroundCtx: CanvasRenderingContext2D;
  private timelineState: TimelineState;
  private noiseTimer: number = 0;
  private singularityProgress: number = 0;
  private clockHandAngle: number = 0;
  private hourHandAngle: number = 0;

  constructor(canvas: HTMLCanvasElement, eventBus: EventBus) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.eventBus = eventBus;
    this.particleSystem = new ParticleSystem();
    this.audioManager = new AudioManager();
    
    this.backgroundCanvas = document.createElement('canvas');
    this.backgroundCtx = this.backgroundCanvas.getContext('2d')!;

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

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.eventBus.on('timeline:changed', (state: TimelineState) => {
      this.timelineState = state;
    });

    this.eventBus.on('particles:spawn', (particles: Particle[]) => {
      this.particleSystem.addParticles(particles);
    });

    this.eventBus.on('audio:play', (audioType: string) => {
      this.audioManager.play(audioType as any);
    });

    this.eventBus.on('audio:stop', (audioType: string) => {
      this.audioManager.stop(audioType as any);
    });

    this.eventBus.on('slot:error', () => {
      this.noiseTimer = 0.5;
    });

    this.eventBus.on('game:complete', () => {
      const completeDiv = document.getElementById('game-complete');
      if (completeDiv) {
        completeDiv.classList.add('show');
      }
    });
  }

  initialize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.clockCenterX = (width - 280) / 2;
    this.clockCenterY = height / 2;
    this.clockRadius = Math.min(width, height) * 0.225;

    this.canvas.width = width;
    this.canvas.height = height;
    this.backgroundCanvas.width = width;
    this.backgroundCanvas.height = height;

    this.createGears();
    this.renderStaticBackground();
    this.audioManager.initialize();
    this.audioManager.play('pendulum');
    this.audioManager.play('gears');
  }

  private createGears(): void {
    this.gears = [
      {
        x: this.clockCenterX,
        y: this.clockCenterY,
        radius: 80,
        teeth: 12,
        rotation: 0,
        speed: 0.3
      },
      {
        x: this.clockCenterX + 60,
        y: this.clockCenterY - 40,
        radius: 40,
        teeth: 8,
        rotation: Math.PI / 8,
        speed: -0.6
      },
      {
        x: this.clockCenterX - 50,
        y: this.clockCenterY + 50,
        radius: 40,
        teeth: 8,
        rotation: Math.PI / 4,
        speed: -0.6
      },
      {
        x: this.clockCenterX + 30,
        y: this.clockCenterY + 60,
        radius: 40,
        teeth: 8,
        rotation: Math.PI / 3,
        speed: -0.6
      }
    ];
  }

  private renderStaticBackground(): void {
    const ctx = this.backgroundCtx;
    const { width, height } = this;

    const bgGradient = ctx.createRadialGradient(
      width / 2 - 140, height / 2, 0,
      width / 2 - 140, height / 2, Math.max(width, height) / 1.5
    );
    bgGradient.addColorStop(0, '#5D4E37');
    bgGradient.addColorStop(0.5, '#3D2914');
    bgGradient.addColorStop(1, '#1a0f05');

    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    this.drawWoodGrain(ctx);
    this.drawGearTexture(ctx);
  }

  private drawWoodGrain(ctx: CanvasRenderingContext2D): void {
    const { width, height } = this;
    ctx.globalAlpha = 0.1;
    
    for (let i = 0; i < 50; i++) {
      const y = Math.random() * height;
      const gradient = ctx.createLinearGradient(0, y, width, y);
      gradient.addColorStop(0, 'transparent');
      gradient.addColorStop(0.3, '#8B6914');
      gradient.addColorStop(0.7, '#8B6914');
      gradient.addColorStop(1, 'transparent');
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.beginPath();
      ctx.moveTo(0, y + (Math.random() - 0.5) * 10);
      
      for (let x = 0; x < width; x += 50) {
        ctx.lineTo(x, y + Math.sin(x * 0.02 + i) * 5);
      }
      ctx.stroke();
    }
    
    ctx.globalAlpha = 1;
  }

  private drawGearTexture(ctx: CanvasRenderingContext2D): void {
    const { width, height } = this;
    ctx.globalAlpha = 0.05;
    
    for (let i = 0; i < 10; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const radius = 50 + Math.random() * 100;
      const teeth = Math.floor(8 + Math.random() * 16);
      
      this.drawGearShape(ctx, x, y, radius, teeth, 0, '#8B6914');
    }
    
    ctx.globalAlpha = 1;
  }

  render(fragments: Fragment[], slots: Slot[], deltaTime: number): void {
    const ctx = this.ctx;
    const { width, height } = this;

    ctx.clearRect(0, 0, width, height);

    ctx.drawImage(this.backgroundCanvas, 0, 0);

    this.drawSkyGradient(ctx);
    this.drawClockTowerFrame(ctx);
    this.drawClockDial(ctx);
    this.updateGears(deltaTime);
    this.drawGears(ctx);
    this.drawSlots(ctx, slots);
    this.drawFragments(ctx, fragments);
    this.particleSystem.update(deltaTime);
    this.particleSystem.render(ctx);
    this.drawClockHands(ctx);

    if (this.timelineState.darkness > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${this.timelineState.darkness})`;
      ctx.fillRect(0, 0, width, height);
    }

    if (this.noiseTimer > 0) {
      this.drawNoise(ctx);
      this.noiseTimer -= deltaTime;
    }

    if (this.singularityProgress > 0) {
      this.drawSingularity(ctx);
    }

    this.updateClockHands(deltaTime);
  }

  private drawSkyGradient(ctx: CanvasRenderingContext2D): void {
    const gradient = ctx.createRadialGradient(
      this.clockCenterX, this.clockCenterY, 0,
      this.clockCenterX, this.clockCenterY, this.clockRadius * 1.5
    );
    gradient.addColorStop(0, this.timelineState.skyGradient[0]);
    gradient.addColorStop(1, this.timelineState.skyGradient[1]);

    ctx.globalAlpha = 0.6;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.clockCenterX, this.clockCenterY, this.clockRadius * 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  private drawClockTowerFrame(ctx: CanvasRenderingContext2D): void {
    const centerX = this.clockCenterX;
    const centerY = this.clockCenterY;
    const frameRadius = this.clockRadius + 40;

    const frameGradient = ctx.createRadialGradient(
      centerX, centerY, this.clockRadius,
      centerX, centerY, frameRadius + 20
    );
    frameGradient.addColorStop(0, '#CD7F32');
    frameGradient.addColorStop(0.5, '#8B6914');
    frameGradient.addColorStop(1, '#3D2914');

    ctx.strokeStyle = frameGradient;
    ctx.lineWidth = 30;
    ctx.beginPath();
    ctx.arc(centerX, centerY, frameRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#CD7F32';
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      const x = centerX + Math.cos(angle) * (frameRadius + 15);
      const y = centerY + Math.sin(angle) * (frameRadius + 15);
      
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, this.clockRadius + 25, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, this.clockRadius - 5, 0, Math.PI * 2);
    ctx.stroke();
  }

  private drawClockDial(ctx: CanvasRenderingContext2D): void {
    const centerX = this.clockCenterX;
    const centerY = this.clockCenterY;
    const radius = this.clockRadius;

    const dialGradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, radius
    );
    dialGradient.addColorStop(0, '#2a1f10');
    dialGradient.addColorStop(0.7, '#3D2914');
    dialGradient.addColorStop(1, '#1a0f05');

    ctx.fillStyle = dialGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '14px "SimSun", "FangSong", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFD700';

    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12 - Math.PI / 2;
      const textRadius = radius - 25;
      const x = centerX + Math.cos(angle) * textRadius;
      const y = centerY + Math.sin(angle) * textRadius;

      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 5;
      ctx.fillText(CHINESE_HOURS[i], x, y);
      ctx.shadowBlur = 0;
    }

    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 2;
    for (let i = 0; i < 60; i++) {
      const angle = (Math.PI * 2 * i) / 60 - Math.PI / 2;
      const innerR = i % 5 === 0 ? radius - 45 : radius - 35;
      const outerR = radius - 15;
      
      ctx.beginPath();
      ctx.moveTo(
        centerX + Math.cos(angle) * innerR,
        centerY + Math.sin(angle) * innerR
      );
      ctx.lineTo(
        centerX + Math.cos(angle) * outerR,
        centerY + Math.sin(angle) * outerR
      );
      ctx.stroke();
    }
  }

  private updateGears(deltaTime: number): void {
    const speedMultiplier = this.timelineState.timeSpeed;
    
    for (const gear of this.gears) {
      gear.rotation += gear.speed * speedMultiplier * deltaTime;
    }
  }

  private drawGears(ctx: CanvasRenderingContext2D): void {
    for (const gear of this.gears) {
      this.drawGearShape(
        ctx,
        gear.x,
        gear.y,
        gear.radius,
        gear.teeth,
        gear.rotation,
        null
      );
    }
  }

  private drawGearShape(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    teeth: number,
    rotation: number,
    color: string | null
  ): void {
    const toothDepth = radius * 0.15;
    const toothWidth = (Math.PI * 2) / teeth / 2;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    const gradient = ctx.createRadialGradient(0, 0, radius * 0.3, 0, 0, radius);
    gradient.addColorStop(0, color || '#CD7F32');
    gradient.addColorStop(1, color || '#8B6914');

    ctx.fillStyle = gradient;
    ctx.beginPath();

    for (let i = 0; i < teeth; i++) {
      const angle1 = (Math.PI * 2 * i) / teeth - toothWidth / 2;
      const angle2 = angle1 + toothWidth;
      const angle3 = angle1 + toothWidth * 1.5;

      const innerR = radius - toothDepth;
      const outerR = radius;

      if (i === 0) {
        ctx.moveTo(Math.cos(angle1) * innerR, Math.sin(angle1) * innerR);
      }

      ctx.lineTo(Math.cos(angle1) * outerR, Math.sin(angle1) * outerR);
      ctx.lineTo(Math.cos(angle2) * outerR, Math.sin(angle2) * outerR);
      ctx.lineTo(Math.cos(angle2) * innerR, Math.sin(angle2) * innerR);
      ctx.arc(0, 0, innerR, angle2, angle3, true);
    }

    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#3D2914';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#CD7F32';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#1a0f05';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawSlots(ctx: CanvasRenderingContext2D, slots: Slot[]): void {
    for (const slot of slots) {
      const x = slot.x + slot.shakeOffset.x;
      const y = slot.y + slot.shakeOffset.y;
      const size = 45;

      if (slot.glowIntensity > 0) {
        const glowColor = slot.state === 'error' 
          ? `rgba(255, 50, 50, ${slot.glowIntensity * 0.8})`
          : `rgba(255, 215, 0, ${slot.glowIntensity * 0.6})`;
        
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 20 + slot.glowIntensity * 30;
      }

      this.drawHexagon(ctx, x, y, size, true);

      if (slot.state === 'active') {
        const colors = slot.requiredColors;
        const angleStep = (Math.PI * 2) / colors.length;
        
        for (let i = 0; i < colors.length; i++) {
          const angle = angleStep * i - Math.PI / 2;
          const dotX = x + Math.cos(angle) * 15;
          const dotY = y + Math.sin(angle) * 15;
          
          ctx.fillStyle = FRAGMENT_COLORS[colors[i]];
          ctx.shadowColor = FRAGMENT_COLORS[colors[i]];
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(dotX, dotY, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.shadowBlur = 0;
    }
  }

  private drawHexagon(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    isSlot: boolean
  ): void {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const px = x + Math.cos(angle) * size;
      const py = y + Math.sin(angle) * size;
      
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();

    if (isSlot) {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
      
      ctx.fillStyle = gradient;
      ctx.fill();
      
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }

  private drawFragments(ctx: CanvasRenderingContext2D, fragments: Fragment[]): void {
    for (const fragment of fragments) {
      this.drawFragment(ctx, fragment);
    }
  }

  private drawFragment(ctx: CanvasRenderingContext2D, fragment: Fragment): void {
    const { x, y, size, color, rotation, glowPhase, mergedFrom } = fragment;
    const baseColor = FRAGMENT_COLORS[color];

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    const glowIntensity = 0.5 + Math.sin(glowPhase) * 0.3;
    
    ctx.shadowColor = baseColor;
    ctx.shadowBlur = 15 + glowIntensity * 20;

    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const irregularity = mergedFrom ? 1.2 : 1 + (Math.sin(i * 2.5) * 0.1);
      const px = Math.cos(angle) * size * irregularity;
      const py = Math.sin(angle) * size * irregularity;
      
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();

    if (mergedFrom) {
      const gradient = ctx.createLinearGradient(-size, -size, size, size);
      gradient.addColorStop(0, baseColor);
      gradient.addColorStop(1, this.getMergedColor(color));
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = baseColor;
    }

    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(-size * 0.3, -size * 0.3, size * 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.restore();

    if (mergedFrom) {
      ctx.save();
      ctx.globalAlpha = 0.3 + glowIntensity * 0.3;
      ctx.strokeStyle = baseColor;
      ctx.lineWidth = 3;
      
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6 + rotation;
        const px = x + Math.cos(angle) * (size + 8);
        const py = y + Math.sin(angle) * (size + 8);
        
        if (i === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }
  }

  private getMergedColor(color: FragmentColor): string {
    const colorMap: Record<FragmentColor, string> = {
      red: '#FF8844',
      orange: '#FFAA00',
      yellow: '#88FF44',
      green: '#44FF88',
      blue: '#8844FF',
      purple: '#FF44AA'
    };
    return colorMap[color];
  }

  private updateClockHands(deltaTime: number): void {
    const speed = this.timelineState.timeSpeed;
    this.clockHandAngle += deltaTime * 0.5 * speed;
    this.hourHandAngle += deltaTime * 0.05 * speed;
  }

  private drawClockHands(ctx: CanvasRenderingContext2D): void {
    const centerX = this.clockCenterX;
    const centerY = this.clockCenterY;
    const radius = this.clockRadius;

    const isNight = this.timelineState.timeOfDay === 'night';

    if (isNight) {
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 20;
    }

    ctx.strokeStyle = isNight ? '#FFE066' : '#CD7F32';
    ctx.lineCap = 'round';

    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + Math.cos(this.hourHandAngle - Math.PI / 2) * radius * 0.5,
      centerY + Math.sin(this.hourHandAngle - Math.PI / 2) * radius * 0.5
    );
    ctx.stroke();

    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + Math.cos(this.clockHandAngle - Math.PI / 2) * radius * 0.7,
      centerY + Math.sin(this.clockHandAngle - Math.PI / 2) * radius * 0.7
    );
    ctx.stroke();

    ctx.shadowBlur = 0;

    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  private drawNoise(ctx: CanvasRenderingContext2D): void {
    const { width, height } = this;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      if (Math.random() < 0.1) {
        const value = Math.random() > 0.5 ? 255 : 0;
        const intensity = this.noiseTimer / 0.5;
        data[i] = data[i] * (1 - intensity) + value * intensity;
        data[i + 1] = data[i + 1] * (1 - intensity) + value * intensity;
        data[i + 2] = data[i + 2] * (1 - intensity) + value * intensity;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  setSingularityProgress(progress: number): void {
    this.singularityProgress = progress;
    
    if (progress > 0 && progress < 1) {
      this.spawnSingularityParticles();
    }
  }

  private spawnSingularityParticles(): void {
    if (Math.random() > 0.3) return;

    const centerX = this.clockCenterX;
    const centerY = this.clockCenterY;
    const colors = ['#FF4444', '#FF8800', '#FFDD00', '#44DD44', '#4488FF', '#AA44FF'];
    
    const particles: Particle[] = [];
    const count = 3;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = this.singularityProgress * Math.max(this.width, this.height) * 0.8;
      const speed = 100 + Math.random() * 200;

      particles.push({
        id: uuidv4(),
        x: centerX + Math.cos(angle) * dist,
        y: centerY + Math.sin(angle) * dist,
        vx: -Math.cos(angle) * speed,
        vy: -Math.sin(angle) * speed,
        size: 3 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: 1,
        life: 0.5,
        maxLife: 0.5,
        type: 'singularity'
      });
    }

    this.particleSystem.addParticles(particles);
  }

  private drawSingularity(ctx: CanvasRenderingContext2D): void {
    const centerX = this.clockCenterX;
    const centerY = this.clockCenterY;
    const maxRadius = Math.max(this.width, this.height);
    const currentRadius = this.singularityProgress * maxRadius;

    ctx.save();
    ctx.translate(centerX, centerY);

    for (let i = 0; i < 5; i++) {
      const spiralProgress = (this.singularityProgress + i * 0.1) % 1;
      const spiralRadius = spiralProgress * currentRadius;
      const rotation = this.singularityProgress * Math.PI * 8 + i * 0.5;

      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, spiralRadius);
      const colors = ['#FF4444', '#FF8800', '#FFDD00', '#44DD44', '#4488FF', '#AA44FF'];
      gradient.addColorStop(0, 'transparent');
      gradient.addColorStop(0.3, colors[i % colors.length] + '88');
      gradient.addColorStop(0.7, colors[(i + 2) % colors.length] + '44');
      gradient.addColorStop(1, 'transparent');

      ctx.rotate(rotation);
      ctx.fillStyle = gradient;
      ctx.globalAlpha = 0.6 - i * 0.1;

      ctx.beginPath();
      for (let a = 0; a < Math.PI * 4; a += 0.1) {
        const r = (a / (Math.PI * 4)) * spiralRadius;
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r;
        
        if (a === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();

    const coreGradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, currentRadius * 0.3
    );
    coreGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    coreGradient.addColorStop(0.3, 'rgba(255, 215, 0, 0.7)');
    coreGradient.addColorStop(1, 'transparent');

    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, currentRadius * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  clear(): void {
    this.particleSystem.clear();
  }

  setNoiseTimer(timer: number): void {
    this.noiseTimer = timer;
  }
}
