import { SilkTexture } from './texture';
import { BrushModel, type BrushType } from './brush';
import { InkSimulator } from './ink';

interface PointerState {
  isDrawing: boolean;
  lastX: number;
  lastY: number;
  lastTime: number;
  pressure: number;
  angle: number;
  speed: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
}

interface HistoryState {
  inkImageData: ImageData;
  step: number;
}

const MAX_HISTORY = 10;

export class PaintingCanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;

  private texture: SilkTexture;
  private brush: BrushModel;
  private ink: InkSimulator;

  private pointer: PointerState;
  private particles: Particle[] = [];

  private historyStack: HistoryState[] = [];
  private historyIndex: number = -1;
  private maxHistory: number = MAX_HISTORY;

  private animationId: number | null = null;
  private lastFrameTime: number = 0;
  private fps: number = 60;
  private fpsUpdateTime: number = 0;
  private frameCount: number = 0;

  private onStateChange?: () => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2D context');
    this.ctx = ctx;

    this.width = canvas.width;
    this.height = canvas.height;

    this.texture = new SilkTexture(this.width, this.height);
    this.brush = new BrushModel();
    this.ink = new InkSimulator(this.width, this.height);

    this.pointer = {
      isDrawing: false,
      lastX: 0,
      lastY: 0,
      lastTime: 0,
      pressure: 0.5,
      angle: 0,
      speed: 0
    };

    this.bindEvents();
    this.saveHistory();
    this.render();
  }

  private bindEvents(): void {
    const canvas = this.canvas;

    canvas.addEventListener('mousedown', this.handlePointerDown);
    canvas.addEventListener('mousemove', this.handlePointerMove);
    canvas.addEventListener('mouseup', this.handlePointerUp);
    canvas.addEventListener('mouseleave', this.handlePointerUp);

    canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', this.handleTouchEnd);
    canvas.addEventListener('touchcancel', this.handleTouchEnd);
  }

  private getCanvasCoords(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  private handlePointerDown = (e: MouseEvent): void => {
    if (e.button !== 0) return;
    const { x, y } = this.getCanvasCoords(e.clientX, e.clientY);
    this.startDrawing(x, y, 0.5);
  };

  private handlePointerMove = (e: MouseEvent): void => {
    const { x, y } = this.getCanvasCoords(e.clientX, e.clientY);
    this.moveDrawing(x, y);
  };

  private handlePointerUp = (_e: MouseEvent): void => {
    this.endDrawing();
  };

  private handleTouchStart = (e: TouchEvent): void => {
    e.preventDefault();
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    const { x, y } = this.getCanvasCoords(touch.clientX, touch.clientY);
    const pressure = touch.force || 0.5;
    this.startDrawing(x, y, pressure);
  };

  private handleTouchMove = (e: TouchEvent): void => {
    e.preventDefault();
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    const { x, y } = this.getCanvasCoords(touch.clientX, touch.clientY);
    const pressure = touch.force || 0.5;
    this.pointer.pressure = pressure;
    this.moveDrawing(x, y);
  };

  private handleTouchEnd = (_e: TouchEvent): void => {
    this.endDrawing();
  };

  private startDrawing(x: number, y: number, pressure: number): void {
    this.pointer.isDrawing = true;
    this.pointer.lastX = x;
    this.pointer.lastY = y;
    this.pointer.lastTime = performance.now();
    this.pointer.pressure = pressure;
    this.pointer.speed = 0;
    this.pointer.angle = 0;

    this.drawAtPoint(x, y);
  }

  private moveDrawing(x: number, y: number): void {
    if (!this.pointer.isDrawing) return;

    const now = performance.now();
    const dt = now - this.pointer.lastTime;
    if (dt < 1) return;

    const dx = x - this.pointer.lastX;
    const dy = y - this.pointer.lastY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const speed = Math.min(dist / dt * 10, 10);
    this.pointer.speed = this.pointer.speed * 0.7 + speed * 0.3;

    if (dist > 1) {
      this.pointer.angle = Math.atan2(dy, dx) * 180 / Math.PI;
    }

    const steps = Math.max(1, Math.floor(dist / 2));
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const px = this.pointer.lastX + dx * t;
      const py = this.pointer.lastY + dy * t;
      this.drawAtPoint(px, py);
    }

    this.pointer.lastX = x;
    this.pointer.lastY = y;
    this.pointer.lastTime = now;
  }

  private endDrawing(): void {
    if (!this.pointer.isDrawing) return;
    this.pointer.isDrawing = false;

    this.spawnSplashParticles();
    this.ink.applyDiffusion(this.texture.getNoiseValue.bind(this.texture));
    this.saveHistory();
    this.notifyStateChange();
  }

  private drawAtPoint(x: number, y: number): void {
    const points = this.brush.computePoints(
      x,
      y,
      this.pointer.pressure,
      this.pointer.speed / 10,
      this.pointer.angle
    );

    this.ink.applyBrushPoints(points, this.texture.getNoiseValue.bind(this.texture));
  }

  private spawnSplashParticles(): void {
    const direction = this.pointer.angle;
    const particles = this.brush.createSplashParticles(
      this.pointer.lastX,
      this.pointer.lastY,
      direction,
      this.pointer.pressure
    );

    for (const p of particles) {
      this.particles.push({
        x: p.x,
        y: p.y,
        vx: p.vx,
        vy: p.vy,
        size: p.size,
        alpha: p.alpha * this.ink.getDensity(),
        life: p.life,
        maxLife: p.life
      });
    }
  }

  private updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.vy += 5 * dt;
      p.alpha = (p.life / p.maxLife) * p.alpha;

      if (Math.random() < 0.3) {
        const ctx = this.ink.getCanvas().getContext('2d');
        if (ctx) {
          const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          gradient.addColorStop(0, `rgba(20, 18, 16, ${p.alpha})`);
          gradient.addColorStop(1, 'rgba(20, 18, 16, 0)');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  private saveHistory(): void {
    const inkData = this.ink.getImageData();

    if (this.historyIndex < this.historyStack.length - 1) {
      this.historyStack = this.historyStack.slice(0, this.historyIndex + 1);
    }

    this.historyStack.push({
      inkImageData: inkData,
      step: this.historyIndex + 2
    });

    if (this.historyStack.length > this.maxHistory) {
      this.historyStack.shift();
    } else {
      this.historyIndex++;
    }
  }

  public undo(): void {
    if (this.historyIndex <= 0) return;
    this.historyIndex--;
    const state = this.historyStack[this.historyIndex];
    this.ink.putImageData(state.inkImageData);
    this.notifyStateChange();
  }

  public redo(): void {
    if (this.historyIndex >= this.historyStack.length - 1) return;
    this.historyIndex++;
    const state = this.historyStack[this.historyIndex];
    this.ink.putImageData(state.inkImageData);
    this.notifyStateChange();
  }

  public canUndo(): boolean {
    return this.historyIndex > 0;
  }

  public canRedo(): boolean {
    return this.historyIndex < this.historyStack.length - 1;
  }

  public getCurrentStep(): number {
    return this.historyIndex + 1;
  }

  public getMaxHistory(): number {
    return this.maxHistory;
  }

  public clear(): void {
    this.ink.clear();
    this.historyStack = [];
    this.historyIndex = -1;
    this.saveHistory();
    this.notifyStateChange();
  }

  public setBrushType(type: BrushType): void {
    this.brush.setType(type);
  }

  public getBrushType(): BrushType {
    return this.brush.getType();
  }

  public setBrushSize(size: number): void {
    this.brush.setBaseSize(size);
  }

  public getBrushSize(): number {
    return this.brush.getBaseSize();
  }

  public setInkDensity(density: number): void {
    this.ink.setDensity(density);
  }

  public getInkDensity(): number {
    return this.ink.getDensity();
  }

  public exportPNG(): string {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = this.width;
    exportCanvas.height = this.height;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return '';

    ctx.drawImage(this.texture.getTextureCanvas(), 0, 0);
    ctx.drawImage(this.ink.getCanvas(), 0, 0);

    return exportCanvas.toDataURL('image/png');
  }

  public downloadPNG(): void {
    const dataUrl = this.exportPNG();
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.download = `富春山居图_${timestamp}.png`;
    link.href = dataUrl;
    link.click();
  }

  public getFPS(): number {
    return this.fps;
  }

  public setStateChangeCallback(callback: () => void): void {
    this.onStateChange = callback;
  }

  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange();
    }
  }

  private render = (): void => {
    const now = performance.now();
    const dt = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;

    this.frameCount++;
    if (now - this.fpsUpdateTime >= 500) {
      this.fps = Math.round(this.frameCount / ((now - this.fpsUpdateTime) / 1000));
      this.frameCount = 0;
      this.fpsUpdateTime = now;
    }

    if (this.particles.length > 0) {
      this.updateParticles(dt);
    }

    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.drawImage(this.texture.getTextureCanvas(), 0, 0);
    this.ctx.drawImage(this.ink.getCanvas(), 0, 0);

    this.animationId = requestAnimationFrame(this.render);
  };

  public destroy(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
  }
}
