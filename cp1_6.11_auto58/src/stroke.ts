import { Particle } from './particle';

interface StrokeConfig {
  particleSize: number;
  lifespanSeconds: number;
  baseColor: string;
  maxParticles: number;
}

interface SamplePoint {
  x: number;
  y: number;
}

export class StrokeManager {
  private particles: Particle[] = [];
  private isDrawing: boolean = false;
  private lastSampleTime: number = 0;
  private lastPoint: SamplePoint | null = null;
  private config: StrokeConfig;
  private readonly SAMPLE_INTERVAL = 5;
  private readonly MAX_DISTANCE = 4;

  constructor(config: StrokeConfig) {
    this.config = config;
  }

  updateConfig(partial: Partial<StrokeConfig>): void {
    this.config = { ...this.config, ...partial };
  }

  getParticleCount(): number {
    return this.particles.length;
  }

  startDrawing(x: number, y: number): void {
    this.isDrawing = true;
    this.lastPoint = { x, y };
    this.lastSampleTime = performance.now();
    this.emitParticles(x, y);
  }

  move(x: number, y: number): void {
    if (!this.isDrawing || !this.lastPoint) return;

    const now = performance.now();
    if (now - this.lastSampleTime < this.SAMPLE_INTERVAL) return;

    const dist = Math.hypot(x - this.lastPoint.x, y - this.lastPoint.y);
    if (dist < this.MAX_DISTANCE) return;

    const steps = Math.max(1, Math.floor(dist / this.MAX_DISTANCE));
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const px = this.lastPoint.x + (x - this.lastPoint.x) * t;
      const py = this.lastPoint.y + (y - this.lastPoint.y) * t;
      this.emitParticles(px, py);
    }

    this.lastPoint = { x, y };
    this.lastSampleTime = now;
  }

  stopDrawing(): void {
    this.isDrawing = false;
    this.lastPoint = null;
  }

  private hexToHsl(hex: string): { h: number; s: number; l: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { h: 0, s: 80, l: 60 };

    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  private emitParticles(x: number, y: number): void {
    const hsl = this.hexToHsl(this.config.baseColor);
    const count = 15 + Math.floor(Math.random() * 11);

    for (let i = 0; i < count; i++) {
      const particle = new Particle({
        x,
        y,
        baseHue: hsl.h,
        baseSaturation: Math.max(80, hsl.s),
        baseLightness: hsl.l,
        initialSize: 3 + Math.random() * 3 + (this.config.particleSize - 4),
        lifespanSeconds: this.config.lifespanSeconds
      });
      this.particles.push(particle);
    }

    while (this.particles.length > this.config.maxParticles) {
      this.particles.shift();
    }
  }

  update(): void {
    this.particles = this.particles.filter(p => p.update());
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const particle of this.particles) {
      particle.render(ctx);
    }
  }

  clearAll(): void {
    for (const particle of this.particles) {
      particle.startFade();
    }
  }
}
