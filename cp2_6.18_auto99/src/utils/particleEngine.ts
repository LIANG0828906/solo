import { v4 as uuidv4 } from 'uuid';

export type FrequencyBand = 'low' | 'mid' | 'high';

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseRadius: number;
  currentRadius: number;
  baseColor: string;
  baseHue: number;
  baseSaturation: number;
  baseLightness: number;
  band: FrequencyBand;
  birthTime: number;
  lifespan: number;
  opacity: number;
  pulsePhase: number;
}

const BAND_COLORS: Record<FrequencyBand, { hex: string; hue: number; sat: number; light: number }> = {
  low: { hex: '#ff6b6b', hue: 0, sat: 100, light: 71 },
  mid: { hex: '#48dbfb', hue: 190, sat: 96, light: 63 },
  high: { hex: '#feca57', hue: 43, sat: 99, light: 67 },
};

const MAX_PARTICLES = 500;

export class ParticleEngine {
  private particles: Particle[] = [];
  private canvasWidth: number = 0;
  private canvasHeight: number = 0;
  private hueOffset: number = 0;
  private beatTime: number = 0;
  private beatIntensity: number = 0;

  setCanvasSize(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  getParticleCount(): number {
    return this.particles.length;
  }

  spawnParticles(
    lowEnergy: number,
    midEnergy: number,
    highEnergy: number,
  ): void {
    if (this.canvasWidth === 0 || this.canvasHeight === 0) return;

    const totalIntensity = lowEnergy + midEnergy + highEnergy;
    const targetCount = Math.min(MAX_PARTICLES, Math.floor(100 + totalIntensity * 400));

    const lowParticles = Math.floor(lowEnergy * 8);
    const midParticles = Math.floor(midEnergy * 8);
    const highParticles = Math.floor(highEnergy * 8);

    const spawnFromBand = (band: FrequencyBand, energy: number, count: number): void => {
      for (let i = 0; i < count; i++) {
        if (this.particles.length >= targetCount) break;
        this.spawnSingleParticle(band, energy);
      }
    };

    spawnFromBand('low', lowEnergy, lowParticles);
    spawnFromBand('mid', midEnergy, midParticles);
    spawnFromBand('high', highEnergy, highParticles);
  }

  private spawnSingleParticle(band: FrequencyBand, energy: number): void {
    const colorInfo = BAND_COLORS[band];
    const now = performance.now();

    const margin = 50;
    const x = margin + Math.random() * (this.canvasWidth - margin * 2);
    const y = margin + Math.random() * (this.canvasHeight - margin * 2);

    const angle = Math.random() * Math.PI * 2;
    const speed = 0.5 + Math.random() * 1.5;
    const speedBoost = 1 + energy * 2;

    const particle: Particle = {
      id: uuidv4(),
      x,
      y,
      vx: Math.cos(angle) * speed * speedBoost,
      vy: Math.sin(angle) * speed * speedBoost,
      baseRadius: 2 + energy * 14 + Math.random() * 4,
      currentRadius: 0,
      baseColor: colorInfo.hex,
      baseHue: colorInfo.hue,
      baseSaturation: colorInfo.sat,
      baseLightness: colorInfo.light,
      band,
      birthTime: now,
      lifespan: 3000 + Math.random() * 3000,
      opacity: 0,
      pulsePhase: Math.random() * Math.PI * 2,
    };

    this.particles.push(particle);
  }

  triggerBeat(): void {
    this.beatTime = performance.now();
    this.beatIntensity = 1;
  }

  update(now: number): void {
    this.hueOffset = (this.hueOffset + 0.5) % 360;

    const beatProgress = Math.min(1, (now - this.beatTime) / 200);
    const beatPulse = Math.exp(-beatProgress * 4);

    const aliveParticles: Particle[] = [];

    for (const p of this.particles) {
      const age = now - p.birthTime;
      const lifeProgress = age / p.lifespan;

      if (lifeProgress >= 1) continue;

      p.x += p.vx;
      p.y += p.vy;

      if (p.x <= p.currentRadius) {
        p.x = p.currentRadius;
        p.vx = Math.abs(p.vx);
      } else if (p.x >= this.canvasWidth - p.currentRadius) {
        p.x = this.canvasWidth - p.currentRadius;
        p.vx = -Math.abs(p.vx);
      }

      if (p.y <= p.currentRadius) {
        p.y = p.currentRadius;
        p.vy = Math.abs(p.vy);
      } else if (p.y >= this.canvasHeight - p.currentRadius) {
        p.y = this.canvasHeight - p.currentRadius;
        p.vy = -Math.abs(p.vy);
      }

      let fadeIn = 1;
      let fadeOut = 1;
      if (lifeProgress < 0.15) {
        fadeIn = lifeProgress / 0.15;
      }
      if (lifeProgress > 0.75) {
        fadeOut = 1 - (lifeProgress - 0.75) / 0.25;
      }

      const baseOpacity = 0.35 + 0.4 * fadeIn * fadeOut;
      p.opacity = baseOpacity;

      const sizePulse = 1 + beatPulse * 0.2;
      p.currentRadius = p.baseRadius * sizePulse;

      aliveParticles.push(p);
    }

    this.particles = aliveParticles;
  }

  render(ctx: CanvasRenderingContext2D, now: number): void {
    const beatProgress = Math.min(1, (now - this.beatTime) / 300);
    const beatBrightnessBoost = Math.exp(-beatProgress * 3) * 30;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (const p of this.particles) {
      const hue = (p.baseHue + this.hueOffset) % 360;
      const lightness = Math.min(95, p.baseLightness + beatBrightnessBoost);

      const gradient = ctx.createRadialGradient(
        p.x,
        p.y,
        0,
        p.x,
        p.y,
        p.currentRadius,
      );

      gradient.addColorStop(
        0,
        `hsla(${hue}, ${p.baseSaturation}%, ${lightness}%, ${p.opacity})`,
      );
      gradient.addColorStop(
        0.5,
        `hsla(${hue}, ${p.baseSaturation}%, ${p.baseLightness}%, ${p.opacity * 0.7})`,
      );
      gradient.addColorStop(
        1,
        `hsla(${hue}, ${p.baseSaturation}%, ${p.baseLightness}%, 0)`,
      );

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.currentRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    ctx.restore();
  }

  clear(): void {
    this.particles = [];
    this.hueOffset = 0;
  }
}
