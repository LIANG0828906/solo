export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  color: string;
  startTime: number;
  duration: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];

  createWave(x: number, y: number, color: string) {
    const count = 30;
    const now = performance.now();
    const duration = 1000;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = (60 - 5) / duration;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 5,
        alpha: 1,
        color,
        startTime: now,
        duration,
      });
    }
  }

  updateAndDraw(ctx: CanvasRenderingContext2D): number {
    const now = performance.now();
    const remaining: Particle[] = [];

    for (const p of this.particles) {
      const elapsed = now - p.startTime;
      const progress = elapsed / p.duration;

      if (progress >= 1) continue;

      p.radius = 5 + progress * 55;
      p.alpha = 1 - progress;
      p.x += p.vx * 16;
      p.y += p.vy * 16;

      if (p.radius >= 60) continue;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color + Math.floor(p.alpha * 255).toString(16).padStart(2, '0');
      ctx.fill();

      remaining.push(p);
    }

    this.particles = remaining;
    return this.particles.length;
  }

  clear() {
    this.particles = [];
  }
}

export const particleSystem = new ParticleSystem();
