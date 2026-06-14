import type { BeatSignal } from '../audio/AudioEngine';

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  r: number;
  g: number;
  b: number;
  hasTrail: boolean;
};

type StarParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  r: number;
  g: number;
  b: number;
};

type JudgmentType = 'perfect' | 'good' | 'miss';

const RING_SEGMENTS = 16;
const RING_BASE_RADIUS = 120;
const CENTER_COLOR = { r: 251, g: 191, b: 36 };
const OUTER_COLOR = { r: 239, g: 68, b: 68 };
const PERFECT_COLOR_START = { r: 249, g: 115, b: 22 };
const PERFECT_COLOR_END = { r: 34, g: 197, b: 94 };
const MAX_PARTICLES = 1000;
const MISS_FLASH_DURATION = 0.2;
const PULSE_DURATION = 0.05;
const STAR_COUNT = 500;
const STAR_DURATION = 3;

export class ParticleEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private starParticles: StarParticle[] = [];
  private ringScale = 1;
  private ringScaleTarget = 1;
  private segmentPulse: number[] = new Array(RING_SEGMENTS).fill(0);
  private missFlashTimer = 0;
  private haloAngle = 0;
  private centerX: number;
  private centerY: number;
  private canvasWidth: number;
  private canvasHeight: number;
  private effectLevel = 0;
  private beatIntensity = 0;
  private waveformNormalized: number[] = [];
  private lastTime = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.canvasWidth = canvas.width;
    this.canvasHeight = canvas.height;
    this.centerX = this.canvasWidth / 2;
    this.centerY = this.canvasHeight / 2;
  }

  resize(w: number, h: number) {
    this.canvasWidth = w;
    this.canvasHeight = h;
    this.canvas.width = w;
    this.canvas.height = h;
    this.centerX = w / 2;
    this.centerY = h / 2;
  }

  setEffectLevel(level: number) {
    this.effectLevel = level;
  }

  onBeat(beat: BeatSignal) {
    this.beatIntensity = beat.intensity;
    this.ringScaleTarget = 0.8 + beat.intensity * 0.5;

    for (let i = 0; i < RING_SEGMENTS; i++) {
      if (Math.random() < 0.6) {
        this.segmentPulse[i] = PULSE_DURATION;
      }
    }
  }

  onWaveform(data: Uint8Array) {
    this.waveformNormalized = [];
    const step = Math.floor(data.length / 200);
    for (let i = 0; i < 200; i++) {
      this.waveformNormalized.push((data[i * step] - 128) / 128);
    }
  }

  onJudgment(type: JudgmentType) {
    const cx = this.centerX;
    const cy = this.centerY;

    if (type === 'perfect') {
      this.spawnBurstParticles(cx, cy, this.getParticleCount(30), true);
    } else if (type === 'good') {
      this.spawnBurstParticles(cx, cy, this.getParticleCount(15), false);
    } else {
      this.missFlashTimer = MISS_FLASH_DURATION;
    }
  }

  triggerStarburst() {
    this.starParticles = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 300;
      this.starParticles.push({
        x: this.centerX,
        y: this.centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: STAR_DURATION,
        maxLife: STAR_DURATION,
        size: 1 + Math.random() * 3,
        r: Math.random() * 255,
        g: Math.random() * 255,
        b: Math.random() * 255
      });
    }
  }

  private getParticleCount(base: number): number {
    return this.effectLevel >= 1 ? base * 2 : base;
  }

  private getParticleSize(): { min: number; max: number } {
    const sizeMul = this.effectLevel >= 1 ? 1.5 : 1;
    return { min: 2 * sizeMul, max: 6 * sizeMul };
  }

  private spawnBurstParticles(cx: number, cy: number, count: number, isPerfect: boolean) {
    const sizeRange = this.getParticleSize();
    const hasTrail = this.effectLevel >= 2;

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= MAX_PARTICLES) break;

      const angle = Math.random() * Math.PI * 2;
      const speed = 200 + Math.random() * 200;
      const t = Math.random();
      const r = Math.round(PERFECT_COLOR_START.r + (PERFECT_COLOR_END.r - PERFECT_COLOR_START.r) * t);
      const g = Math.round(PERFECT_COLOR_START.g + (PERFECT_COLOR_END.g - PERFECT_COLOR_START.g) * t);
      const b = Math.round(PERFECT_COLOR_START.b + (PERFECT_COLOR_END.b - PERFECT_COLOR_START.b) * t);

      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        size: sizeRange.min + Math.random() * (sizeRange.max - sizeRange.min),
        r, g, b,
        hasTrail
      });
    }
  }

  render(timestamp: number) {
    const dt = this.lastTime ? (timestamp - this.lastTime) / 1000 : 0.016;
    this.lastTime = timestamp;

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    this.updateAndDrawStarburst(ctx, dt);
    this.updateAndDrawRing(ctx, dt);
    this.updateAndDrawParticles(ctx, dt);
    this.drawWaveform(ctx);

    if (this.missFlashTimer > 0) {
      this.missFlashTimer -= dt;
    }
  }

  private updateAndDrawRing(ctx: CanvasRenderingContext2D, dt: number) {
    const scaleDiff = this.ringScaleTarget - this.ringScale;
    this.ringScale += scaleDiff * Math.min(1, dt / 0.1);
    this.ringScaleTarget += (1 - this.ringScaleTarget) * Math.min(1, dt / 0.3);

    const radius = RING_BASE_RADIUS * this.ringScale;
    const cx = this.centerX;
    const cy = this.centerY;
    const segAngle = (Math.PI * 2) / RING_SEGMENTS;

    const isMissFlash = this.missFlashTimer > 0;

    for (let i = 0; i < RING_SEGMENTS; i++) {
      const startAngle = i * segAngle - Math.PI / 2;
      const endAngle = startAngle + segAngle;

      this.segmentPulse[i] = Math.max(0, this.segmentPulse[i] - dt);

      const pulseBrightness = this.segmentPulse[i] > 0 ? 1.5 : 1;

      const innerR = radius * 0.5;
      const outerR = radius;

      const gradient = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);

      if (isMissFlash) {
        gradient.addColorStop(0, 'rgba(239, 68, 68, 1)');
        gradient.addColorStop(1, 'rgba(239, 68, 68, 0.6)');
      } else {
        const cR = Math.min(255, Math.round(CENTER_COLOR.r * pulseBrightness));
        const cG = Math.min(255, Math.round(CENTER_COLOR.g * pulseBrightness));
        const cB = Math.min(255, Math.round(CENTER_COLOR.b * pulseBrightness));
        const oR = Math.min(255, Math.round(OUTER_COLOR.r * pulseBrightness));
        const oG = Math.min(255, Math.round(OUTER_COLOR.g * pulseBrightness));
        const oB = Math.min(255, Math.round(OUTER_COLOR.b * pulseBrightness));

        gradient.addColorStop(0, `rgba(${cR}, ${cG}, ${cB}, 0.9)`);
        gradient.addColorStop(1, `rgba(${oR}, ${oG}, ${oB}, 0.7)`);
      }

      ctx.beginPath();
      ctx.moveTo(cx + innerR * Math.cos(startAngle), cy + innerR * Math.sin(startAngle));
      ctx.arc(cx, cy, outerR, startAngle, endAngle);
      ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    if (this.effectLevel >= 3) {
      this.drawHaloRing(ctx, cx, cy, radius, dt);
    }
  }

  private drawHaloRing(ctx: CanvasRenderingContext2D, cx: number, cy: number, baseRadius: number, dt: number) {
    this.haloAngle += 0.5 * dt;
    const haloRadius = baseRadius + 20;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.haloAngle);

    const dashCount = 32;
    const dashAngle = (Math.PI * 2) / dashCount;

    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.7;
    ctx.setLineDash([8, 12]);

    ctx.beginPath();
    ctx.arc(0, 0, haloRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  private updateAndDrawParticles(ctx: CanvasRenderingContext2D, dt: number) {
    const alive: Particle[] = [];

    for (const p of this.particles) {
      p.life -= dt;
      if (p.life <= 0) continue;

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      const alpha = Math.max(0, p.life / p.maxLife);

      if (p.hasTrail && this.effectLevel >= 2) {
        const trailLen = 10;
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > 0) {
          const nx = -p.vx / speed;
          const ny = -p.vy / speed;
          const trailGrad = ctx.createLinearGradient(p.x, p.y, p.x + nx * trailLen, p.y + ny * trailLen);
          trailGrad.addColorStop(0, `rgba(${p.r}, ${p.g}, ${p.b}, ${alpha * 0.3})`);
          trailGrad.addColorStop(1, `rgba(${p.r}, ${p.g}, ${p.b}, 0)`);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + nx * trailLen, p.y + ny * trailLen);
          ctx.strokeStyle = trailGrad;
          ctx.lineWidth = p.size * 0.6;
          ctx.stroke();
        }
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${alpha})`;
      ctx.fill();

      alive.push(p);
    }

    this.particles = alive;
  }

  private updateAndDrawStarburst(ctx: CanvasRenderingContext2D, dt: number) {
    if (this.starParticles.length === 0) return;

    const alive: StarParticle[] = [];
    for (const p of this.starParticles) {
      p.life -= dt;
      if (p.life <= 0) continue;

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${Math.round(p.r)}, ${Math.round(p.g)}, ${Math.round(p.b)}, ${alpha * 0.8})`;
      ctx.fill();

      alive.push(p);
    }
    this.starParticles = alive;
  }

  private drawWaveform(ctx: CanvasRenderingContext2D) {
    if (this.waveformNormalized.length === 0) return;

    const waveHeight = 80;
    const waveY = this.canvasHeight - waveHeight;
    const width = this.canvasWidth;
    const len = this.waveformNormalized.length;

    const gradient = ctx.createLinearGradient(0, waveY, width, waveY);
    gradient.addColorStop(0, '#60a5fa');
    gradient.addColorStop(1, '#a78bfa');

    ctx.beginPath();
    ctx.moveTo(0, waveY + waveHeight / 2);

    for (let i = 0; i < len; i++) {
      const x = (i / len) * width;
      const y = waveY + waveHeight / 2 + this.waveformNormalized[i] * (waveHeight / 2);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, waveY + waveHeight / 2);
    for (let i = 0; i < len; i++) {
      const x = (i / len) * width;
      const y = waveY + waveHeight / 2 + this.waveformNormalized[i] * (waveHeight / 2);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.lineTo(width, waveY + waveHeight);
    ctx.lineTo(0, waveY + waveHeight);
    ctx.closePath();

    const fillGradient = ctx.createLinearGradient(0, waveY, 0, waveY + waveHeight);
    fillGradient.addColorStop(0, 'rgba(96, 165, 250, 0.3)');
    fillGradient.addColorStop(1, 'rgba(167, 139, 250, 0.05)');
    ctx.fillStyle = fillGradient;
    ctx.fill();
  }
}
