import { eventBus } from './EventBus';
import type { Particle, RGBColor } from './types';
import {
  COLOR_PALETTE,
  GRAVITY,
  ELASTICITY,
  PARTICLE_LIFESPAN,
  generateId,
  hexToRgb,
} from './types';

export class ParticleEmitter {
  private particles: Map<string, Particle> = new Map();
  private canvasWidth: number = 0;
  private canvasHeight: number = 0;
  private lastEmitTime: number = 0;
  private emitInterval: number = 30;

  setCanvasSize(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  createParticle(x: number, y: number, vx: number, vy: number): Particle {
    const diameter = 6 + Math.random() * 6;
    const radius = diameter / 2;
    const colorHex = COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
    const color: RGBColor = hexToRgb(colorHex);

    const particle: Particle = {
      id: generateId(),
      x,
      y,
      vx,
      vy,
      radius,
      color,
      createdAt: performance.now(),
      lifespan: PARTICLE_LIFESPAN,
    };

    this.particles.set(particle.id, particle);
    eventBus.emit('particleCreated', particle);
    return particle;
  }

  emit(x: number, y: number, directionX: number, directionY: number): void {
    const now = performance.now();
    if (now - this.lastEmitTime < this.emitInterval) return;
    this.lastEmitTime = now;

    const speed = 3 + Math.random() * 2;
    const len = Math.sqrt(directionX * directionX + directionY * directionY) || 1;
    const vx = (directionX / len) * speed + (Math.random() - 0.5) * 2;
    const vy = (directionY / len) * speed + (Math.random() - 0.5) * 2;

    this.createParticle(x, y, vx, vy);
  }

  update(deltaTime: number): Particle[] {
    const now = performance.now();
    const gravityFactor = deltaTime / 16.67;

    const toRemove: string[] = [];

    this.particles.forEach((p) => {
      const age = now - p.createdAt;
      if (age >= p.lifespan) {
        toRemove.push(p.id);
        return;
      }

      p.vy += GRAVITY * gravityFactor;
      p.x += p.vx * gravityFactor;
      p.y += p.vy * gravityFactor;

      if (p.x - p.radius < 0) {
        p.x = p.radius;
        p.vx = -p.vx * ELASTICITY;
      } else if (p.x + p.radius > this.canvasWidth) {
        p.x = this.canvasWidth - p.radius;
        p.vx = -p.vx * ELASTICITY;
      }

      if (p.y - p.radius < 0) {
        p.y = p.radius;
        p.vy = -p.vy * ELASTICITY;
      } else if (p.y + p.radius > this.canvasHeight) {
        p.y = this.canvasHeight - p.radius;
        p.vy = -p.vy * ELASTICITY;
        p.vx *= 0.98;
      }
    });

    toRemove.forEach((id) => this.particles.delete(id));

    const particleList = Array.from(this.particles.values());
    eventBus.emit('particleUpdated', particleList);
    return particleList;
  }

  addParticle(particle: Particle): void {
    this.particles.set(particle.id, particle);
  }

  removeParticles(ids: string[]): void {
    ids.forEach((id) => this.particles.delete(id));
  }

  getParticles(): Particle[] {
    return Array.from(this.particles.values());
  }

  clear(): void {
    this.particles.clear();
  }
}

export const particleEmitter = new ParticleEmitter();
