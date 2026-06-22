'use strict';

export interface FrequencyRanges {
  alpha: { min: number; max: number };
  theta: { min: number; max: number };
  delta: { min: number; max: number };
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseSize: number;
  alpha: number;
  life: number;
  maxLife: number;
  color: { r: number; g: number; b: number };
  phase: number;
  isFragment: boolean;
  fragmentSpeed: number;
}

const FREQUENCY_RANGES: FrequencyRanges = {
  alpha: { min: 8, max: 12 },
  theta: { min: 4, max: 8 },
  delta: { min: 0.5, max: 4 },
};

const NATURAL_SLEEP_RANGES = {
  alpha: { min: 9, max: 11 },
  theta: { min: 5, max: 7 },
  delta: { min: 1.5, max: 3 },
};

const WAVE_COLORS = {
  alpha: { r: 147, g: 51, b: 234 },
  theta: { r: 59, g: 130, b: 246 },
  delta: { r: 34, g: 197, b: 94 },
};

const INITIAL_PARTICLE_COUNT = 100;
const MAX_PARTICLE_COUNT = 150;
const MAX_SPAWN_PER_FRAME = 5;
const MIN_LIFETIME = 5;
const MAX_LIFETIME = 10;
const INITIAL_STABILITY = 100;
const STABILITY_GAIN_PER_SECOND = 0.5;
const STABILITY_LOSS_MIN_PER_SECOND = 2;
const STABILITY_LOSS_MAX_PER_SECOND = 5;
const FRAGMENT_THRESHOLD = 20;
const COLLAPSE_THRESHOLD = 0;

export class DreamEngine {
  private particles: Particle[] = [];
  private particleIdCounter = 0;
  private stability = INITIAL_STABILITY;
  private collapsed = false;
  private canvasWidth = 800;
  private canvasHeight = 600;

  private frequencies = {
    alpha: 10,
    theta: 6,
    delta: 2,
  };

  private intensities = {
    alpha: 0,
    theta: 0,
    delta: 0,
  };

  constructor(canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.updateIntensities();
    this.initParticles();
  }

  private initParticles(): void {
    for (let i = 0; i < INITIAL_PARTICLE_COUNT; i++) {
      this.particles.push(this.createParticle());
    }
  }

  private createParticle(isFragment = false, parentX?: number, parentY?: number, parentSize?: number): Particle {
    const x = parentX ?? Math.random() * this.canvasWidth;
    const y = parentY ?? Math.random() * this.canvasHeight;
    const baseSize = isFragment ? (parentSize ?? 5) * 0.3 : 2 + Math.random() * 6;
    const maxLife = isFragment ? 1 + Math.random() * 2 : MIN_LIFETIME + Math.random() * (MAX_LIFETIME - MIN_LIFETIME);

    const totalIntensity = this.intensities.alpha + this.intensities.theta + this.intensities.delta;
    const color = this.getMixedColor(totalIntensity);

    const speed = this.getWalkSpeed();
    const angle = Math.random() * Math.PI * 2;

    return {
      id: this.particleIdCounter++,
      x,
      y,
      vx: isFragment ? (Math.random() - 0.5) * 200 : Math.cos(angle) * speed,
      vy: isFragment ? (Math.random() - 0.5) * 200 : Math.sin(angle) * speed,
      size: baseSize,
      baseSize,
      alpha: 0.3 + Math.random() * 0.6,
      life: maxLife,
      maxLife,
      color,
      phase: Math.random() * Math.PI * 2,
      isFragment,
      fragmentSpeed: isFragment ? 100 + Math.random() * 150 : 0,
    };
  }

  private getWalkSpeed(): number {
    const avgFreq = (this.frequencies.alpha + this.frequencies.theta + this.frequencies.delta) / 3;
    return 10 + avgFreq * 3;
  }

  private getMixedColor(totalIntensity: number): { r: number; g: number; b: number } {
    if (totalIntensity <= 0) {
      return { r: 200, g: 200, b: 200 };
    }

    const r = WAVE_COLORS.alpha.r * this.intensities.alpha +
      WAVE_COLORS.theta.r * this.intensities.theta +
      WAVE_COLORS.delta.r * this.intensities.delta;
    const g = WAVE_COLORS.alpha.g * this.intensities.alpha +
      WAVE_COLORS.theta.g * this.intensities.theta +
      WAVE_COLORS.delta.g * this.intensities.delta;
    const b = WAVE_COLORS.alpha.b * this.intensities.alpha +
      WAVE_COLORS.theta.b * this.intensities.theta +
      WAVE_COLORS.delta.b * this.intensities.delta;

    return {
      r: Math.round(r / totalIntensity),
      g: Math.round(g / totalIntensity),
      b: Math.round(b / totalIntensity),
    };
  }

  private updateIntensities(): void {
    this.intensities.alpha = this.calculateIntensity(
      this.frequencies.alpha,
      FREQUENCY_RANGES.alpha.min,
      FREQUENCY_RANGES.alpha.max
    );
    this.intensities.theta = this.calculateIntensity(
      this.frequencies.theta,
      FREQUENCY_RANGES.theta.min,
      FREQUENCY_RANGES.theta.max
    );
    this.intensities.delta = this.calculateIntensity(
      this.frequencies.delta,
      FREQUENCY_RANGES.delta.min,
      FREQUENCY_RANGES.delta.max
    );
  }

  private calculateIntensity(freq: number, min: number, max: number): number {
    if (freq < min || freq > max) return 0;
    const mid = (min + max) / 2;
    const range = (max - min) / 2;
    const distance = Math.abs(freq - mid);
    return 1 - distance / range;
  }

  private isInNaturalSleepRange(): boolean {
    const alphaInRange = this.frequencies.alpha >= NATURAL_SLEEP_RANGES.alpha.min &&
      this.frequencies.alpha <= NATURAL_SLEEP_RANGES.alpha.max;
    const thetaInRange = this.frequencies.theta >= NATURAL_SLEEP_RANGES.theta.min &&
      this.frequencies.theta <= NATURAL_SLEEP_RANGES.theta.max;
    const deltaInRange = this.frequencies.delta >= NATURAL_SLEEP_RANGES.delta.min &&
      this.frequencies.delta <= NATURAL_SLEEP_RANGES.delta.max;
    return alphaInRange && thetaInRange && deltaInRange;
  }

  private calculateStabilityChange(deltaTime: number): number {
    if (this.isInNaturalSleepRange()) {
      return STABILITY_GAIN_PER_SECOND * deltaTime;
    }

    let totalDeviation = 0;

    if (this.frequencies.alpha < NATURAL_SLEEP_RANGES.alpha.min) {
      totalDeviation += NATURAL_SLEEP_RANGES.alpha.min - this.frequencies.alpha;
    } else if (this.frequencies.alpha > NATURAL_SLEEP_RANGES.alpha.max) {
      totalDeviation += this.frequencies.alpha - NATURAL_SLEEP_RANGES.alpha.max;
    }

    if (this.frequencies.theta < NATURAL_SLEEP_RANGES.theta.min) {
      totalDeviation += NATURAL_SLEEP_RANGES.theta.min - this.frequencies.theta;
    } else if (this.frequencies.theta > NATURAL_SLEEP_RANGES.theta.max) {
      totalDeviation += this.frequencies.theta - NATURAL_SLEEP_RANGES.theta.max;
    }

    if (this.frequencies.delta < NATURAL_SLEEP_RANGES.delta.min) {
      totalDeviation += NATURAL_SLEEP_RANGES.delta.min - this.frequencies.delta;
    } else if (this.frequencies.delta > NATURAL_SLEEP_RANGES.delta.max) {
      totalDeviation += this.frequencies.delta - NATURAL_SLEEP_RANGES.delta.max;
    }

    const maxDeviation = 10;
    const deviationRatio = Math.min(totalDeviation / maxDeviation, 1);
    const lossRate = STABILITY_LOSS_MIN_PER_SECOND +
      deviationRatio * (STABILITY_LOSS_MAX_PER_SECOND - STABILITY_LOSS_MIN_PER_SECOND);

    return -lossRate * deltaTime;
  }

  private fragmentParticle(particle: Particle): Particle[] {
    const fragments: Particle[] = [];
    const fragmentCount = 3 + Math.floor(Math.random() * 4);

    for (let i = 0; i < fragmentCount; i++) {
      const fragment = this.createParticle(true, particle.x, particle.y, particle.size);
      fragment.alpha = particle.alpha * 0.8;
      fragments.push(fragment);
    }

    return fragments;
  }

  update(deltaTime: number): void {
    if (this.collapsed) return;

    const stabilityChange = this.calculateStabilityChange(deltaTime);
    this.stability = Math.max(0, Math.min(100, this.stability + stabilityChange));

    if (this.stability <= COLLAPSE_THRESHOLD) {
      this.collapsed = true;
      return;
    }

    const shouldFragment = this.stability < FRAGMENT_THRESHOLD;
    const newParticles: Particle[] = [];
    const fragmentParticles: Particle[] = [];

    for (const particle of this.particles) {
      particle.life -= deltaTime;
      particle.phase += deltaTime * 2;

      if (!particle.isFragment) {
        const speed = this.getWalkSpeed();
        particle.vx += (Math.random() - 0.5) * speed * deltaTime * 2;
        particle.vy += (Math.random() - 0.5) * speed * deltaTime * 2;

        const currentSpeed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
        if (currentSpeed > speed) {
          particle.vx = (particle.vx / currentSpeed) * speed;
          particle.vy = (particle.vy / currentSpeed) * speed;
        }
      } else {
        particle.vx *= 0.98;
        particle.vy *= 0.98;
      }

      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;

      if (!particle.isFragment) {
        if (particle.x < 0) {
          particle.x = 0;
          particle.vx = Math.abs(particle.vx);
        } else if (particle.x > this.canvasWidth) {
          particle.x = this.canvasWidth;
          particle.vx = -Math.abs(particle.vx);
        }
        if (particle.y < 0) {
          particle.y = 0;
          particle.vy = Math.abs(particle.vy);
        } else if (particle.y > this.canvasHeight) {
          particle.y = this.canvasHeight;
          particle.vy = -Math.abs(particle.vy);
        }
      }

      if (particle.life <= 0) {
        if (!particle.isFragment) {
          const newParticle = this.createParticle();
          newParticles.push(newParticle);
        }
      } else {
        if (shouldFragment && !particle.isFragment && Math.random() < 0.02) {
          const fragments = this.fragmentParticle(particle);
          fragmentParticles.push(...fragments);
        } else {
          newParticles.push(particle);
        }
      }
    }

    this.particles = newParticles.concat(fragmentParticles);

    const totalIntensity = this.intensities.alpha + this.intensities.theta + this.intensities.delta;
    const targetCount = Math.floor(INITIAL_PARTICLE_COUNT + totalIntensity * 50);
    const actualTarget = Math.min(targetCount, MAX_PARTICLE_COUNT);

    if (this.particles.length < actualTarget) {
      const spawnCount = Math.min(MAX_SPAWN_PER_FRAME, actualTarget - this.particles.length);
      for (let i = 0; i < spawnCount; i++) {
        this.particles.push(this.createParticle());
      }
    }

    const mixedColor = this.getMixedColor(
      this.intensities.alpha + this.intensities.theta + this.intensities.delta
    );
    for (const particle of this.particles) {
      particle.color = { ...mixedColor };
    }
  }

  setFrequencies(alpha: number, theta: number, delta: number): void {
    this.frequencies.alpha = alpha;
    this.frequencies.theta = theta;
    this.frequencies.delta = delta;
    this.updateIntensities();
  }

  getParticles(): Particle[] {
    return this.particles;
  }

  getStability(): number {
    return this.stability;
  }

  isCollapsed(): boolean {
    return this.collapsed;
  }

  setCanvasSize(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  reset(): void {
    this.stability = INITIAL_STABILITY;
    this.collapsed = false;
    this.particles = [];
    this.particleIdCounter = 0;
    this.initParticles();
  }
}
