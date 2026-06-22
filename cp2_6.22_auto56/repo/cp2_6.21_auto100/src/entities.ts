import {
  random,
  randomInt,
  randomCrystalColor,
  CRYSTAL_COLORS,
  CRYSTAL_SCORES,
  CrystalColor,
  Vector2,
  generatePolygonPoints,
  interpolateColor,
  clamp,
  normalize
} from './utils';

export interface Entity {
  x: number;
  y: number;
  active: boolean;
  update(dt: number, speedMultiplier: number): void;
  render(ctx: CanvasRenderingContext2D): void;
}

export class Crystal implements Entity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: CrystalColor;
  score: number;
  active: boolean = true;
  phase: number;
  bounds: { width: number; height: number };

  constructor(bounds: { width: number; height: number }) {
    this.bounds = bounds;
    this.radius = random(5, 15);
    this.x = random(this.radius, bounds.width - this.radius);
    this.y = random(this.radius, bounds.height * 0.75 - this.radius);
    const angle = random(0, Math.PI * 2);
    const speed = random(0.2, 0.5);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.color = randomCrystalColor();
    this.score = CRYSTAL_SCORES[this.color];
    this.phase = random(0, Math.PI * 2);
  }

  update(dt: number, speedMultiplier: number): void {
    this.x += this.vx * dt * 60 * speedMultiplier;
    this.y += this.vy * dt * 60 * speedMultiplier;
    this.phase += dt * 2;

    if (this.x - this.radius <= 0 || this.x + this.radius >= this.bounds.width) {
      this.vx *= -1;
      this.x = clamp(this.x, this.radius, this.bounds.width - this.radius);
    }
    if (this.y - this.radius <= 0 || this.y + this.radius >= this.bounds.height * 0.75) {
      this.vy *= -1;
      this.y = clamp(this.y, this.radius, this.bounds.height * 0.75 - this.radius);
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const color = CRYSTAL_COLORS[this.color];
    const pulse = 1 + Math.sin(this.phase) * 0.1;
    const r = this.radius * pulse;

    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(this.x - r * 0.25, this.y - r * 0.25, r * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export class Ship implements Entity {
  x: number;
  y: number;
  size: number = 40;
  active: boolean = true;
  bounds: { width: number; height: number };

  constructor(bounds: { width: number; height: number }) {
    this.bounds = bounds;
    this.x = bounds.width / 2;
    this.y = bounds.height - 60;
  }

  update(dt: number, _speedMultiplier: number): void {
    this.x = this.bounds.width / 2;
    this.y = this.bounds.height - 60;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const s = this.size;
    ctx.save();
    ctx.translate(this.x, this.y);

    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 20;

    const gradient = ctx.createLinearGradient(0, -s * 0.6, 0, s * 0.5);
    gradient.addColorStop(0, '#00ffff');
    gradient.addColorStop(1, '#0066cc');
    ctx.fillStyle = gradient;

    ctx.beginPath();
    ctx.moveTo(0, -s * 0.6);
    ctx.lineTo(-s * 0.5, s * 0.5);
    ctx.lineTo(0, s * 0.3);
    ctx.lineTo(s * 0.5, s * 0.5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 165, 0, 0.9)';
    ctx.beginPath();
    ctx.moveTo(-s * 0.15, s * 0.45);
    ctx.lineTo(0, s * 0.75 + Math.random() * s * 0.1);
    ctx.lineTo(s * 0.15, s * 0.45);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  getCollisionRadius(): number {
    return this.size * 0.4;
  }
}

export class Laser implements Entity {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  startX: number;
  startY: number;
  progress: number = 0;
  speed: number = 0.012;
  active: boolean = true;
  trail: { x: number; y: number; alpha: number }[] = [];
  maxTrailLength: number = 30;

  constructor(startX: number, startY: number, targetX: number, targetY: number) {
    this.startX = startX;
    this.startY = startY;
    this.x = startX;
    this.y = startY;
    this.targetX = targetX;
    this.targetY = targetY;
  }

  update(dt: number, _speedMultiplier: number): void {
    this.progress += this.speed * dt * 60;

    if (this.progress >= 1) {
      this.active = false;
      return;
    }

    const easedProgress = 1 - Math.pow(1 - this.progress, 2);
    this.x = this.startX + (this.targetX - this.startX) * easedProgress;
    this.y = this.startY + (this.targetY - this.startY) * easedProgress;

    this.trail.push({ x: this.x, y: this.y, alpha: 1 });
    if (this.trail.length > this.maxTrailLength) {
      this.trail.shift();
    }

    this.trail.forEach((p, i) => {
      p.alpha = i / this.trail.length;
    });
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.trail.length >= 2) {
      for (let i = 1; i < this.trail.length; i++) {
        const prev = this.trail[i - 1];
        const curr = this.trail[i];
        const alpha = curr.alpha * 0.9;
        const colorT = curr.alpha;
        const color = interpolateColor('#00ffff', '#ff00ff', colorT);

        ctx.save();
        ctx.strokeStyle = color;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 3 * curr.alpha;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(curr.x, curr.y);
        ctx.stroke();
        ctx.restore();
      }
    }

    if (this.trail.length > 0) {
      const last = this.trail[this.trail.length - 1];
      ctx.save();
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(last.x, last.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  getHeadPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }
}

export class Meteor implements Entity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  active: boolean = true;
  bounds: { width: number; height: number };
  polygonPoints: Vector2[];
  rotation: number = 0;
  rotationSpeed: number;
  trailParticles: { x: number; y: number; alpha: number; size: number }[] = [];
  maxTrailParticles: number = 5;
  woodTexture: CanvasPattern | null = null;
  woodStripeOffsets: number[] = [];

  constructor(bounds: { width: number; height: number }, speedMultiplier: number) {
    this.bounds = bounds;
    this.radius = random(20, 35);

    const edge = randomInt(0, 3);
    switch (edge) {
      case 0:
        this.x = random(0, bounds.width);
        this.y = -this.radius;
        break;
      case 1:
        this.x = bounds.width + this.radius;
        this.y = random(0, bounds.height);
        break;
      case 2:
        this.x = random(0, bounds.width);
        this.y = bounds.height + this.radius;
        break;
      default:
        this.x = -this.radius;
        this.y = random(0, bounds.height);
        break;
    }

    let dirX: number, dirY: number;
    if (edge === 0) {
      dirX = random(-1, 1);
      dirY = random(0.3, 1);
    } else if (edge === 2) {
      dirX = random(-1, 1);
      dirY = random(-1, -0.3);
    } else if (edge === 1) {
      dirX = random(-1, -0.3);
      dirY = random(-1, 1);
    } else {
      dirX = random(0.3, 1);
      dirY = random(-1, 1);
    }

    const dir = normalize({ x: dirX, y: dirY });
    const speed = random(1, 2) * speedMultiplier;
    this.vx = dir.x * speed;
    this.vy = dir.y * speed;

    const sides = randomInt(9, 14);
    this.polygonPoints = [];
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2 + random(-0.2, 0.2);
      const irregularity = random(0.25, 0.5);
      const r = this.radius * (1 - irregularity / 2 + Math.random() * irregularity);
      this.polygonPoints.push({
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r
      });
    }

    this.woodStripeOffsets = [];
    const stripeCount = randomInt(5, 8);
    for (let i = 0; i < stripeCount; i++) {
      this.woodStripeOffsets.push(random(-this.radius * 0.8, this.radius * 0.8));
    }

    this.rotationSpeed = random(-0.02, 0.02);
    this.generateWoodTexture();
  }

  private generateWoodTexture(): void {
    const texSize = Math.ceil(this.radius * 2.5);
    const texCanvas = document.createElement('canvas');
    texCanvas.width = texSize;
    texCanvas.height = texSize;
    const texCtx = texCanvas.getContext('2d');
    if (!texCtx) return;

    const baseGradient = texCtx.createRadialGradient(
      texSize / 2, texSize / 2, 0,
      texSize / 2, texSize / 2, texSize / 2
    );
    baseGradient.addColorStop(0, '#8B4513');
    baseGradient.addColorStop(0.4, '#6B3410');
    baseGradient.addColorStop(1, '#3E1F0A');
    texCtx.fillStyle = baseGradient;
    texCtx.fillRect(0, 0, texSize, texSize);

    const stripes = 12;
    for (let i = 0; i < stripes; i++) {
      const y = (i / stripes) * texSize + random(-4, 4);
      const thickness = random(1, 3);
      const darkness = random(0, 0.35);
      texCtx.strokeStyle = `rgba(20, 8, 0, ${darkness})`;
      texCtx.lineWidth = thickness;
      texCtx.beginPath();
      texCtx.moveTo(0, y);
      for (let x = 0; x <= texSize; x += 5) {
        const wobble = Math.sin((x + i * 20) * 0.05) * 3 + random(-1, 1);
        texCtx.lineTo(x, y + wobble);
      }
      texCtx.stroke();
    }

    for (let i = 0; i < stripes / 2; i++) {
      const y = (i / (stripes / 2)) * texSize + random(-6, 6);
      const thickness = random(0.5, 1.5);
      texCtx.strokeStyle = `rgba(180, 120, 70, ${random(0.15, 0.3)})`;
      texCtx.lineWidth = thickness;
      texCtx.beginPath();
      texCtx.moveTo(0, y);
      for (let x = 0; x <= texSize; x += 4) {
        const wobble = Math.sin((x + i * 30) * 0.04) * 2 + random(-0.5, 0.5);
        texCtx.lineTo(x, y + wobble);
      }
      texCtx.stroke();
    }

    this.woodTexture = texCtx.createPattern(texCanvas, 'repeat');
  }

  update(dt: number, speedMultiplier: number): void {
    this.x += this.vx * dt * 60 * speedMultiplier;
    this.y += this.vy * dt * 60 * speedMultiplier;
    this.rotation += this.rotationSpeed * dt * 60;

    this.trailParticles.unshift({
      x: this.x,
      y: this.y,
      alpha: 0.5,
      size: this.radius * 0.6
    });
    if (this.trailParticles.length > this.maxTrailParticles) {
      this.trailParticles.pop();
    }
    this.trailParticles.forEach((p, i) => {
      p.alpha = (1 - i / this.maxTrailParticles) * 0.4;
      p.size = this.radius * 0.6 * (1 - i / this.maxTrailParticles);
    });

    const margin = this.radius * 2;
    if (
      this.x < -margin ||
      this.x > this.bounds.width + margin ||
      this.y < -margin ||
      this.y > this.bounds.height + margin
    ) {
      this.active = false;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.trailParticles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = '#ff6633';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    ctx.beginPath();
    ctx.moveTo(this.polygonPoints[0].x, this.polygonPoints[0].y);
    for (let i = 1; i < this.polygonPoints.length; i++) {
      ctx.lineTo(this.polygonPoints[i].x, this.polygonPoints[i].y);
    }
    ctx.closePath();

    if (this.woodTexture) {
      ctx.fillStyle = this.woodTexture;
    } else {
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
      gradient.addColorStop(0, '#8B4513');
      gradient.addColorStop(0.4, '#6B3410');
      gradient.addColorStop(1, '#3E1F0A');
      ctx.fillStyle = gradient;
    }
    ctx.fill();

    ctx.strokeStyle = '#2A1405';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.clip();

    const highlightGradient = ctx.createRadialGradient(
      -this.radius * 0.3, -this.radius * 0.3, 0,
      0, 0, this.radius
    );
    highlightGradient.addColorStop(0, 'rgba(255, 180, 100, 0.25)');
    highlightGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = highlightGradient;
    ctx.fillRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);

    ctx.restore();

    ctx.restore();
  }

  getCollisionRadius(): number {
    return this.radius * 0.85;
  }
}

export class Particle implements Entity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
  active: boolean = true;

  constructor(x: number, y: number, color: string) {
    this.x = x;
    this.y = y;
    const angle = random(0, Math.PI * 2);
    const speed = random(1, 4);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius = random(1, 3);
    this.color = color;
    this.alpha = 1;
    this.decay = random(0.015, 0.035);
  }

  update(dt: number, _speedMultiplier: number): void {
    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60;
    this.vx *= 0.98;
    this.vy *= 0.98;
    this.alpha -= this.decay * dt * 60;
    if (this.alpha <= 0) {
      this.active = false;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export class ScorePopup implements Entity {
  x: number;
  y: number;
  score: number;
  alpha: number = 1;
  active: boolean = true;
  startTime: number;
  duration: number = 1000;
  startY: number;
  riseDistance: number = 40;

  constructor(x: number, y: number, score: number) {
    this.x = x;
    this.y = y;
    this.startY = y;
    this.score = score;
    this.startTime = performance.now();
  }

  update(_dt: number, _speedMultiplier: number): void {
    const elapsed = performance.now() - this.startTime;
    const progress = Math.min(elapsed / this.duration, 1);

    this.y = this.startY - this.riseDistance * progress;
    this.alpha = 1 - progress;

    if (progress >= 1) {
      this.active = false;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.font = '18px Arial, sans-serif';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.lineWidth = 3;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText(`+${this.score}`, this.x, this.y);
    ctx.fillText(`+${this.score}`, this.x, this.y);
    ctx.restore();
  }
}

export class SoundManager {
  private audioContext: AudioContext | null = null;
  private initialized: boolean = false;
  private masterGain: GainNode | null = null;

  public init(): void {
    if (this.initialized) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.audioContext.destination);
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  private ensureContext(): void {
    if (!this.audioContext || !this.masterGain) return;
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  public playLaser(): void {
    if (!this.audioContext || !this.masterGain || !this.initialized) return;
    this.ensureContext();

    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const duration = 0.15;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + duration);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playCollect(pitch: number = 1): void {
    if (!this.audioContext || !this.masterGain || !this.initialized) return;
    this.ensureContext();

    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const duration = 0.12;
    const baseFreq = 880 * pitch;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(baseFreq, now);
    osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + duration * 0.5);
    osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.2, now + duration);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(baseFreq * 2, now);
    osc2.frequency.exponentialRampToValueAtTime(baseFreq * 2.5, now + duration * 0.3);
    osc2.frequency.exponentialRampToValueAtTime(baseFreq * 1.8, now + duration);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration + 0.02);
    osc2.stop(now + duration + 0.02);
  }

  public playGameOver(): void {
    if (!this.audioContext || !this.masterGain || !this.initialized) return;
    this.ensureContext();

    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const duration = 0.3;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + duration);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
    gain.gain.linearRampToValueAtTime(0.15, now + duration * 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(100, now);
    osc2.frequency.exponentialRampToValueAtTime(40, now + duration);

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.2, now + 0.03);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc2.connect(gain2);
    gain2.connect(this.masterGain);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + duration + 0.05);
    osc2.stop(now + duration + 0.05);
  }

  public setVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }
}
