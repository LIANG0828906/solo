import { CharGlyph, Point } from '../types';

const GRID_SIZE = 20;
const CELL_SIZE = 12;

export class FontRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private offscreenGrid: HTMLCanvasElement | null = null;
  private animationFrameId: number | null = null;
  private pendingDraw: (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not supported');
    this.ctx = ctx;
    this.precacheGrid();
  }

  private precacheGrid(): void {
    this.offscreenGrid = document.createElement('canvas');
    this.offscreenGrid.width = GRID_SIZE * CELL_SIZE;
    this.offscreenGrid.height = GRID_SIZE * CELL_SIZE;
    const offCtx = this.offscreenGrid.getContext('2d')!;

    offCtx.fillStyle = '#2D2D44';
    offCtx.fillRect(0, 0, this.offscreenGrid.width, this.offscreenGrid.height);

    offCtx.strokeStyle = '#3D3D5C';
    offCtx.lineWidth = 1;

    for (let i = 0; i <= GRID_SIZE; i++) {
      offCtx.beginPath();
      offCtx.moveTo(i * CELL_SIZE, 0);
      offCtx.lineTo(i * CELL_SIZE, GRID_SIZE * CELL_SIZE);
      offCtx.stroke();

      offCtx.beginPath();
      offCtx.moveTo(0, i * CELL_SIZE);
      offCtx.lineTo(GRID_SIZE * CELL_SIZE, i * CELL_SIZE);
      offCtx.stroke();
    }
  }

  drawGrid(): void {
    this.scheduleDraw(() => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      if (this.offscreenGrid) {
        this.ctx.drawImage(
          this.offscreenGrid,
          0,
          0,
          this.canvas.width,
          this.canvas.height
        );
      }
    });
  }

  drawGlyphOnGrid(glyph: CharGlyph): void {
    this.scheduleDraw(() => {
      const scaleX = this.canvas.width / GRID_SIZE;
      const scaleY = this.canvas.height / GRID_SIZE;

      this.ctx.save();
      this.ctx.fillStyle = '#4ECDC4';
      this.ctx.strokeStyle = '#FFFFFF';
      this.ctx.lineWidth = 0.5;

      for (const path of glyph.outline) {
        if (path.length < 2) continue;

        this.ctx.beginPath();
        this.ctx.moveTo(path[0].x * scaleX, path[0].y * scaleY);

        for (let i = 1; i < path.length; i++) {
          this.ctx.lineTo(path[i].x * scaleX, path[i].y * scaleY);
        }

        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
      }

      this.ctx.restore();
    });
  }

  drawHandwriting(points: Point[], color: string = '#333333', width: number = 3): void {
    if (points.length < 2) return;

    this.scheduleDraw(() => {
      this.ctx.save();
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';

      const fadeStart = Math.max(0, points.length - 10);

      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];

        const alpha = i < fadeStart ? 1 : 1 - (i - fadeStart) / (points.length - fadeStart);
        const lineWidth = i < fadeStart ? width : width * (1 - (i - fadeStart) / (points.length - fadeStart));

        this.ctx.globalAlpha = alpha;
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;

        this.ctx.beginPath();
        this.ctx.moveTo(prev.x, prev.y);
        this.ctx.lineTo(curr.x, curr.y);
        this.ctx.stroke();
      }

      this.ctx.restore();
    });
  }

  drawHandwritingSegment(points: Point[], color: string = '#333333', width: number = 3): void {
    if (points.length < 2) return;

    this.scheduleDraw(() => {
      this.ctx.save();
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = width;

      this.ctx.beginPath();
      this.ctx.moveTo(points[0].x, points[0].y);
      
      for (let i = 1; i < points.length; i++) {
        this.ctx.lineTo(points[i].x, points[i].y);
      }
      
      this.ctx.stroke();
      this.ctx.restore();
    });
  }

  async drawUploadedImage(imageDataUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.scheduleDraw(() => {
          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
          
          const scale = Math.min(
            this.canvas.width / img.width,
            this.canvas.height / img.height,
            1
          );
          const offsetX = (this.canvas.width - img.width * scale) / 2;
          const offsetY = (this.canvas.height - img.height * scale) / 2;
          
          this.ctx.drawImage(
            img,
            offsetX,
            offsetY,
            img.width * scale,
            img.height * scale
          );
        });
        resolve();
      };
      img.onerror = reject;
      img.src = imageDataUrl;
    });
  }

  drawPreviewText(text: string, glyphs: Map<string, CharGlyph>): void {
    this.scheduleDraw(() => {
      const fontSize = 20;
      const lineHeight = fontSize * 1.5;
      const startY = this.canvas.height - lineHeight * 2;
      let x = 10;
      let y = startY;

      this.ctx.save();
      this.ctx.fillStyle = '#E0E0E0';
      this.ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
      this.ctx.textBaseline = 'top';

      for (const char of text) {
        if (char === '\n') {
          x = 10;
          y += lineHeight;
          continue;
        }

        if (x + fontSize > this.canvas.width - 10) {
          x = 10;
          y += lineHeight;
        }

        const glyph = glyphs.get(char);
        if (glyph) {
          this.drawSmallGlyph(glyph, x, y, fontSize);
          x += fontSize * 0.7;
        } else {
          this.ctx.fillText(char, x, y);
          x += this.ctx.measureText(char).width + 2;
        }
      }

      this.ctx.restore();
    });
  }

  private drawSmallGlyph(glyph: CharGlyph, x: number, y: number, size: number): void {
    const scale = size / GRID_SIZE;
    
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.fillStyle = '#4ECDC4';
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 0.5;

    for (const path of glyph.outline) {
      if (path.length < 2) continue;

      this.ctx.beginPath();
      this.ctx.moveTo(path[0].x * scale, path[0].y * scale);

      for (let i = 1; i < path.length; i++) {
        this.ctx.lineTo(path[i].x * scale, path[i].y * scale);
      }

      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  clear(): void {
    this.scheduleDraw(() => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    });
  }

  clearBackground(color: string = '#FAFAFA'): void {
    this.scheduleDraw(() => {
      this.ctx.fillStyle = color;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    });
  }

  private scheduleDraw(drawFn: () => void): void {
    this.pendingDraw = drawFn;
    
    if (this.animationFrameId === null) {
      this.animationFrameId = requestAnimationFrame(() => {
        if (this.pendingDraw) {
          this.pendingDraw();
          this.pendingDraw = null;
        }
        this.animationFrameId = null;
      });
    }
  }

  resize(width: number, height: number): void {
    const ratio = window.devicePixelRatio || 1;
    this.canvas.width = width * ratio;
    this.canvas.height = height * ratio;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.scale(ratio, ratio);
    this.precacheGrid();
  }

  getImageData(): ImageData {
    return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
  }

  toDataURL(type?: string, quality?: number): string {
    return this.canvas.toDataURL(type, quality);
  }

  destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.pendingDraw = null;
    this.offscreenGrid = null;
  }
}
