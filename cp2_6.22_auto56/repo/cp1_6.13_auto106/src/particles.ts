import { Particle, CONFIG } from './types';

export class ParticleSystem {
  private pool: Particle[];
  private maxParticles: number;

  constructor(maxParticles: number = CONFIG.MAX_PARTICLES) {
    this.maxParticles = maxParticles;
    this.pool = [];

    for (let i = 0; i < maxParticles; i++) {
      this.pool.push({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 1,
        color: '#FFFFFF',
        size: 3,
        active: false
      });
    }
  }

  spawn(
    x: number,
    y: number,
    vx: number,
    vy: number,
    color: string,
    size: number = 4,
    life: number = 0.5
  ): boolean {
    for (const particle of this.pool) {
      if (!particle.active) {
        particle.x = x;
        particle.y = y;
        particle.vx = vx;
        particle.vy = vy;
        particle.color = color;
        particle.size = size;
        particle.life = life;
        particle.maxLife = life;
        particle.active = true;
        return true;
      }
    }
    return false;
  }

  spawnBurst(
    x: number,
    y: number,
    count: number,
    color: string,
    speed: number = 100,
    size: number = 4,
    life: number = 0.5
  ): number {
    let spawned = 0;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const spd = speed * (0.5 + Math.random() * 0.5);
      const vx = Math.cos(angle) * spd;
      const vy = Math.sin(angle) * spd;

      if (this.spawn(x, y, vx, vy, color, size, life)) {
        spawned++;
      }
    }
    return spawned;
  }

  update(deltaTime: number): void {
    for (const particle of this.pool) {
      if (!particle.active) continue;

      particle.life -= deltaTime;

      if (particle.life <= 0) {
        particle.active = false;
        continue;
      }

      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;

      particle.vx *= 0.98;
      particle.vy *= 0.98;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const particle of this.pool) {
      if (!particle.active) continue;

      const alpha = particle.life / particle.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  getActiveParticles(): Particle[] {
    return this.pool.filter(p => p.active);
  }

  getActiveCount(): number {
    return this.pool.filter(p => p.active).length;
  }

  clear(): void {
    for (const particle of this.pool) {
      particle.active = false;
    }
  }

  reset(): void {
    this.clear();
  }
}
