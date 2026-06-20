import { Particle } from './particle';
import { ForceField, EngineState } from './engine';

export interface RendererConfig {
  trailLength: number;
  trailAlpha: number;
  backgroundColor: string;
}

export class Renderer {
  private mainCanvas: HTMLCanvasElement;
  private mainCtx: CanvasRenderingContext2D;
  private trailCanvas: HTMLCanvasElement;
  private trailCtx: CanvasRenderingContext2D;
  private fpsCanvas: HTMLCanvasElement;
  private fpsCtx: CanvasRenderingContext2D;
  private config: RendererConfig;
  private width: number = 0;
  private height: number = 0;
  private devicePixelRatio: number = 1;
  private fpsFrames: number = 0;
  private fpsLastTime: number = 0;
  private currentFps: number = 60;

  constructor(mainCanvasId: string, trailCanvasId: string, config: Partial<RendererConfig> = {}) {
    const mainCanvas = document.getElementById(mainCanvasId);
    const trailCanvas = document.getElementById(trailCanvasId);

    if (!mainCanvas || !trailCanvas) {
      throw new Error('Canvas elements not found');
    }

    this.mainCanvas = mainCanvas as HTMLCanvasElement;
    this.trailCanvas = trailCanvas as HTMLCanvasElement;

    const mainCtx = this.mainCanvas.getContext('2d');
    const trailCtx = this.trailCanvas.getContext('2d');

    if (!mainCtx || !trailCtx) {
      throw new Error('Could not get 2D contexts');
    }

    this.mainCtx = mainCtx;
    this.trailCtx = trailCtx;

    this.fpsCanvas = document.createElement('canvas');
    this.fpsCanvas.style.position = 'fixed';
    this.fpsCanvas.style.top = '10px';
    this.fpsCanvas.style.left = '10px';
    this.fpsCanvas.style.zIndex = '100';
    this.fpsCanvas.style.pointerEvents = 'none';
    this.fpsCanvas.id = 'fps-canvas';

    const fpsCtx = this.fpsCanvas.getContext('2d');
    if (!fpsCtx) {
      throw new Error('Could not get FPS canvas context');
    }
    this.fpsCtx = fpsCtx;

    document.body.appendChild(this.fpsCanvas);

    this.config = {
      trailLength: 5,
      trailAlpha: 0.2,
      backgroundColor: '#0A0A1A',
      ...config
    };

    this.devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    this.fpsLastTime = performance.now();
  }

  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;

    this.resizeCanvas(this.mainCanvas, this.mainCtx);
    this.resizeCanvas(this.trailCanvas, this.trailCtx);

    this.fpsCanvas.width = 80 * this.devicePixelRatio;
    this.fpsCanvas.height = 28 * this.devicePixelRatio;
    this.fpsCanvas.style.width = '80px';
    this.fpsCanvas.style.height = '28px';
    this.fpsCtx.scale(this.devicePixelRatio, this.devicePixelRatio);

    this.clear();
  }

  private resizeCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
    canvas.width = this.width * this.devicePixelRatio;
    canvas.height = this.height * this.devicePixelRatio;
    canvas.style.width = `${this.width}px`;
    canvas.style.height = `${this.height}px`;
    ctx.setTransform(this.devicePixelRatio, 0, 0, this.devicePixelRatio, 0, 0);
  }

  public clear(): void {
    this.mainCtx.fillStyle = this.config.backgroundColor;
    this.mainCtx.fillRect(0, 0, this.width, this.height);

    this.trailCtx.clearRect(0, 0, this.width, this.height);
  }

  public clearTrails(): void {
    this.trailCtx.clearRect(0, 0, this.width, this.height);
  }

  public render(state: EngineState): number {
    this.fpsFrames++;
    const now = performance.now();
    if (now - this.fpsLastTime >= 500) {
      this.currentFps = Math.round((this.fpsFrames * 1000) / (now - this.fpsLastTime));
      this.fpsFrames = 0;
      this.fpsLastTime = now;
    }

    this.clearMainLayer();
    this.fadeTrailLayer();
    this.drawTrails(state.particles);
    this.drawParticles(state.particles);
    this.drawForceFieldIndicator(state.forceField);
    this.drawFPS(state.performanceWarning);

    return this.currentFps;
  }

  private clearMainLayer(): void {
    this.mainCtx.fillStyle = this.config.backgroundColor;
    this.mainCtx.fillRect(0, 0, this.width, this.height);
  }

  private fadeTrailLayer(): void {
    if (this.config.trailLength <= 0) {
      this.trailCtx.clearRect(0, 0, this.width, this.height);
      return;
    }

    const fadeAlpha = Math.max(0, 1 - 1 / this.config.trailLength);
    this.trailCtx.globalCompositeOperation = 'destination-out';
    this.trailCtx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
    this.trailCtx.fillRect(0, 0, this.width, this.height);
    this.trailCtx.globalCompositeOperation = 'source-over';
  }

  public drawTrails(particles: Particle[]): void {
    if (this.config.trailLength <= 0) return;

    const alpha = this.config.trailAlpha;
    this.trailCtx.globalCompositeOperation = 'lighter';

    for (const p of particles) {
      p.drawTrailSegment(this.trailCtx, alpha);
    }

    this.trailCtx.globalCompositeOperation = 'source-over';
  }

  private drawParticles(particles: Particle[]): void {
    this.mainCtx.globalCompositeOperation = 'lighter';

    for (const p of particles) {
      p.draw(this.mainCtx);
    }

    this.mainCtx.globalCompositeOperation = 'source-over';
  }

  private drawForceFieldIndicator(ff: ForceField): void {
    if (!ff.active) return;

    const isAttract = ff.mode === 'attract';
    const color = isAttract ? '#00DDFF' : '#FF44AA';
    const radius = 30 + Math.sin(performance.now() / 200) * 5;

    this.mainCtx.strokeStyle = color;
    this.mainCtx.lineWidth = 1.5;
    this.mainCtx.globalAlpha = 0.6;
    this.mainCtx.beginPath();
    this.mainCtx.arc(ff.x, ff.y, radius, 0, Math.PI * 2);
    this.mainCtx.stroke();

    this.mainCtx.beginPath();
    this.mainCtx.arc(ff.x, ff.y, radius * 0.6, 0, Math.PI * 2);
    this.mainCtx.stroke();

    this.mainCtx.fillStyle = color;
    this.mainCtx.globalAlpha = 0.8;
    this.mainCtx.font = 'bold 10px monospace';
    this.mainCtx.textAlign = 'center';
    this.mainCtx.textBaseline = 'middle';
    this.mainCtx.fillText(isAttract ? '+' : '−', ff.x, ff.y);

    this.mainCtx.globalAlpha = 1;
  }

  private drawFPS(warning: boolean): void {
    const ctx = this.fpsCtx;
    ctx.clearRect(0, 0, 80, 28);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.roundRect(ctx, 0, 0, 80, 28, 4);
    ctx.fill();

    const fpsColor = this.currentFps >= 45 ? '#00FF88' : this.currentFps >= 30 ? '#FFDD44' : '#FF4444';

    ctx.font = '14px "Courier New", monospace';
    ctx.fillStyle = fpsColor;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`FPS: ${this.currentFps}`, 8, 14);

    if (warning) {
      const flash = Math.sin(performance.now() / 500) > 0;
      if (flash) {
        ctx.strokeStyle = '#FF4444';
        ctx.lineWidth = 2;
        this.roundRect(ctx, 0, 0, 80, 28, 4);
        ctx.stroke();
      }
    }
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  public setConfig(key: keyof RendererConfig, value: any): void {
    if (key in this.config) {
      (this.config as any)[key] = value;
    }
  }

  public getConfig(): RendererConfig {
    return { ...this.config };
  }

  public getCurrentFPS(): number {
    return this.currentFps;
  }
}
