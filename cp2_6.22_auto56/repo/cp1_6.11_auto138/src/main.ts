import { FluidArtEngine } from './fluidArt';

const ASPECT_RATIO = 16 / 9;
const PANEL_WIDTH = 240;

interface UIState {
  lastMouseDown: boolean;
  mouseDownX: number;
  mouseDownY: number;
}

class FluidArtApp {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private engine: FluidArtEngine;
  private container: HTMLElement;

  private fpsCounter: HTMLElement;
  private frameCount: number = 0;
  private lastFpsUpdate: number = 0;
  private currentFps: number = 0;

  private lastFrameTime: number = 0;
  private animationId: number = 0;

  private uiState: UIState = {
    lastMouseDown: false,
    mouseDownX: 0,
    mouseDownY: 0
  };

  private clickThreshold: number = 250;
  private clickDistance: number = 5;

  constructor() {
    const canvasEl = document.getElementById('main-canvas');
    if (!canvasEl) {
      throw new Error('Canvas element not found');
    }
    this.canvas = canvasEl as HTMLCanvasElement;

    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    this.ctx = ctx;

    const containerEl = document.getElementById('canvas-container');
    if (!containerEl) {
      throw new Error('Canvas container not found');
    }
    this.container = containerEl;

    const fpsEl = document.getElementById('fps-counter');
    if (!fpsEl) {
      throw new Error('FPS counter not found');
    }
    this.fpsCounter = fpsEl;

    const { width, height } = this.calculateCanvasSize();
    this.engine = new FluidArtEngine(width, height);
    this.setupCanvas(width, height);
    this.bindEvents();
    this.startLoop();
  }

  private calculateCanvasSize(): { width: number; height: number } {
    const maxWidth = window.innerWidth - PANEL_WIDTH - 64;
    const maxHeight = window.innerHeight - 64;

    let width = maxWidth;
    let height = width / ASPECT_RATIO;

    if (height > maxHeight) {
      height = maxHeight;
      width = height * ASPECT_RATIO;
    }

    return {
      width: Math.max(480, Math.floor(width)),
      height: Math.max(270, Math.floor(height))
    };
  }

  private setupCanvas(width: number, height: number): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.canvas.width = Math.floor(width * dpr);
    this.canvas.height = Math.floor(height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.engine.resize(width, height);
  }

  private bindEvents(): void {
    this.canvas.addEventListener('mousedown', this.onMouseDown);
    this.canvas.addEventListener('mousemove', this.onMouseMove);
    this.canvas.addEventListener('mouseup', this.onMouseUp);
    this.canvas.addEventListener('mouseleave', this.onMouseLeave);
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('resize', this.onResize);

    const speedSlider = document.getElementById('speed-slider') as HTMLInputElement;
    const hueSlider = document.getElementById('hue-slider') as HTMLInputElement;
    const sizeSlider = document.getElementById('size-slider') as HTMLInputElement;
    const forceSlider = document.getElementById('force-slider') as HTMLInputElement;

    const speedValue = document.getElementById('speed-value') as HTMLElement;
    const hueValue = document.getElementById('hue-value') as HTMLElement;
    const sizeValue = document.getElementById('size-value') as HTMLElement;
    const forceValue = document.getElementById('force-value') as HTMLElement;

    speedSlider.addEventListener('input', () => {
      const v = parseFloat(speedSlider.value);
      this.engine.params.speedMultiplier = v;
      speedValue.textContent = v.toFixed(2);
    });

    hueSlider.addEventListener('input', () => {
      const v = parseFloat(hueSlider.value);
      this.engine.params.hueScrollSpeed = v;
      hueValue.textContent = v.toFixed(2);
    });

    sizeSlider.addEventListener('input', () => {
      const v = parseFloat(sizeSlider.value);
      this.engine.params.particleSize = v;
      sizeValue.textContent = v.toFixed(1);
    });

    forceSlider.addEventListener('input', () => {
      const v = parseFloat(forceSlider.value);
      this.engine.params.mouseForceStrength = v;
      forceValue.textContent = Math.round(v).toString();
    });

    const resetBtn = document.getElementById('reset-btn') as HTMLButtonElement;
    const saveBtn = document.getElementById('save-btn') as HTMLButtonElement;

    resetBtn.addEventListener('click', () => {
      this.engine.reset();
    });

    saveBtn.addEventListener('click', () => {
      this.saveImage();
    });
  }

  private getCanvasMousePosition(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  private onMouseDown = (e: MouseEvent): void => {
    e.preventDefault();
    const pos = this.getCanvasMousePosition(e.clientX, e.clientY);
    this.uiState.lastMouseDown = true;
    this.uiState.mouseDownX = pos.x;
    this.uiState.mouseDownY = pos.y;
    this.engine.mouse.isDown = true;
    this.engine.setMousePosition(pos.x, pos.y);
  };

  private onMouseMove = (e: MouseEvent): void => {
    const pos = this.getCanvasMousePosition(e.clientX, e.clientY);
    this.engine.setMousePosition(pos.x, pos.y);
  };

  private onMouseUp = (e: MouseEvent): void => {
    const pos = this.getCanvasMousePosition(e.clientX, e.clientY);
    const dx = pos.x - this.uiState.mouseDownX;
    const dy = pos.y - this.uiState.mouseDownY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (this.uiState.lastMouseDown && dist < this.clickDistance) {
      this.engine.addVortex(pos.x, pos.y);
    }

    this.uiState.lastMouseDown = false;
    this.engine.mouse.isDown = false;
    this.engine.resetMouse();
  };

  private onMouseLeave = (): void => {
    this.uiState.lastMouseDown = false;
    this.engine.mouse.isDown = false;
    this.engine.resetMouse();
  };

  private onResize = (): void => {
    const { width, height } = this.calculateCanvasSize();
    this.setupCanvas(width, height);
  };

  private updateFPS(now: number): void {
    this.frameCount++;
    if (now - this.lastFpsUpdate >= 500) {
      this.currentFps = Math.round(this.frameCount * 1000 / (now - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = now;

      this.fpsCounter.textContent = `FPS: ${this.currentFps} | 粒子: ${this.engine.getParticleCount()}`;

      if (this.currentFps < 30) {
        this.fpsCounter.classList.add('warning');
      } else {
        this.fpsCounter.classList.remove('warning');
      }
    }
  }

  private animate = (now: number): void => {
    if (!this.lastFrameTime) {
      this.lastFrameTime = now;
      this.lastFpsUpdate = now;
    }

    const deltaTime = Math.min(now - this.lastFrameTime, 50);
    this.lastFrameTime = now;

    this.engine.update(deltaTime);
    this.engine.render(this.ctx);
    this.updateFPS(now);

    this.animationId = requestAnimationFrame(this.animate);
  };

  private startLoop(): void {
    this.animationId = requestAnimationFrame(this.animate);
  }

  private saveImage(): void {
    const dataUrl = this.engine.exportHighResPNG(1920, 1080);
    const link = document.createElement('a');
    const timestamp = new Date();
    const fileName = `fluid-art-${timestamp.getFullYear()}${String(timestamp.getMonth() + 1).padStart(2, '0')}${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}${String(timestamp.getMinutes()).padStart(2, '0')}${String(timestamp.getSeconds()).padStart(2, '0')}.png`;
    link.download = fileName;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  public destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}

function init(): void {
  try {
    new FluidArtApp();
  } catch (error) {
    console.error('Failed to initialize FluidArtApp:', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
