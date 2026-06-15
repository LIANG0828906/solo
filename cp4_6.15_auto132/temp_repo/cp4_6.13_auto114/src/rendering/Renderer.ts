import { Particle } from '../physics/Particle';
import { Polygon } from '../physics/CollisionSystem';

export interface RendererState {
  particleRadius: number;
  bounds: { width: number; height: number };
}

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private trailCanvas: HTMLCanvasElement;
  private trailCtx: CanvasRenderingContext2D;
  private fpsHistory: number[] = [];
  private lowQualityFrames = 0;
  private highQualityFrames = 0;
  private useLowQuality = false;
  private state: RendererState;

  private static readonly FPS_WINDOW = 30;
  private static readonly LOW_QUALITY_THRESHOLD = 45;
  private static readonly HIGH_QUALITY_THRESHOLD = 55;
  private static readonly LOW_QUALITY_TRIGGER = 10;
  private static readonly HIGH_QUALITY_TRIGGER = 30;

  constructor(canvas: HTMLCanvasElement, state: RendererState) {
    this.ctx = canvas.getContext('2d')!;
    this.state = { ...state };

    this.trailCanvas = document.createElement('canvas');
    this.trailCanvas.width = state.bounds.width;
    this.trailCanvas.height = state.bounds.height;
    this.trailCtx = this.trailCanvas.getContext('2d')!;
  }

  public setState(state: Partial<RendererState>): void {
    if (state.bounds) {
      this.trailCanvas.width = state.bounds.width;
      this.trailCanvas.height = state.bounds.height;
    }
    Object.assign(this.state, state);
  }

  public render(
    particles: Particle[],
    polygons: Polygon[],
    dt: number
  ): { fps: number; particleCount: number; lowQuality: boolean } {
    const fps = 1 / Math.max(dt, 0.001);
    this.updateQualityMode(fps);

    this.renderBackground();
    this.renderTrails(particles);
    this.ctx.drawImage(this.trailCanvas, 0, 0);
    this.renderPolygons(polygons);
    this.renderParticles(particles);

    return {
      fps,
      particleCount: particles.length,
      lowQuality: this.useLowQuality,
    };
  }

  private updateQualityMode(fps: number): void {
    this.fpsHistory.push(fps);
    if (this.fpsHistory.length > Renderer.FPS_WINDOW) {
      this.fpsHistory.shift();
    }

    const avgFps =
      this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;

    if (!this.useLowQuality) {
      if (avgFps < Renderer.LOW_QUALITY_THRESHOLD) {
        this.lowQualityFrames++;
        if (this.lowQualityFrames >= Renderer.LOW_QUALITY_TRIGGER) {
          this.useLowQuality = true;
          this.lowQualityFrames = 0;
          this.highQualityFrames = 0;
        }
      } else {
        this.lowQualityFrames = 0;
      }
    } else {
      if (avgFps > Renderer.HIGH_QUALITY_THRESHOLD) {
        this.highQualityFrames++;
        if (this.highQualityFrames >= Renderer.HIGH_QUALITY_TRIGGER) {
          this.useLowQuality = false;
          this.highQualityFrames = 0;
          this.lowQualityFrames = 0;
        }
      } else {
        this.highQualityFrames = 0;
      }
    }
  }

  private renderBackground(): void {
    const { width, height } = this.state.bounds;
    const gradient = this.ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.7
    );
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#0f0f1a');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, width, height);
  }

  private renderTrails(particles: Particle[]): void {
    const { width, height } = this.state.bounds;
    this.trailCtx.globalCompositeOperation = 'source-over';
    this.trailCtx.fillStyle = 'rgba(15, 15, 26, 0.18)';
    this.trailCtx.fillRect(0, 0, width, height);

    this.trailCtx.globalCompositeOperation = 'lighter';
    const r = this.state.particleRadius * 0.8;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const speed = Math.min(p.speed() / 300, 1);
      const color = this.velocityColor(speed, p.type);
      this.trailCtx.fillStyle = color;
      this.trailCtx.beginPath();
      this.trailCtx.arc(p.pos.x, p.pos.y, r * 0.6, 0, Math.PI * 2);
      this.trailCtx.fill();
    }
    this.trailCtx.globalCompositeOperation = 'source-over';
  }

  private renderParticles(particles: Particle[]): void {
    const r = this.state.particleRadius;

    if (this.useLowQuality) {
      this.ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const speed = Math.min(p.speed() / 300, 1);
        this.ctx.fillStyle = this.velocityColorSolid(speed, p.type);
        this.ctx.fillRect(p.pos.x - r * 0.5, p.pos.y - r * 0.5, r, r);
      }
      this.ctx.globalCompositeOperation = 'source-over';
    } else {
      for (let i = 0; i < particles.length; i++) {
        this.renderParticleGlow(particles[i], r);
      }
      this.ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < particles.length; i++) {
        this.renderParticleCore(particles[i], r);
      }
      this.ctx.globalCompositeOperation = 'source-over';
    }
  }

  private renderParticleGlow(p: Particle, r: number): void {
    const speed = Math.min(p.speed() / 300, 1);
    const color = this.velocityColor(speed, p.type);
    const glowR = r * 2.2;
    const grad = this.ctx.createRadialGradient(p.pos.x, p.pos.y, 0, p.pos.x, p.pos.y, glowR);
    grad.addColorStop(0, color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    this.ctx.arc(p.pos.x, p.pos.y, glowR, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private renderParticleCore(p: Particle, r: number): void {
    const speed = Math.min(p.speed() / 300, 1);
    const color = this.velocityColorSolid(speed, p.type);
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(p.pos.x, p.pos.y, r, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private renderPolygons(polygons: Polygon[]): void {
    for (const poly of polygons) {
      this.renderPolygonGlow(poly);
      this.renderPolygonBody(poly);
    }
  }

  private renderPolygonGlow(poly: Polygon): void {
    this.ctx.save();
    this.ctx.shadowColor = 'rgba(100, 220, 255, 0.6)';
    this.ctx.shadowBlur = poly.dragging ? 30 : 18;
    this.ctx.beginPath();
    this.ctx.moveTo(poly.vertices[0].x, poly.vertices[0].y);
    for (let i = 1; i < poly.vertices.length; i++) {
      this.ctx.lineTo(poly.vertices[i].x, poly.vertices[i].y);
    }
    this.ctx.closePath();
    this.ctx.fillStyle = 'rgba(100, 220, 255, 0.08)';
    this.ctx.fill();
    this.ctx.restore();
  }

  private renderPolygonBody(poly: Polygon): void {
    const fillAlpha = poly.dragging ? 0.28 : 0.22;
    const strokeAlpha = poly.dragging ? 0.85 : 0.6;

    this.ctx.beginPath();
    this.ctx.moveTo(poly.vertices[0].x, poly.vertices[0].y);
    for (let i = 1; i < poly.vertices.length; i++) {
      this.ctx.lineTo(poly.vertices[i].x, poly.vertices[i].y);
    }
    this.ctx.closePath();

    this.ctx.fillStyle = `rgba(100, 220, 255, ${fillAlpha})`;
    this.ctx.fill();

    this.ctx.strokeStyle = `rgba(150, 230, 255, ${strokeAlpha})`;
    this.ctx.lineWidth = poly.dragging ? 2.5 : 1.8;
    this.ctx.stroke();
  }

  private velocityColor(t: number, type: 'water' | 'smoke'): string {
    t = Math.max(0, Math.min(1, t));
    let r: number, g: number, b: number, a: number;

    if (type === 'water') {
      r = Math.floor(79 + (255 - 79) * t);
      g = Math.floor(195 + (82 - 195) * t);
      b = Math.floor(247 + (82 - 247) * t);
      a = 0.5 + t * 0.3;
    } else {
      r = Math.floor(120 + (220 - 120) * t);
      g = Math.floor(120 + (150 - 120) * t);
      b = Math.floor(140 + (170 - 140) * t);
      a = 0.3 + t * 0.25;
    }
    return `rgba(${r},${g},${b},${a})`;
  }

  private velocityColorSolid(t: number, type: 'water' | 'smoke'): string {
    t = Math.max(0, Math.min(1, t));
    let r: number, g: number, b: number;

    if (type === 'water') {
      r = Math.floor(79 + (255 - 79) * t);
      g = Math.floor(195 + (82 - 195) * t);
      b = Math.floor(247 + (82 - 247) * t);
    } else {
      r = Math.floor(180 + (220 - 180) * t);
      g = Math.floor(180 + (200 - 180) * t);
      b = Math.floor(195 + (215 - 195) * t);
    }
    return `rgb(${r},${g},${b})`;
  }
}
