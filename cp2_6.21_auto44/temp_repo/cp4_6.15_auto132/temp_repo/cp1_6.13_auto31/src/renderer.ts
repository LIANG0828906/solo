import { RingData, MirrorMode } from './types';
import { ImageProcessor } from './imageProcessor';

export class Renderer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private processor: ImageProcessor;

  constructor(processor: ImageProcessor) {
    this.processor = processor;
  }

  setCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Canvas 2D context not available');
    this.ctx = ctx;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  }

  resize(size: number): void {
    if (!this.canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;
    this.canvas.style.width = size + 'px';
    this.canvas.style.height = size + 'px';
    if (this.ctx) {
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  render(
    image: HTMLImageElement,
    rings: RingData[],
    mirrorMode: MirrorMode,
    dividerOpacity: number,
    targetSize?: number
  ): void {
    if (!this.canvas || !this.ctx) return;

    const size = targetSize ?? this.canvas.clientWidth;
    const ctx = this.ctx;
    const center = size / 2;

    ctx.fillStyle = '#0f0f1a';
    ctx.fillRect(0, 0, size, size);

    if (rings.length === 0) return;

    const quadrants = this.processor.getMirrorQuadrants(mirrorMode);

    for (const q of quadrants) {
      ctx.save();
      const dw = q.drawRegion.w * size;
      const dh = q.drawRegion.h * size;
      const dx = q.drawRegion.x * size;
      const dy = q.drawRegion.y * size;

      ctx.beginPath();
      ctx.rect(dx, dy, dw, dh);
      ctx.clip();

      ctx.save();
      ctx.translate(dx + dw / 2, dy + dh / 2);
      if (q.flipX) ctx.scale(-1, 1);
      if (q.flipY) ctx.scale(1, -1);
      ctx.translate(-size / 2, -size / 2);

      this.drawAllRings(ctx, image, rings, size, center);
      ctx.restore();
      ctx.restore();
    }

    if (dividerOpacity > 0) {
      this.drawDividers(ctx, rings, size, center, dividerOpacity);
    }
  }

  private drawAllRings(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    rings: RingData[],
    size: number,
    center: number
  ): void {
    for (const ring of rings) {
      ctx.save();
      ctx.beginPath();
      this.annularPath(ctx, center, center, ring.innerRadius + 0.3, ring.outerRadius - 0.3);
      ctx.clip();

      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(ring.rotation);
      ctx.translate(-center, -center);

      const drawSize = ring.outerRadius * 2 * 1.02;
      const drawX = center - drawSize / 2;
      const drawY = center - drawSize / 2;

      let sx = 0, sy = 0, sw = image.naturalWidth, sh = image.naturalHeight;
      if (image.naturalWidth > 0 && image.naturalHeight > 0) {
        if (sw > sh) {
          const excess = (sw - sh) / 2;
          sx = excess;
          sw = sh;
        } else {
          const excess = (sh - sw) / 2;
          sy = excess;
          sh = sw;
        }
      }

      ctx.drawImage(image, sx, sy, sw, sh, drawX, drawY, drawSize, drawSize);
      ctx.restore();
      ctx.restore();
    }
  }

  private annularPath(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    innerR: number,
    outerR: number
  ): void {
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    if (innerR > 0.1) {
      ctx.moveTo(cx + innerR, cy);
      ctx.arc(cx, cy, innerR, 0, Math.PI * 2, true);
    } else {
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, 0.1, 0, Math.PI * 2, true);
    }
    ctx.closePath();
  }

  private drawDividers(
    ctx: CanvasRenderingContext2D,
    rings: RingData[],
    size: number,
    center: number,
    opacity: number
  ): void {
    if (rings.length === 0) return;
    ctx.save();
    ctx.strokeStyle = `rgba(0, 0, 0, ${Math.max(0, Math.min(1, opacity))})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= rings.length; i++) {
      let r: number;
      if (i === 0) {
        r = rings[0].innerRadius;
      } else if (i === rings.length) {
        r = rings[rings.length - 1].outerRadius;
      } else {
        const prev = rings[i - 1].outerRadius;
        const next = rings[i].innerRadius;
        r = (prev + next) / 2;
      }
      if (r <= 0) continue;
      ctx.moveTo(center + r, center);
      ctx.arc(center, center, r, 0, Math.PI * 2);
    }
    ctx.stroke();
    ctx.restore();
  }

  async exportPNG(
    resolution: number,
    image: HTMLImageElement,
    rings: RingData[],
    mirrorMode: MirrorMode,
    dividerOpacity: number,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = resolution;
    exportCanvas.height = resolution;
    const ctx = exportCanvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Export canvas context failed');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const originalCanvas = this.canvas;
    const originalCtx = this.ctx;

    this.canvas = exportCanvas;
    this.ctx = ctx;

    let startTime = 0;
    const duration = 1500;

    await new Promise<void>((resolve) => {
      const animate = (t: number) => {
        if (startTime === 0) startTime = t;
        const elapsed = t - startTime;
        const progress = Math.min(elapsed / duration, 1);
        if (onProgress) onProgress(progress);

        this.render(image, rings, mirrorMode, dividerOpacity, resolution);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(animate);
    });

    this.canvas = originalCanvas;
    this.ctx = originalCtx;

    return new Promise((resolve, reject) => {
      exportCanvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('PNG blob creation failed'));
        },
        'image/png',
        1.0
      );
    });
  }
}
