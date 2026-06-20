import { Particle, PARTICLE_COLORS, ParticleType } from '../core/ParticleTypes';
import { SimulationEngine } from '../core/SimulationEngine';

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private engine: SimulationEngine;
  private showGrid: boolean = false;
  private trailParticles: Particle[][] = [];
  private readonly MAX_TRAIL_FRAMES: number = 3;

  constructor(canvas: HTMLCanvasElement, engine: SimulationEngine) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('无法获取Canvas 2D上下文');
    this.ctx = ctx;
    this.engine = engine;
    this.resize();
  }

  public resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.engine.setCanvasSize(rect.width, rect.height);
  }

  public setShowGrid(show: boolean): void {
    this.showGrid = show;
  }

  public isGridVisible(): boolean {
    return this.showGrid;
  }

  public render(): void {
    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.fillRect(0, 0, width, height);

    if (this.showGrid) {
      this.drawGrid(width, height);
    }

    const particles = this.engine.getParticles();

    this.trailParticles.push(particles.map(p => ({ ...p })));
    if (this.trailParticles.length > this.MAX_TRAIL_FRAMES) {
      this.trailParticles.shift();
    }

    for (let i = 0; i < this.trailParticles.length; i++) {
      const frame = this.trailParticles[i];
      const alpha = (i + 1) / this.trailParticles.length * 0.3;
      this.drawParticles(frame, alpha, 10);
    }

    this.drawParticles(particles, 1.0, 15);
  }

  private drawGrid(width: number, height: number): void {
    const gridSize = 40;
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(0, 51, 0, 0.3)';
    this.ctx.lineWidth = 0.5;

    for (let x = 0; x < width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
      this.ctx.stroke();
    }

    for (let y = 0; y < height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  private drawParticles(particles: Particle[], alpha: number, shadowBlur: number): void {
    this.ctx.save();
    this.ctx.globalAlpha = alpha;

    for (const p of particles) {
      if (p.life <= 0) continue;

      const lifeRatio = Math.max(0, Math.min(1, p.life / 100));
      const color = this.getParticleColor(p.type, lifeRatio);

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);

      this.ctx.shadowColor = color;
      this.ctx.shadowBlur = shadowBlur * lifeRatio;
      this.ctx.fillStyle = color;
      this.ctx.fill();
    }

    this.ctx.restore();
  }

  private getParticleColor(type: ParticleType, lifeRatio: number): string {
    const baseColor = PARTICLE_COLORS[type];
    const grayValue = Math.floor(80 + lifeRatio * 40);

    if (lifeRatio <= 0.1) {
      return `rgb(${grayValue}, ${grayValue}, ${grayValue})`;
    }

    const rgb = this.hexToRgb(baseColor);
    if (!rgb) return baseColor;

    const r = Math.floor(rgb.r * lifeRatio + grayValue * (1 - lifeRatio));
    const g = Math.floor(rgb.g * lifeRatio + grayValue * (1 - lifeRatio));
    const b = Math.floor(rgb.b * lifeRatio + grayValue * (1 - lifeRatio));

    return `rgb(${r}, ${g}, ${b})`;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  public clearTrail(): void {
    this.trailParticles = [];
  }
}
