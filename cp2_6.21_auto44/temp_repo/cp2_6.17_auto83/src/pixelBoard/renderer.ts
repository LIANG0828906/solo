import type { Pixel } from './types';
import { GRID_SIZE, PIXEL_SIZE, CANVAS_SIZE } from './types';

export class PixelRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private pixels: Pixel[] = [];
  private cursorAnimations: Map<string, { startTime: number; x: number; y: number }> = new Map();
  private animationFrameId: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context');
    this.ctx = ctx;
    this.canvas.width = CANVAS_SIZE;
    this.canvas.height = CANVAS_SIZE;
  }

  clearCanvas(): void {
    this.ctx.fillStyle = '#E0E0E0';
    this.ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    this.drawGrid();
  }

  drawGrid(): void {
    this.ctx.strokeStyle = '#CCCCCC';
    this.ctx.lineWidth = 1;

    for (let i = 0; i <= GRID_SIZE; i++) {
      const pos = i * PIXEL_SIZE;
      
      this.ctx.beginPath();
      this.ctx.moveTo(pos, 0);
      this.ctx.lineTo(pos, CANVAS_SIZE);
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.moveTo(0, pos);
      this.ctx.lineTo(CANVAS_SIZE, pos);
      this.ctx.stroke();
    }
  }

  drawPixel(pixel: Pixel): void {
    const x = pixel.x * PIXEL_SIZE + 1;
    const y = pixel.y * PIXEL_SIZE + 1;
    const size = PIXEL_SIZE - 2;

    this.ctx.fillStyle = pixel.color;
    this.ctx.fillRect(x, y, size, size);
  }

  renderAll(pixels: Pixel[]): void {
    this.pixels = pixels;
    this.clearCanvas();
    for (const pixel of pixels) {
      this.drawPixel(pixel);
    }
  }

  addCursorAnimation(pixelId: string, x: number, y: number): void {
    this.cursorAnimations.set(pixelId, {
      startTime: performance.now(),
      x,
      y,
    });
    this.startAnimationLoop();
  }

  private startAnimationLoop(): void {
    if (this.animationFrameId !== null) return;

    const animate = () => {
      const now = performance.now();
      this.clearCanvas();
      for (const pixel of this.pixels) {
        this.drawPixel(pixel);
      }

      let hasActiveAnimations = false;

      for (const [, anim] of this.cursorAnimations) {
        const elapsed = now - anim.startTime;
        const duration = 300;

        if (elapsed < duration) {
          hasActiveAnimations = true;
          const progress = elapsed / duration;
          const alpha = 0.6 * (1 - progress);
          const scale = 1 + progress * 0.5;

          const centerX = anim.x * PIXEL_SIZE + PIXEL_SIZE / 2;
          const centerY = anim.y * PIXEL_SIZE + PIXEL_SIZE / 2;
          const size = PIXEL_SIZE * scale;

          this.ctx.fillStyle = `rgba(255, 217, 61, ${alpha})`;
          this.ctx.fillRect(
            centerX - size / 2,
            centerY - size / 2,
            size,
            size
          );
        }
      }

      this.cursorAnimations = new Map(
        [...this.cursorAnimations].filter(([, anim]) => now - anim.startTime < 300)
      );

      if (hasActiveAnimations) {
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        this.animationFrameId = null;
      }
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.cursorAnimations.clear();
  }
}

export function createPixelRenderer(canvas: HTMLCanvasElement): PixelRenderer {
  return new PixelRenderer(canvas);
}
