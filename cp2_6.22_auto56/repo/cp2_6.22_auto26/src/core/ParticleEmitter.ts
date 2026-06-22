import type { Particle, ParticleConfig } from '../types';

export class ParticleEmitter {
  private particles: Particle[] = [];
  private pool: Particle[] = [];
  private emissionAccumulator: number = 0;
  private config: ParticleConfig;
  private maxParticles: number = 8000;
  private warnThreshold: number = 5000;
  private poolSize: number = 4000;
  private globalAlphaMultiplier: number = 1;
  private transitionTargetAlpha: number = 1;
  private isFadingOut: boolean = false;
  private isFadingIn: boolean = false;
  public x: number = 0;
  public y: number = 0;

  constructor(config: ParticleConfig) {
    this.config = { ...config };
    this.initPool();
  }

  private initPool(): void {
    for (let i = 0; i < this.poolSize; i++) {
      this.pool.push(this.createParticle());
    }
  }

  private createParticle(): Particle {
    return {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 0,
      size: 0,
      startColor: { r: 0, g: 0, b: 0 },
      endColor: { r: 0, g: 0, b: 0 },
      alpha: 0,
      active: false
    };
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 255, g: 255, b: 255 };
  }

  public setConfig(config: ParticleConfig): void {
    this.config = { ...config };
  }

  public getConfig(): ParticleConfig {
    return { ...this.config };
  }

  private emit(count: number): void {
    const startColor = this.hexToRgb(this.config.startColor);
    const endColor = this.hexToRgb(this.config.endColor);
    const spreadRad = (this.config.spreadAngle * Math.PI) / 180;

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;

      let particle: Particle;
      if (this.pool.length > 0) {
        particle = this.pool.pop()!;
      } else {
        particle = this.createParticle();
      }

      const angle = -Math.PI / 2 + (Math.random() - 0.5) * spreadRad;
      const speedVariation = 0.8 + Math.random() * 0.4;
      const speed = this.config.speed * speedVariation;

      particle.x = this.x;
      particle.y = this.y;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
      particle.maxLife = this.config.lifetime * (0.8 + Math.random() * 0.4);
      particle.life = particle.maxLife;
      particle.size = this.config.size * (0.7 + Math.random() * 0.6);
      particle.startColor = { ...startColor };
      particle.endColor = { ...endColor };
      particle.alpha = 1;
      particle.active = true;

      this.particles.push(particle);
    }
  }

  public update(deltaTime: number, currentFps: number = 60): Particle[] {
    const activeParticles = this.particles.filter(p => p.active);
    const activeCount = activeParticles.length;

    if (activeCount > this.maxParticles) {
      const forceRemoveCount = activeCount - this.maxParticles;
      const sortedParticles = [...activeParticles].sort((a, b) => a.life - b.life);
      for (let i = 0; i < forceRemoveCount; i++) {
        const p = sortedParticles[i];
        const idx = this.particles.indexOf(p);
        if (idx !== -1) {
          this.recycleParticle(this.particles[idx]);
          this.particles.splice(idx, 1);
        }
      }
    } else if (activeCount > this.warnThreshold || currentFps < 45) {
      const threshold = currentFps < 30 ? this.warnThreshold - 500 : this.warnThreshold;
      const excess = Math.max(0, activeCount - threshold);
      if (excess > 0) {
        const sortedParticles = [...activeParticles].sort((a, b) => a.life - b.life);
        const removeCount = Math.min(excess, Math.ceil(excess * (currentFps < 30 ? 0.3 : 0.15)));
        for (let i = 0; i < removeCount; i++) {
          const p = sortedParticles[i];
          const idx = this.particles.indexOf(p);
          if (idx !== -1) {
            this.recycleParticle(this.particles[idx]);
            this.particles.splice(idx, 1);
          }
        }
      }
    }

    if (this.isFadingOut || this.isFadingIn) {
      const transitionSpeed = deltaTime / 0.5;
      if (this.isFadingOut) {
        this.globalAlphaMultiplier = Math.max(0, this.globalAlphaMultiplier - transitionSpeed);
        if (this.globalAlphaMultiplier <= 0) {
          this.isFadingOut = false;
          this.isFadingIn = true;
          this.emissionAccumulator = 0;
          this.clearActiveParticles();
        }
      } else if (this.isFadingIn) {
        this.globalAlphaMultiplier = Math.min(1, this.globalAlphaMultiplier + transitionSpeed);
        if (this.globalAlphaMultiplier >= 1) {
          this.isFadingIn = false;
          this.globalAlphaMultiplier = 1;
        }
      }
    }

    const canEmit = !this.isFadingOut && this.globalAlphaMultiplier > 0.1;
    if (canEmit) {
      this.emissionAccumulator += this.config.emissionRate * deltaTime * this.globalAlphaMultiplier;
      const emitCount = Math.floor(this.emissionAccumulator);
      if (emitCount > 0) {
        this.emit(emitCount);
        this.emissionAccumulator -= emitCount;
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      if (!particle.active) continue;

      particle.life -= deltaTime;
      if (particle.life <= 0) {
        this.recycleParticle(particle);
        this.particles.splice(i, 1);
        continue;
      }

      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;

      const lifeRatio = particle.life / particle.maxLife;
      particle.alpha = lifeRatio * this.globalAlphaMultiplier;
    }

    return this.particles.filter(p => p.active);
  }

  public fadeOutAndReset(duration: number = 0.5): void {
    this.isFadingOut = true;
    this.isFadingIn = false;
  }

  public setGlobalAlpha(alpha: number): void {
    this.globalAlphaMultiplier = Math.max(0, Math.min(1, alpha));
  }

  public isTransitioning(): boolean {
    return this.isFadingOut || this.isFadingIn;
  }

  private clearActiveParticles(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      if (this.particles[i].active) {
        this.recycleParticle(this.particles[i]);
      }
    }
    this.particles = this.particles.filter(p => p.active);
  }

  private recycleParticle(particle: Particle): void {
    particle.active = false;
    if (this.pool.length < this.poolSize * 2) {
      this.pool.push(particle);
    }
  }

  public getParticleCount(): number {
    return this.particles.filter(p => p.active).length;
  }

  public reset(): void {
    for (const particle of this.particles) {
      this.recycleParticle(particle);
    }
    this.particles = [];
    this.emissionAccumulator = 0;
  }
}
