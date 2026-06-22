import type { Particle, Vector2D } from '../types';
import { MathUtils } from './MathUtils';

const MAX_PARTICLES = 500;

export class ParticleSystem {
  private particles: Particle[] = [];
  private nextId = 0;

  update(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= deltaTime;
      MathUtils.addInPlace(p.position, MathUtils.mul(p.velocity, deltaTime * 60));
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  emitThruster(position: Vector2D, angle: number): void {
    const emitCount = 3;
    for (let i = 0; i < emitCount; i++) {
      if (this.particles.length >= MAX_PARTICLES) {
        this.particles.shift();
      }
      const spread = MathUtils.random(-0.3, 0.3);
      const particleAngle = angle + Math.PI + spread;
      const speed = MathUtils.random(2, 5);
      const velocity = MathUtils.fromAngle(particleAngle, speed);
      const colorT = Math.random();
      const color = colorT < 0.5 ? '#00E5FF' : '#00BFFF';
      
      this.particles.push({
        id: this.nextId++,
        position: { ...position },
        velocity,
        color,
        size: MathUtils.random(2, 4),
        life: 0.3,
        maxLife: 0.3,
        type: 'thruster'
      });
    }
  }

  emitExplosion(position: Vector2D): void {
    const emitCount = 20;
    for (let i = 0; i < emitCount; i++) {
      if (this.particles.length >= MAX_PARTICLES) {
        this.particles.shift();
      }
      const angle = (i / emitCount) * Math.PI * 2 + MathUtils.random(-0.2, 0.2);
      const speed = MathUtils.random(3, 8);
      const velocity = MathUtils.fromAngle(angle, speed);
      
      this.particles.push({
        id: this.nextId++,
        position: { ...position },
        velocity,
        color: '#FF4444',
        size: MathUtils.random(3, 6),
        life: 1,
        maxLife: 1,
        type: 'explosion'
      });
    }
  }

  emitVictory(canvasWidth: number): void {
    const emitCount = 100;
    for (let i = 0; i < emitCount; i++) {
      if (this.particles.length >= MAX_PARTICLES) {
        this.particles.shift();
      }
      
      this.particles.push({
        id: this.nextId++,
        position: {
          x: MathUtils.random(0, canvasWidth),
          y: MathUtils.random(-50, 0)
        },
        velocity: {
          x: MathUtils.random(-0.5, 0.5),
          y: MathUtils.random(2, 4)
        },
        color: '#FFD93D',
        size: MathUtils.random(2, 8),
        life: 3,
        maxLife: 3,
        type: 'victory'
      });
    }
  }

  getParticles(): Particle[] {
    return this.particles;
  }

  clear(): void {
    this.particles = [];
  }

  getCount(): number {
    return this.particles.length;
  }
}
