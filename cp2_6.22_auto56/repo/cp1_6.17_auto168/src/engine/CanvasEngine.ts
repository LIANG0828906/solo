export type ToolType = 'spray' | 'brush' | 'stencil';
export type StencilType = 'star' | 'heart' | 'arrow';

class CanvasEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private _tool: ToolType = 'brush';
  private _color: string = '#FF0000';
  private _size: number = 10;
  private _stencilType: StencilType = 'star';
  private isDrawing: boolean = false;
  private lastX: number = 0;
  private lastY: number = 0;
  private sprayInterval: number | null = null;
  private bgColor: string = '#F5F5DC';

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.fillBackground();
  }

  get tool() { return this._tool; }
  set tool(t: ToolType) { this._tool = t; }
  get color() { return this._color; }
  set color(c: string) { this._color = c; }
  get size() { return this._size; }
  set size(s: number) { this._size = s; }
  get stencilTypeValue() { return this._stencilType; }
  set stencilTypeValue(s: StencilType) { this._stencilType = s; }

  private fillBackground(): void {
    this.ctx.fillStyle = this.bgColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  startDraw(x: number, y: number): void {
    this.isDrawing = true;
    this.lastX = x;
    this.lastY = y;

    if (this._tool === 'stencil') {
      this.drawStencil(x, y);
      this.isDrawing = false;
    } else if (this._tool === 'spray') {
      this.spray(x, y);
      this.sprayInterval = window.setInterval(() => {
        if (this.isDrawing) {
          this.spray(this.lastX, this.lastY);
        }
      }, 30);
    } else if (this._tool === 'brush') {
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
    }
  }

  draw(x: number, y: number): void {
    if (!this.isDrawing) return;

    if (this._tool === 'brush') {
      this.drawBrush(this.lastX, this.lastY, x, y);
      this.lastX = x;
      this.lastY = y;
    } else if (this._tool === 'spray') {
      this.lastX = x;
      this.lastY = y;
    }
  }

  endDraw(): void {
    this.isDrawing = false;
    if (this.sprayInterval) {
      clearInterval(this.sprayInterval);
      this.sprayInterval = null;
    }
  }

  private drawBrush(fromX: number, fromY: number, toX: number, toY: number): void {
    this.ctx.strokeStyle = this._color;
    this.ctx.lineWidth = this._size;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.globalAlpha = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(fromX, fromY);
    this.ctx.lineTo(toX, toY);
    this.ctx.stroke();
  }

  private spray(x: number, y: number): void {
    const radius = this._size / 2;
    const density = Math.floor(this._size * 2);

    for (let i = 0; i < density; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * Math.random() * radius;
      const px = x + r * Math.cos(angle);
      const py = y + r * Math.sin(angle);

      const distanceRatio = r / radius;
      this.ctx.globalAlpha = (1 - distanceRatio) * 0.15 + Math.random() * 0.05;
      this.ctx.fillStyle = this._color;

      const particleSize = (1 - distanceRatio) * 2 + Math.random() * 1;
      this.ctx.beginPath();
      this.ctx.arc(px, py, particleSize, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1;
  }

  private drawStencil(x: number, y: number): void {
    this.ctx.fillStyle = this._color;
    this.ctx.globalAlpha = 1;
    const s = this._size * 2;

    switch (this._stencilType) {
      case 'star':
        this.drawStar(x, y, 5, s, s * 0.4);
        break;
      case 'heart':
        this.drawHeart(x, y, s);
        break;
      case 'arrow':
        this.drawArrow(x, y, s);
        break;
    }
  }

  private drawStar(cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number): void {
    let rot = -Math.PI / 2;
    const step = Math.PI / spikes;

    this.ctx.beginPath();
    for (let i = 0; i < spikes; i++) {
      let x = cx + Math.cos(rot) * outerRadius;
      let y = cy + Math.sin(rot) * outerRadius;
      this.ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      this.ctx.lineTo(x, y);
      rot += step;
    }
    this.ctx.closePath();
    this.ctx.fill();
  }

  private drawHeart(cx: number, cy: number, size: number): void {
    const s = size;
    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy + s * 0.3);
    this.ctx.bezierCurveTo(cx, cy, cx - s * 0.5, cy - s * 0.2, cx - s * 0.5, cy + s * 0.1);
    this.ctx.bezierCurveTo(cx - s * 0.5, cy + s * 0.4, cx, cy + s * 0.6, cx, cy + s * 0.8);
    this.ctx.bezierCurveTo(cx, cy + s * 0.6, cx + s * 0.5, cy + s * 0.4, cx + s * 0.5, cy + s * 0.1);
    this.ctx.bezierCurveTo(cx + s * 0.5, cy - s * 0.2, cx, cy, cx, cy + s * 0.3);
    this.ctx.closePath();
    this.ctx.fill();
  }

  private drawArrow(cx: number, cy: number, size: number): void {
    const s = size;
    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy - s * 0.6);
    this.ctx.lineTo(cx + s * 0.4, cy);
    this.ctx.lineTo(cx + s * 0.15, cy);
    this.ctx.lineTo(cx + s * 0.15, cy + s * 0.6);
    this.ctx.lineTo(cx - s * 0.15, cy + s * 0.6);
    this.ctx.lineTo(cx - s * 0.15, cy);
    this.ctx.lineTo(cx - s * 0.4, cy);
    this.ctx.closePath();
    this.ctx.fill();
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.fillBackground();
  }

  toDataURL(): string {
    return this.canvas.toDataURL('image/png');
  }
}

export default CanvasEngine;
