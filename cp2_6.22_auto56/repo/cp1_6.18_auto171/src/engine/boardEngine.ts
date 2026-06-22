import type { BoardElement, PathPoint } from '@/data/boardData';

export class BoardEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationFrameId: number = 0;
  private offscreenImages: Map<string, HTMLImageElement> = new Map();

  init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  }

  resize(): void {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    if (!parent) return;
    this.canvas.width = parent.clientWidth;
    this.canvas.height = parent.clientHeight;
    this.render([], null);
  }

  render(elements: BoardElement[], selectedElementId: string | null): void {
    if (!this.canvas || !this.ctx) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawGrid();
    const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);
    for (const element of sorted) {
      switch (element.type) {
        case 'path':
          this.drawPath(element);
          break;
        case 'sticky':
          this.drawSticky(element);
          break;
        case 'image':
          this.drawImageElement(element);
          break;
      }
      if (element.id === selectedElementId) {
        this.drawSelection(element);
      }
    }
  }

  private drawGrid(): void {
    if (!this.canvas || !this.ctx) return;
    const ctx = this.ctx;
    const spacing = 20;
    ctx.strokeStyle = '#E0E0E0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= this.canvas.width; x += spacing) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvas.height);
    }
    for (let y = 0; y <= this.canvas.height; y += spacing) {
      ctx.moveTo(0, y);
      ctx.lineTo(this.canvas.width, y);
    }
    ctx.stroke();
  }

  drawPath(element: BoardElement): void {
    if (!this.ctx) return;
    const points = element.points;
    if (!points || points.length < 2) return;
    const ctx = this.ctx;
    ctx.strokeStyle = element.color ?? '#333333';
    ctx.lineWidth = element.strokeWidth ?? 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 2; i++) {
      const currentPoint = points[i];
      const nextPoint = points[i + 1];
      const midX = (currentPoint.x + nextPoint.x) / 2;
      const midY = (currentPoint.y + nextPoint.y) / 2;
      ctx.quadraticCurveTo(currentPoint.x, currentPoint.y, midX, midY);
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.stroke();
  }

  drawSticky(element: BoardElement): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const radius = 8;
    ctx.beginPath();
    ctx.roundRect(element.x, element.y, element.width, element.height, radius);
    ctx.fillStyle = '#FFF9C4';
    ctx.fill();
    ctx.strokeStyle = '#FBC02D';
    ctx.lineWidth = 1;
    ctx.stroke();
    if (element.text) {
      ctx.fillStyle = '#333333';
      ctx.font = '14px sans-serif';
      const padding = 10;
      const maxWidth = element.width - padding * 2;
      const words = element.text.split('');
      let line = '';
      let yOffset = element.y + padding + 14;
      for (const char of words) {
        const testLine = line + char;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && line.length > 0) {
          ctx.fillText(line, element.x + padding, yOffset);
          line = char;
          yOffset += 18;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, element.x + padding, yOffset);
    }
  }

  drawImageElement(element: BoardElement): void {
    if (!this.ctx || !element.dataUrl) return;
    const ctx = this.ctx;
    const cached = this.offscreenImages.get(element.dataUrl);
    if (cached) {
      ctx.save();
      ctx.globalAlpha = element.opacity;
      ctx.drawImage(cached, element.x, element.y, element.width, element.height);
      ctx.restore();
    } else {
      const img = new Image();
      img.onload = () => {
        this.offscreenImages.set(element.dataUrl!, img);
        ctx.save();
        ctx.globalAlpha = element.opacity;
        ctx.drawImage(img, element.x, element.y, element.width, element.height);
        ctx.restore();
      };
      img.src = element.dataUrl;
    }
  }

  private drawSelection(element: BoardElement): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const padding = 4;
    ctx.strokeStyle = '#1976D2';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.roundRect(
      element.x - padding,
      element.y - padding,
      element.width + padding * 2,
      element.height + padding * 2,
      4
    );
    ctx.stroke();
    ctx.setLineDash([]);
  }

  hitTest(x: number, y: number, elements: BoardElement[]): BoardElement | null {
    const sorted = [...elements].sort((a, b) => b.zIndex - a.zIndex);
    for (const element of sorted) {
      if (element.type === 'path') {
        const sw = element.strokeWidth ?? 3;
        const minX = element.x - sw;
        const minY = element.y - sw;
        const maxX = element.x + element.width + sw;
        const maxY = element.y + element.height + sw;
        if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
          return element;
        }
      } else {
        if (
          x >= element.x &&
          x <= element.x + element.width &&
          y >= element.y &&
          y <= element.y + element.height
        ) {
          return element;
        }
      }
    }
    return null;
  }

  exportToImage(elements: BoardElement[], width: number, height: number): string {
    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const ctx = offscreen.getContext('2d')!;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);
    const originalCtx = this.ctx;
    this.ctx = ctx;
    for (const element of sorted) {
      switch (element.type) {
        case 'path':
          this.drawPath(element);
          break;
        case 'sticky':
          this.drawSticky(element);
          break;
        case 'image':
          this.drawImageElement(element);
          break;
      }
    }
    this.ctx = originalCtx;
    return offscreen.toDataURL('image/png');
  }

  destroy(): void {
    cancelAnimationFrame(this.animationFrameId);
    this.offscreenImages.clear();
    this.canvas = null;
    this.ctx = null;
  }
}
