import { ParticleParams, PARTICLE_MAX_COUNT, Position } from '../engine/types';
import { hexToRgb, mixColors } from './Animations';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
}

export class ParticleEffect {
  private particles: Particle[] = [];
  private active: boolean = false;
  private startTime: number = 0;
  private params: ParticleParams | null = null;
  private flashAlpha: number = 0;
  private flashActive: boolean = false;

  startEffect(params: ParticleParams): void {
    this.params = params;
    this.active = true;
    this.startTime = Date.now();
    this.flashAlpha = 0;
    this.flashActive = false;
    this.particles = [];

    const count = Math.min(params.count, PARTICLE_MAX_COUNT);
    const baseColor = mixColors(params.colors);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = params.minRadius + Math.random() * (params.maxRadius - params.minRadius);
      const colorIdx = Math.floor(Math.random() * params.colors.length);
      const color = params.colors[colorIdx];
      const rgb = hexToRgb(Math.random() > 0.4 ? color : baseColor);

      this.particles.push({
        x: params.origin.x,
        y: params.origin.y,
        vx: Math.cos(angle) * speed / params.duration * 1000,
        vy: Math.sin(angle) * speed / params.duration * 1000,
        life: params.duration,
        maxLife: params.duration,
        size: params.minSize + Math.random() * (params.maxSize - params.minSize),
        color: `rgb(${rgb.r},${rgb.g},${rgb.b})`,
        alpha: 1,
      });
    }
  }

  update(deltaTime: number): void {
    if (!this.active) return;

    const elapsed = Date.now() - this.startTime;
    if (elapsed > (this.params?.duration ?? 2000) + 300) {
      this.flashAlpha = 0;
      this.flashActive = false;
      if (elapsed > (this.params?.duration ?? 2000) + 600) {
        this.active = false;
        this.particles = [];
        return;
      }
    }

    if (this.params && elapsed >= this.params.duration && !this.flashActive) {
      this.flashActive = true;
      this.flashAlpha = 1;
    }

    if (this.flashActive) {
      this.flashAlpha = Math.max(0, this.flashAlpha - deltaTime / 300);
    }

    for (const p of this.particles) {
      p.x += p.vx * (deltaTime / 1000);
      p.y += p.vy * (deltaTime / 1000);
      p.life -= deltaTime;
      p.alpha = Math.max(0, p.life / p.maxLife);
      p.size = Math.max(0.5, p.size * (1 - deltaTime / 3000));
    }

    this.particles = this.particles.filter(p => p.life > 0 && p.alpha > 0);
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, p.size), 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = p.alpha * 0.3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, p.size * 2), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (this.flashActive && this.flashAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = this.flashAlpha * 0.5;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.restore();
    }
  }

  isActive(): boolean {
    return this.active;
  }

  destroy(): void {
    this.active = false;
    this.particles = [];
    this.params = null;
    this.flashAlpha = 0;
    this.flashActive = false;
  }
}
