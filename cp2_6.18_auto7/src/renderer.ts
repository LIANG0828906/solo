import { Engine } from './engine';
import { Particle } from './particle';

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private trailCanvas: HTMLCanvasElement;
  private trailCtx: CanvasRenderingContext2D;
  bgColor: string = '#0A0A1A';
  trailOpacity: number = 0.2;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.trailCanvas = document.createElement('canvas');
    this.trailCtx = this.trailCanvas.getContext('2d')!;
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.trailCanvas.width = width;
    this.trailCanvas.height = height;
  }

  clear(): void {
    this.ctx.fillStyle = this.bgColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawTrails(particles: Particle[]): void {
    const tctx = this.trailCtx;
    tctx.clearRect(0, 0, this.trailCanvas.width, this.trailCanvas.height);

    for (const p of particles) {
      if (p.trail.length < 2) continue;
      for (let i = 1; i < p.trail.length; i++) {
        const alpha = (i / p.trail.length) * this.trailOpacity;
        tctx.strokeStyle = p.color;
        tctx.globalAlpha = alpha;
        tctx.lineWidth = p.size * 0.6;
        tctx.beginPath();
        tctx.moveTo(p.trail[i - 1].x, p.trail[i - 1].y);
        tctx.lineTo(p.trail[i].x, p.trail[i].y);
        tctx.stroke();
      }
    }
    tctx.globalAlpha = 1;
  }

  render(engine: Engine): void {
    this.clear();
    this.drawTrails(engine.particles);

    this.ctx.drawImage(this.trailCanvas, 0, 0);

    const ctx = this.ctx;
    for (const p of engine.particles) {
      p.draw(ctx);
    }

    if (engine.forceField) {
      const ff = engine.forceField;
      const gradient = ctx.createRadialGradient(ff.x, ff.y, 0, ff.x, ff.y, 120);
      if (ff.type === 'attract') {
        gradient.addColorStop(0, 'rgba(0,221,255,0.15)');
        gradient.addColorStop(1, 'rgba(0,221,255,0)');
      } else {
        gradient.addColorStop(0, 'rgba(255,68,170,0.15)');
        gradient.addColorStop(1, 'rgba(255,68,170,0)');
      }
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(ff.x, ff.y, 120, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
