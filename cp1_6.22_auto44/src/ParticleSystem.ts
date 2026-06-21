import { ParticleType, COLORS, MAX_PARTICLES } from './types';
import { randomRange } from './utils';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  type: ParticleType;
  color: string;
  rotation: number;
  rotationSpeed: number;
  text?: string;
  active: boolean;
}

export class ParticleSystem {
  private particles: Particle[];

  constructor() {
    this.particles = [];
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.particles.push(this.createEmptyParticle());
    }
  }

  private createEmptyParticle(): Particle {
    return {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 1,
      size: 0,
      type: ParticleType.EXPLOSION,
      color: '#ffffff',
      rotation: 0,
      rotationSpeed: 0,
      active: false
    };
  }

  spawnExplosion(x: number, y: number, count: number = 15, isElite: boolean = false): void {
    for (let i = 0; i < count; i++) {
      const particle = this.getInactiveParticle();
      if (!particle) break;

      const angle = (Math.PI * 2 * i) / count + randomRange(-0.2, 0.2);
      const speed = randomRange(50, isElite ? 200 : 150);
      
      particle.x = x;
      particle.y = y;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
      particle.life = 0;
      particle.maxLife = randomRange(0.3, 0.6);
      particle.size = randomRange(2, isElite ? 8 : 5);
      particle.type = ParticleType.EXPLOSION;
      particle.color = isElite ? COLORS.ELITE : COLORS.ENEMY;
      particle.rotation = 0;
      particle.rotationSpeed = randomRange(-5, 5);
      particle.active = true;
    }
  }

  spawnDebris(x: number, y: number, count: number = 8): void {
    for (let i = 0; i < count; i++) {
      const particle = this.getInactiveParticle();
      if (!particle) break;

      const angle = randomRange(0, Math.PI * 2);
      const speed = randomRange(100, 300);
      
      particle.x = x;
      particle.y = y;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
      particle.life = 0;
      particle.maxLife = randomRange(0.8, 1.5);
      particle.size = randomRange(4, 12);
      particle.type = ParticleType.DEBRIS;
      particle.color = COLORS.PLAYER;
      particle.rotation = randomRange(0, Math.PI * 2);
      particle.rotationSpeed = randomRange(-10, 10);
      particle.active = true;
    }
  }

  spawnScorePopup(x: number, y: number, score: number): void {
    const particle = this.getInactiveParticle();
    if (!particle) return;

    particle.x = x;
    particle.y = y;
    particle.vx = 0;
    particle.vy = -60;
    particle.life = 0;
    particle.maxLife = 1.2;
    particle.size = 16;
    particle.type = ParticleType.SCORE;
    particle.color = COLORS.GOLD;
    particle.rotation = 0;
    particle.rotationSpeed = 0;
    particle.text = `+${score}`;
    particle.active = true;
  }

  private getInactiveParticle(): Particle | null {
    let particle = this.particles.find(p => !p.active);
    if (!particle && this.particles.length < MAX_PARTICLES) {
      particle = this.createEmptyParticle();
      this.particles.push(particle);
    }
    return particle ?? null;
  }

  update(dt: number): void {
    for (const particle of this.particles) {
      if (!particle.active) continue;

      particle.life += dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.rotation += particle.rotationSpeed * dt;

      if (particle.type === ParticleType.DEBRIS) {
        particle.vy += 200 * dt;
      }

      if (particle.life >= particle.maxLife) {
        particle.active = false;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const particle of this.particles) {
      if (!particle.active) continue;

      const alpha = 1 - particle.life / particle.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;

      if (particle.type === ParticleType.SCORE && particle.text) {
        ctx.font = `${particle.size}px 'Press Start 2P', monospace`;
        ctx.fillStyle = particle.color;
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = 10;
        ctx.textAlign = 'center';
        ctx.fillText(particle.text, particle.x, particle.y);
      } else {
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);
        ctx.fillStyle = particle.color;
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = 5;

        if (particle.type === ParticleType.DEBRIS) {
          ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    }
  }

  clear(): void {
    for (const particle of this.particles) {
      particle.active = false;
    }
  }

  getActiveCount(): number {
    return this.particles.filter(p => p.active).length;
  }
}
