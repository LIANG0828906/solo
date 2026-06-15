import type { TextItem } from './sealDesigner';
import type { CarvingPath } from './sealEngraver';

const CANVAS_SIZE: number = 400;
const STAMP_COLOR: string = '#CC0000';
const DIFFUSION_DURATION: number = 600;
const DIFFUSION_RADIUS: number = 10;

export type CarveMode = 'yin' | 'yang';

export class SealPreview {
  private ctx: CanvasRenderingContext2D;
  private mode: CarveMode = 'yang';
  private currentStampImage: HTMLCanvasElement | null = null;
  private isAnimating: boolean = false;
  private animationStart: number = 0;
  private stampRotation: number = 0;
  private paperTextureCache: HTMLCanvasElement | null = null;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.generatePaperTexture();
    this.renderEmpty();
  }

  setMode(mode: CarveMode): void {
    this.mode = mode;
  }

  getMode(): CarveMode {
    return this.mode;
  }

  private generatePaperTexture(): void {
    const offscreen = document.createElement('canvas');
    offscreen.width = CANVAS_SIZE;
    offscreen.height = CANVAS_SIZE;
    const octx = offscreen.getContext('2d')!;

    octx.fillStyle = '#F5F0E1';
    octx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    const gradient = octx.createRadialGradient(
      CANVAS_SIZE / 2, CANVAS_SIZE / 2, 50,
      CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE / 2
    );
    gradient.addColorStop(0, 'rgba(245, 240, 225, 0)');
    gradient.addColorStop(1, 'rgba(238, 223, 204, 0.3)');
    octx.fillStyle = gradient;
    octx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    const imageData = octx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const fiber = (Math.random() - 0.5) * 6;
      data[i] = Math.max(0, Math.min(255, data[i] + fiber));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + fiber));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + fiber - 2));
    }
    octx.putImageData(imageData, 0, 0);

    for (let i = 0; i < 30; i++) {
      octx.save();
      octx.strokeStyle = `rgba(200, 180, 150, ${0.03 + Math.random() * 0.04})`;
      octx.lineWidth = 0.5;
      octx.beginPath();
      const startX = Math.random() * CANVAS_SIZE;
      const startY = Math.random() * CANVAS_SIZE;
      octx.moveTo(startX, startY);
      let cx = startX;
      let cy = startY;
      for (let j = 0; j < 5; j++) {
        cx += (Math.random() - 0.5) * 40;
        cy += (Math.random() - 0.5) * 10;
        octx.lineTo(cx, cy);
      }
      octx.stroke();
      octx.restore();
    }

    this.paperTextureCache = offscreen;
  }

  renderEmpty(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    if (this.paperTextureCache) {
      ctx.drawImage(this.paperTextureCache, 0, 0);
    }
  }

  stamp(
    textItems: TextItem[],
    carvingPaths: CarvingPath[],
    sealSizeMm: number,
    pixelsPerMm: number
  ): void {
    const stampImage = this.generateStampImage(textItems, carvingPaths, sealSizeMm, pixelsPerMm);
    this.currentStampImage = stampImage;
    this.stampRotation = (Math.random() - 0.5) * 4;
    this.animationStart = performance.now();
    this.isAnimating = true;
    this.animateStamp();
  }

  private generateStampImage(
    textItems: TextItem[],
    carvingPaths: CarvingPath[],
    sealSizeMm: number,
    pixelsPerMm: number
  ): HTMLCanvasElement {
    const sealPixelSize = sealSizeMm * pixelsPerMm;
    const sealOriginX = (CANVAS_SIZE - sealPixelSize) / 2;
    const sealOriginY = (CANVAS_SIZE - sealPixelSize) / 2;

    const offscreen = document.createElement('canvas');
    offscreen.width = CANVAS_SIZE;
    offscreen.height = CANVAS_SIZE;
    const octx = offscreen.getContext('2d')!;

    if (this.mode === 'yang') {
      octx.fillStyle = STAMP_COLOR;
      for (const item of textItems) {
        octx.save();
        octx.font = `bold ${item.fontSize}px 'KaiTi', 'STKaiti', 'SimSun', serif`;
        octx.textAlign = 'center';
        octx.textBaseline = 'middle';
        octx.fillText(item.char, item.x, item.y);
        octx.restore();
      }

      for (const path of carvingPaths) {
        this.drawCarvingOnStamp(octx, path, STAMP_COLOR);
      }

      octx.strokeStyle = STAMP_COLOR;
      octx.lineWidth = 2;
      octx.strokeRect(sealOriginX, sealOriginY, sealPixelSize, sealPixelSize);

    } else {
      octx.fillStyle = STAMP_COLOR;
      octx.fillRect(sealOriginX, sealOriginY, sealPixelSize, sealPixelSize);

      octx.globalCompositeOperation = 'destination-out';

      for (const item of textItems) {
        octx.save();
        octx.font = `bold ${item.fontSize}px 'KaiTi', 'STKaiti', 'SimSun', serif`;
        octx.textAlign = 'center';
        octx.textBaseline = 'middle';
        octx.fillText(item.char, item.x, item.y);
        octx.restore();
      }

      for (const path of carvingPaths) {
        this.drawCarvingOnStamp(octx, path, '#000000');
      }

      octx.globalCompositeOperation = 'source-over';
    }

    return offscreen;
  }

  private drawCarvingOnStamp(
    ctx: CanvasRenderingContext2D,
    path: CarvingPath,
    color: string
  ): void {
    const points = path.points;
    if (points.length < 2) return;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;

    if (path.brush === 'round') {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    } else {
      ctx.lineCap = 'butt';
      ctx.lineJoin = 'miter';
    }

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const w = (prev.width + curr.width) / 2;

      ctx.beginPath();
      ctx.lineWidth = w;
      ctx.moveTo(prev.x, prev.y);

      if (i < points.length - 1) {
        const next = points[i + 1];
        const midX = (curr.x + next.x) / 2;
        const midY = (curr.y + next.y) / 2;
        ctx.quadraticCurveTo(curr.x, curr.y, midX, midY);
      } else {
        ctx.lineTo(curr.x, curr.y);
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  private animateStamp(): void {
    if (!this.isAnimating || !this.currentStampImage) return;

    const now = performance.now();
    const elapsed = now - this.animationStart;
    const progress = Math.min(elapsed / DIFFUSION_DURATION, 1);

    const ctx = this.ctx;
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    if (this.paperTextureCache) {
      ctx.drawImage(this.paperTextureCache, 0, 0);
    }

    ctx.save();
    ctx.translate(CANVAS_SIZE / 2, CANVAS_SIZE / 2);
    ctx.rotate((this.stampRotation * Math.PI) / 180);
    ctx.translate(-CANVAS_SIZE / 2, -CANVAS_SIZE / 2);

    const scale = 1 + (1 - progress) * 0.02;
    const opacity = 0.3 + progress * 0.7;
    ctx.globalAlpha = opacity;
    ctx.translate(CANVAS_SIZE / 2, CANVAS_SIZE / 2);
    ctx.scale(scale, scale);
    ctx.translate(-CANVAS_SIZE / 2, -CANVAS_SIZE / 2);

    if (progress < 1) {
      const blur = DIFFUSION_RADIUS * (1 - progress);
      ctx.shadowColor = 'rgba(204, 0, 0, 0.25)';
      ctx.shadowBlur = blur;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }

    ctx.drawImage(this.currentStampImage, 0, 0);
    ctx.restore();

    if (progress < 1) {
      requestAnimationFrame(() => this.animateStamp());
    } else {
      this.isAnimating = false;
      this.renderFinal();
    }
  }

  private renderFinal(): void {
    if (!this.currentStampImage) return;

    const ctx = this.ctx;
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    if (this.paperTextureCache) {
      ctx.drawImage(this.paperTextureCache, 0, 0);
    }

    ctx.save();
    ctx.translate(CANVAS_SIZE / 2, CANVAS_SIZE / 2);
    ctx.rotate((this.stampRotation * Math.PI) / 180);
    ctx.translate(-CANVAS_SIZE / 2, -CANVAS_SIZE / 2);
    ctx.drawImage(this.currentStampImage, 0, 0);
    ctx.restore();
  }

  saveAsPNG(sealSizeMm: number): void {
    if (!this.currentStampImage) return;

    const dpi = 300;
    const inchPerMm = 1 / 25.4;
    const exportSize = Math.round(sealSizeMm * inchPerMm * dpi);

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = exportSize;
    exportCanvas.height = exportSize;
    const ectx = exportCanvas.getContext('2d')!;

    const paperCanvas = document.createElement('canvas');
    paperCanvas.width = exportSize;
    paperCanvas.height = exportSize;
    const pctx = paperCanvas.getContext('2d')!;

    pctx.fillStyle = '#F5F0E1';
    pctx.fillRect(0, 0, exportSize, exportSize);
    const imageData = pctx.getImageData(0, 0, exportSize, exportSize);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() - 0.5) * 6;
      data[i] = Math.max(0, Math.min(255, data[i] + n));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + n));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + n - 2));
    }
    pctx.putImageData(imageData, 0, 0);
    ectx.drawImage(paperCanvas, 0, 0);

    const scale = exportSize / CANVAS_SIZE;
    ectx.save();
    ectx.translate(exportSize / 2, exportSize / 2);
    ectx.rotate((this.stampRotation * Math.PI) / 180);
    ectx.translate(-exportSize / 2, -exportSize / 2);
    ectx.scale(scale, scale);
    ectx.drawImage(this.currentStampImage, 0, 0);
    ectx.restore();

    const link = document.createElement('a');
    link.download = `seal_imprint_${sealSizeMm}mm.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  }

  clear(): void {
    this.currentStampImage = null;
    this.isAnimating = false;
    this.renderEmpty();
  }
}
