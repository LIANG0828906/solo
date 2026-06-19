import { randRange, clamp } from './types';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  startSize: number;
  colorStart: { r: number; g: number; b: number };
  colorEnd: { r: number; g: number; b: number };
}

export const MAX_PARTICLES = 200;

export class ParticleSystem {
  particles: Particle[] = [];

  spawnExplosion(x: number, y: number, count: number = 20): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = randRange(2, 5);
      const radius = randRange(30, 50);
      const life = 0.6;
      this.addParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        maxLife: life,
        size: randRange(2, 5),
        startSize: randRange(4, 6),
        colorStart: { r: 255, g: 200, b: 50 },
        colorEnd: { r: 200, g: 60, b: 20 }
      });
    }
  }

  spawnTrail(x: number, y: number, angle: number, count: number = 5): void {
    for (let i = 0; i < count; i++) {
      const spread = (Math.random() - 0.5) * 0.4;
      const dir = angle + Math.PI + spread;
      const speed = randRange(1, 3);
      const life = 0.3;
      this.addParticle({
        x,
        y,
        vx: Math.cos(dir) * speed + (Math.random() - 0.5),
        vy: Math.sin(dir) * speed + (Math.random() - 0.5),
        life,
        maxLife: life,
        size: 3 - i * 0.4,
        startSize: 3 - i * 0.4,
        colorStart: { r: 255, g: 230, b: 100 },
        colorEnd: { r: 255, g: 50, b: 30 }
      });
    }
  }

  private addParticle(p: Particle): void {
    if (this.particles.length >= MAX_PARTICLES) {
      this.particles.shift();
    }
    this.particles.push(p);
  }

  update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      p.vx *= 0.98;
      p.vy *= 0.98;
    }
  }

  getParticleColor(p: Particle): string {
    const t = clamp(1 - p.life / p.maxLife, 0, 1);
    const r = Math.round(p.colorStart.r + (p.colorEnd.r - p.colorStart.r) * t);
    const g = Math.round(p.colorStart.g + (p.colorEnd.g - p.colorStart.g) * t);
    const b = Math.round(p.colorStart.b + (p.colorEnd.b - p.colorStart.b) * t);
    const alpha = clamp(p.life / p.maxLife, 0, 1);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  getParticleSize(p: Particle): number {
    const t = clamp(p.life / p.maxLife, 0, 1);
    return p.startSize * t;
  }
}
