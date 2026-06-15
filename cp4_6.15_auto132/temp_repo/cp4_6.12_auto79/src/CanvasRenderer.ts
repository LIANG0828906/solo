export interface Viewport {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export interface CursorInfo {
  userId: string;
  color: string;
  x: number;
  y: number;
  name: string;
}

export interface HighlightPixel {
  x: number;
  y: number;
}

export const CANVAS_SIZE = 32;
export const MIN_SCALE = 0.5;
export const MAX_SCALE = 4;
export const DEFAULT_SCALE = 12;

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private pixelCanvas: HTMLCanvasElement;
  private pixelCtx: CanvasRenderingContext2D;
  private viewport: Viewport;
  private pixels: (string | null)[][];
  private gridColor = '#888888';
  private bgColor = '#ffffff';

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');
    this.ctx = ctx;

    this.pixelCanvas = document.createElement('canvas');
    this.pixelCanvas.width = CANVAS_SIZE;
    this.pixelCanvas.height = CANVAS_SIZE;
    const pCtx = this.pixelCanvas.getContext('2d');
    if (!pCtx) throw new Error('Offscreen canvas context not available');
    this.pixelCtx = pCtx;

    this.viewport = {
      scale: DEFAULT_SCALE,
      offsetX: 0,
      offsetY: 0,
    };

    this.pixels = Array.from({ length: CANVAS_SIZE }, () =>
      Array(CANVAS_SIZE).fill(null)
    );

    this.centerCanvas();
  }

  centerCanvas(): void {
    const canvasSize = CANVAS_SIZE * this.viewport.scale;
    this.viewport.offsetX = (this.canvas.width - canvasSize) / 2;
    this.viewport.offsetY = (this.canvas.height - canvasSize) / 2;
  }

  setSize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.centerCanvas();
  }

  getViewport(): Viewport {
    return { ...this.viewport };
  }

  setScale(scale: number, centerX?: number, centerY?: number): void {
    const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));
    if (centerX !== undefined && centerY !== undefined) {
      const pixelX = (centerX - this.viewport.offsetX) / this.viewport.scale;
      const pixelY = (centerY - this.viewport.offsetY) / this.viewport.scale;
      this.viewport.scale = clampedScale;
      this.viewport.offsetX = centerX - pixelX * this.viewport.scale;
      this.viewport.offsetY = centerY - pixelY * this.viewport.scale;
    } else {
      this.viewport.scale = clampedScale;
      this.centerCanvas();
    }
  }

  setOffset(offsetX: number, offsetY: number): void {
    this.viewport.offsetX = offsetX;
    this.viewport.offsetY = offsetY;
  }

  setPixels(pixels: (string | null)[][]): void {
    this.pixels = pixels.map(row => [...row]);
    this.rebuildPixelCanvas();
  }

  getPixels(): (string | null)[][] {
    return this.pixels.map(row => [...row]);
  }

  drawPixel(x: number, y: number, color: string | null): void {
    if (x < 0 || x >= CANVAS_SIZE || y < 0 || y >= CANVAS_SIZE) return;
    this.pixels[y][x] = color;
    if (color) {
      this.pixelCtx.fillStyle = color;
      this.pixelCtx.fillRect(x, y, 1, 1);
    } else {
      this.pixelCtx.clearRect(x, y, 1, 1);
    }
  }

  floodFill(startX: number, startY: number, fillColor: string): { x: number; y: number }[] {
    if (startX < 0 || startX >= CANVAS_SIZE || startY < 0 || startY >= CANVAS_SIZE) return [];
    
    const targetColor = this.pixels[startY][startX];
    if (targetColor === fillColor) return [];

    const filled: { x: number; y: number }[] = [];
    const stack: [number, number][] = [[startX, startY]];
    const visited = new Set<string>();

    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      const key = `${x},${y}`;
      
      if (visited.has(key)) continue;
      if (x < 0 || x >= CANVAS_SIZE || y < 0 || y >= CANVAS_SIZE) continue;
      if (this.pixels[y][x] !== targetColor) continue;

      visited.add(key);
      filled.push({ x, y, color: fillColor } as any);
      this.pixels[y][x] = fillColor;
      this.pixelCtx.fillStyle = fillColor;
      this.pixelCtx.fillRect(x, y, 1, 1);

      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }

    return filled;
  }

  getPixelColor(x: number, y: number): string | null {
    if (x < 0 || x >= CANVAS_SIZE || y < 0 || y >= CANVAS_SIZE) return null;
    return this.pixels[y][x];
  }

  screenToPixel(screenX: number, screenY: number): { x: number; y: number } {
    const x = Math.floor((screenX - this.viewport.offsetX) / this.viewport.scale);
    const y = Math.floor((screenY - this.viewport.offsetY) / this.viewport.scale);
    return { x, y };
  }

  pixelToScreen(pixelX: number, pixelY: number): { x: number; y: number } {
    return {
      x: pixelX * this.viewport.scale + this.viewport.offsetX,
      y: pixelY * this.viewport.scale + this.viewport.offsetY,
    };
  }

  private rebuildPixelCanvas(): void {
    this.pixelCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    for (let y = 0; y < CANVAS_SIZE; y++) {
      for (let x = 0; x < CANVAS_SIZE; x++) {
        const color = this.pixels[y][x];
        if (color) {
          this.pixelCtx.fillStyle = color;
          this.pixelCtx.fillRect(x, y, 1, 1);
        }
      }
    }
  }

  render(cursors: CursorInfo[] = [], highlight?: HighlightPixel, highlightVisible: boolean = true): void {
    const { ctx, canvas, viewport } = this;
    const { scale, offsetX, offsetY } = viewport;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const canvasPixelSize = CANVAS_SIZE * scale;

    ctx.save();
    ctx.fillStyle = this.bgColor;
    ctx.fillRect(offsetX, offsetY, canvasPixelSize, canvasPixelSize);

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      this.pixelCanvas,
      offsetX,
      offsetY,
      canvasPixelSize,
      canvasPixelSize
    );

    ctx.strokeStyle = this.gridColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= CANVAS_SIZE; i++) {
      const pos = offsetX + i * scale + 0.5;
      ctx.moveTo(pos, offsetY);
      ctx.lineTo(pos, offsetY + canvasPixelSize);
    }
    for (let i = 0; i <= CANVAS_SIZE; i++) {
      const pos = offsetY + i * scale + 0.5;
      ctx.moveTo(offsetX, pos);
      ctx.lineTo(offsetX + canvasPixelSize, pos);
    }
    ctx.stroke();

    ctx.strokeStyle = '#888888';
    ctx.lineWidth = 1;
    ctx.strokeRect(offsetX + 0.5, offsetY + 0.5, canvasPixelSize - 1, canvasPixelSize - 1);

    if (highlight && highlightVisible) {
      const hx = offsetX + highlight.x * scale;
      const hy = offsetY + highlight.y * scale;
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.strokeRect(hx + 1, hy + 1, scale - 2, scale - 2);
    }

    ctx.restore();

    for (const cursor of cursors) {
      this.renderCursor(cursor);
    }
  }

  private renderCursor(cursor: CursorInfo): void {
    const { scale, offsetX, offsetY } = this.viewport;
    const cx = offsetX + cursor.x * scale;
    const cy = offsetY + cursor.y * scale;

    const { ctx } = this;
    ctx.save();

    ctx.strokeStyle = cursor.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(cx + 1, cy + 1, scale - 2, scale - 2);

    ctx.fillStyle = cursor.color;
    ctx.beginPath();
    ctx.arc(cx + scale + 4, cy + scale + 4, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '11px sans-serif';
    ctx.textBaseline = 'top';
    const textWidth = ctx.measureText(cursor.name).width;
    ctx.fillRect(cx + scale + 10, cy + scale - 2, textWidth + 6, 16);
    
    ctx.fillStyle = '#1e1e2e';
    ctx.fillText(cursor.name, cx + scale + 13, cy + scale);

    ctx.restore();
  }

  exportPNG(): string {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = CANVAS_SIZE;
    exportCanvas.height = CANVAS_SIZE;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) throw new Error('Export canvas context not available');

    ctx.drawImage(this.pixelCanvas, 0, 0);

    return exportCanvas.toDataURL('image/png');
  }

  clear(): void {
    this.pixels = Array.from({ length: CANVAS_SIZE }, () =>
      Array(CANVAS_SIZE).fill(null)
    );
    this.rebuildPixelCanvas();
  }
}
