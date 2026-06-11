import { StrokeManager } from './stroke';
import { UIController, UIState } from './ui';

const MAX_PARTICLES = 8000;

class ParticleCanvasApp {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private wrapper: HTMLElement;
  private strokeManager: StrokeManager;
  private uiController: UIController;
  private animationId: number | null = null;
  private dpr: number;
  private canvasSize: number = 0;

  constructor() {
    const canvasEl = document.getElementById('canvas');
    const wrapperEl = document.getElementById('canvas-wrapper');

    if (!canvasEl || !wrapperEl) {
      throw new Error('Canvas elements not found');
    }

    this.canvas = canvasEl as HTMLCanvasElement;
    this.wrapper = wrapperEl;
    this.dpr = window.devicePixelRatio || 1;

    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    this.ctx = ctx;

    this.strokeManager = new StrokeManager({
      particleSize: 4,
      lifespanSeconds: 4,
      baseColor: '#ff6b6b',
      maxParticles: MAX_PARTICLES
    });

    this.uiController = new UIController(
      {
        color: '#ff6b6b',
        particleSize: 4,
        lifespanSeconds: 4
      },
      (state: UIState) => this.handleUIChange(state),
      () => this.handleClear(),
      () => this.handleSave()
    );

    this.resize();
    this.bindCanvasEvents();
    this.bindWindowEvents();
    this.hideFontLoader();
    this.startLoop();
  }

  private hideFontLoader(): void {
    const loader = document.getElementById('font-loader');
    if (!loader) return;

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        loader.classList.add('hidden');
        setTimeout(() => loader.remove(), 600);
      });
    } else {
      setTimeout(() => {
        loader.classList.add('hidden');
        setTimeout(() => loader.remove(), 600);
      }, 1000);
    }
  }

  private resize(): void {
    const padding = window.innerWidth < 768 ? 15 : 30;
    const controlsHeight = window.innerWidth < 768 ? 120 : 100;
    const availableWidth = window.innerWidth - padding * 2;
    const availableHeight = window.innerHeight - padding * 2 - controlsHeight;
    this.canvasSize = Math.min(availableWidth, availableHeight);

    this.wrapper.style.width = `${this.canvasSize}px`;
    this.wrapper.style.height = `${this.canvasSize}px`;

    this.canvas.width = this.canvasSize * this.dpr;
    this.canvas.height = this.canvasSize * this.dpr;
    this.canvas.style.width = `${this.canvasSize}px`;
    this.canvas.style.height = `${this.canvasSize}px`;

    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  private drawBackground(): void {
    const gradient = this.ctx.createRadialGradient(
      this.canvasSize / 2, this.canvasSize / 2, 0,
      this.canvasSize / 2, this.canvasSize / 2, this.canvasSize * 0.7
    );
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.7, '#16213e');
    gradient.addColorStop(1, '#0f0f1e');

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvasSize, this.canvasSize);

    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.lineWidth = 0.5;

    const gridSize = 40;
    for (let x = 0; x <= this.canvasSize; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvasSize);
      this.ctx.stroke();
    }
    for (let y = 0; y <= this.canvasSize; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvasSize, y);
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  private getCanvasCoords(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  private bindCanvasEvents(): void {
    this.canvas.addEventListener('mousedown', (e: MouseEvent) => {
      e.preventDefault();
      const { x, y } = this.getCanvasCoords(e.clientX, e.clientY);
      this.strokeManager.startDrawing(x, y);
    });

    this.canvas.addEventListener('mousemove', (e: MouseEvent) => {
      const { x, y } = this.getCanvasCoords(e.clientX, e.clientY);
      this.strokeManager.move(x, y);
    });

    this.canvas.addEventListener('mouseup', () => {
      this.strokeManager.stopDrawing();
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.strokeManager.stopDrawing();
    });

    this.canvas.addEventListener('touchstart', (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const { x, y } = this.getCanvasCoords(touch.clientX, touch.clientY);
      this.strokeManager.startDrawing(x, y);
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const { x, y } = this.getCanvasCoords(touch.clientX, touch.clientY);
      this.strokeManager.move(x, y);
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e: TouchEvent) => {
      e.preventDefault();
      this.strokeManager.stopDrawing();
    }, { passive: false });

    this.canvas.addEventListener('touchcancel', () => {
      this.strokeManager.stopDrawing();
    });
  }

  private bindWindowEvents(): void {
    let resizeTimeout: number | null = null;
    window.addEventListener('resize', () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(() => this.resize(), 100);
    });
  }

  private handleUIChange(state: UIState): void {
    this.strokeManager.updateConfig({
      particleSize: state.particleSize,
      lifespanSeconds: state.lifespanSeconds,
      baseColor: state.color
    });
  }

  private handleClear(): void {
    this.strokeManager.clearAll();
  }

  private handleSave(): void {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    const gradient = tempCtx.createRadialGradient(
      this.canvasSize / 2, this.canvasSize / 2, 0,
      this.canvasSize / 2, this.canvasSize / 2, this.canvasSize * 0.7
    );
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.7, '#16213e');
    gradient.addColorStop(1, '#0f0f1e');
    tempCtx.fillStyle = gradient;
    tempCtx.fillRect(0, 0, this.canvasSize, this.canvasSize);

    tempCtx.drawImage(this.canvas, 0, 0, this.canvasSize, this.canvasSize);

    const link = document.createElement('a');
    link.download = 'particle_canvas.png';
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
  }

  private render(): void {
    this.drawBackground();
    this.strokeManager.render(this.ctx);
  }

  private update(): void {
    this.strokeManager.update();
  }

  private startLoop(): void {
    const loop = () => {
      this.update();
      this.render();
      this.animationId = requestAnimationFrame(loop);
    };
    this.animationId = requestAnimationFrame(loop);
  }

  destroy(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new ParticleCanvasApp();
});
