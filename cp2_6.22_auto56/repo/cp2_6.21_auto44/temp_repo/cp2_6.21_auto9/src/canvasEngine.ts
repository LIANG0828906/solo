export class CanvasEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gridSize: number;
  private pixelSize: number;
  private pixels: (string | null)[][];
  private scale: number = 1;
  private minScale: number = 0.5;
  private maxScale: number = 4;
  private translate: { x: number; y: number } = { x: 0, y: 0 };

  constructor(canvas: HTMLCanvasElement, gridSize: number, pixelSize: number) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    this.gridSize = gridSize;
    this.pixelSize = pixelSize;
    this.pixels = Array.from({ length: gridSize }, () =>
      Array.from({ length: gridSize }, () => null)
    );
    this.resizeCanvas();
  }

  private resizeCanvas(): void {
    const totalSize = this.gridSize * this.pixelSize;
    this.canvas.width = totalSize;
    this.canvas.height = totalSize;
  }

  getScale(): number {
    return this.scale;
  }

  setScale(scale: number, centerX?: number, centerY?: number): void {
    const newScale = Math.max(this.minScale, Math.min(this.maxScale, scale));
    if (newScale === this.scale) return;

    if (centerX !== undefined && centerY !== undefined) {
      const rect = this.canvas.getBoundingClientRect();
      const originX = rect.width / 2;
      const originY = rect.height / 2;
      const relX = centerX - rect.left - originX;
      const relY = centerY - rect.top - originY;
      const scaleRatio = newScale / this.scale;
      this.translate.x = relX - relX * scaleRatio + this.translate.x;
      this.translate.y = relY - relY * scaleRatio + this.translate.y;
    }

    this.scale = newScale;
    this.applyTransform();
  }

  zoom(delta: number, centerX: number, centerY: number): void {
    const zoomFactor = delta > 0 ? 0.9 : 1.1;
    const newScale = this.scale * zoomFactor;
    this.setScale(newScale, centerX, centerY);
  }

  getTranslate(): { x: number; y: number } {
    return { ...this.translate };
  }

  setTranslate(x: number, y: number): void {
    this.translate = { x, y };
    this.applyTransform();
  }

  translateBy(dx: number, dy: number): void {
    this.translate.x += dx;
    this.translate.y += dy;
    this.applyTransform();
  }

  resetView(): void {
    this.scale = 1;
    this.translate = { x: 0, y: 0 };
    this.applyTransform();
  }

  private applyTransform(): void {
    this.canvas.style.transform = `translate(${this.translate.x}px, ${this.translate.y}px) scale(${this.scale})`;
    this.canvas.style.transformOrigin = 'center center';
  }

  drawGrid(): void {
    const { ctx, gridSize, pixelSize } = this;
    const totalSize = gridSize * pixelSize;

    ctx.clearRect(0, 0, totalSize, totalSize);

    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const color = this.pixels[y][x];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        }
      }
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.125)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= gridSize; i++) {
      const pos = i * pixelSize + 0.5;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, totalSize);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(totalSize, pos);
      ctx.stroke();
    }
  }

  fillPixel(gridX: number, gridY: number, color: string): void {
    if (gridX < 0 || gridX >= this.gridSize || gridY < 0 || gridY >= this.gridSize) {
      return;
    }
    this.pixels[gridY][gridX] = color;
  }

  clearPixel(gridX: number, gridY: number): void {
    if (gridX < 0 || gridX >= this.gridSize || gridY < 0 || gridY >= this.gridSize) {
      return;
    }
    this.pixels[gridY][gridX] = null;
  }

  clearGrid(): void {
    this.pixels = Array.from({ length: this.gridSize }, () =>
      Array.from({ length: this.gridSize }, () => null)
    );
  }

  getPixelData(): ImageData {
    return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
  }

  getGridSize(): number {
    return this.gridSize;
  }

  getPixelSize(): number {
    return this.pixelSize;
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  screenToGrid(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaledX = (clientX - rect.left) / rect.width * this.canvas.width;
    const scaledY = (clientY - rect.top) / rect.height * this.canvas.height;
    const x = Math.floor(scaledX / this.pixelSize);
    const y = Math.floor(scaledY / this.pixelSize);
    return { x, y };
  }

  putImageData(imageData: ImageData): void {
    this.ctx.putImageData(imageData, 0, 0);
  }
}
