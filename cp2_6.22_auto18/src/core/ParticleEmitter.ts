import type { Particle, ParticleConfig, ColorRGB } from '../types';

export class ParticleEmitter {
  private particles: Particle[] = [];
  private pool: Particle[] = [];
  private emissionAccumulator: number = 0;
  private config: ParticleConfig;
  private emitterX: number = 0;
  private emitterY: number = 0;

  private readonly SOFT_LIMIT = 5000;
  private readonly HARD_LIMIT = 8000;

  constructor(config: ParticleConfig) {
    this.config = { ...config };
  }

  setPosition(x: number, y: number): void {
    this.emitterX = x;
    this.emitterY = y;
  }

  updateConfig(config: Partial<ParticleConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): ParticleConfig {
    return { ...this.config };
  }

  update(deltaTime: number): Particle[] {
    this.emitParticles(deltaTime);
    this.updateParticles(deltaTime);
    return this.getActiveParticles();
  }

  getActiveParticles(): Particle[] {
    return this.particles.filter(p => p.active);
  }

  getParticleCount(): number {
    return this.particles.filter(p => p.active).length;
  }

  private emitParticles(deltaTime: number): void {
    if (this.config.emissionRate <= 0) return;

    this.emissionAccumulator += deltaTime * this.config.emissionRate;

    while (this.emissionAccumulator >= 1) {
      this.emissionAccumulator -= 1;
      this.emitSingleParticle();
    }
  }

  private emitSingleParticle(): void {
    const activeCount = this.getParticleCount();

    if (activeCount >= this.HARD_LIMIT) {
      return;
    }

    if (activeCount >= this.SOFT_LIMIT) {
      this.reclaimOldestParticle();
    }

    const particle = this.createParticle();
    this.particles.push(particle);
  }

  private createParticle(): Particle {
    const angleSpread = (this.config.spreadAngle * Math.PI) / 180;
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * angleSpread;
    const speed = this.config.initialSpeed * (0.8 + Math.random() * 0.4);

    const particle: Particle = {
      x: this.emitterX,
      y: this.emitterY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: this.config.lifespan,
      maxLife: this.config.lifespan,
      size: this.config.particleSize * (0.8 + Math.random() * 0.4),
      startColor: this.hexToNumber(this.config.startColor),
      endColor: this.hexToNumber(this.config.endColor),
      alpha: 1,
      active: true,
    };

    return particle;
  }

  private reclaimOldestParticle(): void {
    const oldestActive = this.particles.find(p => p.active);
    if (oldestActive) {
      oldestActive.active = false;
      this.pool.push(oldestActive);
    }
  }

  private updateParticles(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      if (!particle.active) continue;

      particle.life -= deltaTime;

      if (particle.life <= 0) {
        particle.active = false;
        this.pool.push(particle);
        continue;
      }

      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;

      particle.vy += 100 * deltaTime;

      const lifeRatio = particle.life / particle.maxLife;
      particle.alpha = lifeRatio;
      particle.size = this.config.particleSize * (0.5 + lifeRatio * 0.5);
    }

    if (this.pool.length > 1000) {
      this.pool = this.pool.slice(0, 500);
    }
  }

  private hexToNumber(hex: string): number {
    return parseInt(hex.replace('#', ''), 16);
  }

  hexToRgb(hex: string): ColorRGB {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 255, g: 255, b: 255 };
  }

  lerpColor(start: ColorRGB, end: ColorRGB, t: number): ColorRGB {
    return {
      r: Math.round(start.r + (end.r - start.r) * t),
      g: Math.round(start.g + (end.g - start.g) * t),
      b: Math.round(start.b + (end.b - start.b) * t),
    };
  }

  rgbToNumber(rgb: ColorRGB): number {
    return (rgb.r << 16) | (rgb.g << 8) | rgb.b;
  }

  reset(): void {
    this.particles.forEach(p => {
      p.active = false;
      this.pool.push(p);
    });
    this.particles = [];
    this.emissionAccumulator = 0;
  }
}
