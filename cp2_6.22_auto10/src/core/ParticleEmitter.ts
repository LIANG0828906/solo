import type { ParticleConfig, Particle } from '../types';

const MAX_PARTICLES = 8000;
const POOL_SIZE = 10000;
const RECYCLE_THRESHOLD = 5000;

class ParticleEmitter {
  private pool: Particle[];
  private config: ParticleConfig;
  private emitAccumulator: number = 0;
  private centerX: number = 0;
  private centerY: number = 0;
  private activeCount: number = 0;

  constructor(config: ParticleConfig) {
    this.config = { ...config };
    this.pool = [];
    for (let i = 0; i < POOL_SIZE; i++) {
      this.pool.push(this.createDeadParticle());
    }
  }

  setConfig(config: ParticleConfig): void {
    this.config = { ...config };
  }

  setCenter(x: number, y: number): void {
    this.centerX = x;
    this.centerY = y;
  }

  getActiveCount(): number {
    return this.activeCount;
  }

  getActiveParticles(): Particle[] {
    const active: Particle[] = [];
    for (let i = 0; i < this.pool.length; i++) {
      if (this.pool[i].active) {
        active.push(this.pool[i]);
      }
    }
    return active;
  }

  update(dt: number): void {
    if (dt <= 0 || dt > 0.1) dt = 0.016;

    this.activeCount = 0;
    for (let i = 0; i < this.pool.length; i++) {
      if (this.pool[i].active) {
        this.updateParticle(this.pool[i], dt);
        this.activeCount++;
      }
    }

    if (this.activeCount > RECYCLE_THRESHOLD) {
      this.recycleExcessParticles();
    }

    this.emitAccumulator += this.config.emissionRate * dt;
    const toEmit = Math.floor(this.emitAccumulator);
    if (toEmit > 0) {
      this.emitAccumulator -= toEmit;
      for (let i = 0; i < toEmit; i++) {
        this.emitParticle();
      }
    }
  }

  private updateParticle(p: Particle, dt: number): void {
    p.life -= dt;
    if (p.life <= 0) {
      p.active = false;
      return;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    const lifeRatio = p.life / p.maxLife;
    p.alpha = lifeRatio;
    p.size = p.size * (0.998);
  }

  private emitParticle(): void {
    if (this.activeCount >= MAX_PARTICLES) return;

    let deadParticle: Particle | null = null;
    for (let i = 0; i < this.pool.length; i++) {
      if (!this.pool[i].active) {
        deadParticle = this.pool[i];
        break;
      }
    }

    if (!deadParticle) return;

    const spreadRad = (this.config.spreadAngle * Math.PI) / 180;
    const halfSpread = spreadRad / 2;
    const baseAngle = -Math.PI / 2;
    const angle = baseAngle + (Math.random() - 0.5) * halfSpread * 2;
    const speed = this.config.initialSpeed * (0.5 + Math.random() * 0.5);

    deadParticle.active = true;
    deadParticle.x = this.centerX + (Math.random() - 0.5) * 4;
    deadParticle.y = this.centerY + (Math.random() - 0.5) * 4;
    deadParticle.vx = Math.cos(angle) * speed;
    deadParticle.vy = Math.sin(angle) * speed;
    deadParticle.life = this.config.lifetime * (0.7 + Math.random() * 0.3);
    deadParticle.maxLife = deadParticle.life;
    deadParticle.size = this.config.size * (0.6 + Math.random() * 0.4);
    deadParticle.alpha = 1.0;
    deadParticle.startColor = this.hexToRgb(this.config.startColor);
    deadParticle.endColor = this.hexToRgb(this.config.endColor);
  }

  private recycleExcessParticles(): void {
    let recycled = 0;
    const excess = this.activeCount - RECYCLE_THRESHOLD;
    const recycleTarget = Math.min(excess, this.activeCount - MAX_PARTICLES + 2000);

    if (recycleTarget <= 0) return;

    const step = Math.max(1, Math.floor(this.pool.length / recycleTarget));
    for (let i = 0; i < this.pool.length && recycled < recycleTarget; i += step) {
      if (this.pool[i].active) {
        this.pool[i].active = false;
        recycled++;
      }
    }
    this.activeCount -= recycled;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const h = hex.replace('#', '');
    return {
      r: parseInt(h.substring(0, 2), 16),
      g: parseInt(h.substring(2, 4), 16),
      b: parseInt(h.substring(4, 6), 16),
    };
  }

  private createDeadParticle(): Particle {
    return {
      x: 0, y: 0, vx: 0, vy: 0,
      life: 0, maxLife: 0,
      size: 0, alpha: 0,
      startColor: { r: 0, g: 0, b: 0 },
      endColor: { r: 0, g: 0, b: 0 },
      active: false,
    };
  }
}

export { ParticleEmitter };
