export interface ParticleOptions {
  x: number;
  y: number;
  color: string;
}

export class ParticleEffect {
  particles: Particle[];
  age: number;
  duration: number;
  finished: boolean;

  constructor(options: ParticleOptions) {
    this.age = 0;
    this.duration = 300;
    this.finished = false;
    this.particles = [];

    const count = 12;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 1.5 + Math.random() * 2.5;
      const size = 3 + Math.random() * 2;
      this.particles.push({
        x: options.x,
        y: options.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size,
        color: options.color,
        opacity: 0.8,
      });
    }
  }

  update(dt: number): void {
    if (this.finished) return;
    this.age += dt;

    const t = Math.min(this.age / this.duration, 1);
    const eased = 1 - (1 - t) * (1 - t);

    for (const p of this.particles) {
      p.x += p.vx * (dt / 16);
      p.y += p.vy * (dt / 16);
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.opacity = 0.8 * (1 - eased);
      p.size *= 0.995;
    }

    if (t >= 1) {
      this.finished = true;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.finished) return;

    ctx.save();
    for (const p of this.particles) {
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  opacity: number;
}
