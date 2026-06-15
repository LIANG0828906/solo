import { animationQueue } from './animation';

export interface Engine {
  startLoop(renderFn: (dt: number) => void): void;
  stopLoop(): void;
  getCanvas(): HTMLCanvasElement;
  getContext(): CanvasRenderingContext2D;
  getFPS(): number;
  resize(width: number, height: number): void;
}

class RenderEngine implements Engine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationId: number | null = null;
  private lastTime: number = 0;
  private fps: number = 0;
  private frameCount: number = 0;
  private fpsTimer: number = 0;
  private renderFn: ((dt: number) => void) | null = null;

  constructor(canvasId: string) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (!canvas) {
      throw new Error(`Canvas with id "${canvasId}" not found`);
    }
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D rendering context');
    }
    this.ctx = ctx;
  }

  startLoop(renderFn: (dt: number) => void): void {
    this.renderFn = renderFn;
    this.lastTime = performance.now();
    this.frameCount = 0;
    this.fpsTimer = 0;
    this.loop();
  }

  private loop(): void {
    const currentTime = performance.now();
    const dt = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    this.frameCount++;
    this.fpsTimer += dt;
    if (this.fpsTimer >= 1) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    animationQueue.update(dt);

    if (this.renderFn) {
      this.renderFn(dt);
    }

    this.animationId = requestAnimationFrame(() => this.loop());
  }

  stopLoop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.renderFn = null;
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  getFPS(): number {
    return this.fps;
  }

  resize(width: number, height: number): void {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.scale(dpr, dpr);
  }
}

let engineInstance: RenderEngine | null = null;

export function createEngine(canvasId: string): Engine {
  if (!engineInstance) {
    engineInstance = new RenderEngine(canvasId);
  }
  return engineInstance;
}

export function getEngine(): Engine | null {
  return engineInstance;
}
