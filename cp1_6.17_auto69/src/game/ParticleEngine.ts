import { v4 as uuidv4 } from 'uuid';
import type { Vector2, Particle } from './types';

const MAX_PARTICLES = 200;

export class ParticleEngine {
  static limitParticles(particles: Particle[]): Particle[] {
    if (particles.length > MAX_PARTICLES) {
      return particles.slice(particles.length - MAX_PARTICLES);
    }
    return particles;
  }

  static createExplosion(
    position: Vector2,
    color: string,
    count: number = 20
  ): Particle[] {
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 50 + Math.random() * 150;
      const life = 0.5 + Math.random() * 0.8;
      particles.push({
        id: uuidv4(),
        position: { x: position.x, y: position.y },
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
        },
        color,
        size: 2 + Math.random() * 4,
        life,
        maxLife: life,
        type: 'explosion',
      });
    }
    return particles;
  }

  static createTrail(
    position: Vector2,
    direction: Vector2,
    color: string
  ): Particle {
    const speed = 20 + Math.random() * 30;
    const life = 0.3 + Math.random() * 0.3;
    const dirLen = Math.sqrt(direction.x ** 2 + direction.y ** 2) || 1;
    const spread = (Math.random() - 0.5) * 0.6;
    const baseAngle = Math.atan2(direction.y, direction.x) + spread;
    return {
      id: uuidv4(),
      position: { x: position.x, y: position.y },
      velocity: {
        x: Math.cos(baseAngle) * speed - (direction.x / dirLen) * 40,
        y: Math.sin(baseAngle) * speed - (direction.y / dirLen) * 40,
      },
      color,
      size: 1.5 + Math.random() * 2,
      life,
      maxLife: life,
      type: 'trail',
    };
  }

  static createMiningEffect(position: Vector2): Particle[] {
    const particles: Particle[] = [];
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 15;
      const speed = 30 + Math.random() * 50;
      const life = 0.4 + Math.random() * 0.4;
      particles.push({
        id: uuidv4(),
        position: {
          x: position.x + Math.cos(angle) * dist,
          y: position.y + Math.sin(angle) * dist,
        },
        velocity: {
          x: Math.cos(angle) * speed * 0.3,
          y: -Math.abs(speed),
        },
        color: '#00BFFF',
        size: 1 + Math.random() * 2,
        life,
        maxLife: life,
        type: 'mining',
      });
    }
    return particles;
  }

  static createUpgradeFlash(position: Vector2): Particle[] {
    const particles: Particle[] = [];
    for (let i = 0; i < 30; i++) {
      const angle = (Math.PI * 2 * i) / 30;
      const speed = 80 + Math.random() * 120;
      const life = 0.6 + Math.random() * 0.6;
      particles.push({
        id: uuidv4(),
        position: { x: position.x, y: position.y },
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
        },
        color: '#FFD700',
        size: 2 + Math.random() * 3,
        life,
        maxLife: life,
        type: 'upgrade',
      });
    }
    return particles;
  }

  static updateParticles(particles: Particle[], deltaTime: number): Particle[] {
    const updated = particles
      .map((p) => ({
        ...p,
        position: {
          x: p.position.x + p.velocity.x * deltaTime,
          y: p.position.y + p.velocity.y * deltaTime,
        },
        velocity: {
          x: p.velocity.x * (1 - deltaTime * 1.5),
          y: p.velocity.y * (1 - deltaTime * 1.5),
        },
        life: p.life - deltaTime,
      }))
      .filter((p) => p.life > 0);
    return ParticleEngine.limitParticles(updated);
  }

  static renderParticles(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
    particles.forEach((p) => {
      const alpha = Math.max(0, p.life / p.maxLife);
      const size = p.size * alpha;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.position.x, p.position.y, Math.max(0.5, size), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }
}
