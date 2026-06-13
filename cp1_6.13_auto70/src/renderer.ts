import { GridEngine } from './gridEngine';

interface ColorStop {
  position: number;
  r: number;
  g: number;
  b: number;
}

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gridEngine: GridEngine;
  private nodeRadius: number = 6;
  private isoScaleX: number = 1;
  private isoScaleY: number = 0.5;
  private heightScale: number = 15;
  private cellWidth: number = 30;
  private cellHeight: number = 30;
  private offsetX: number = 0;
  private offsetY: number = 0;

  private colorStops: ColorStop[] = [
    { position: -3, r: 10, g: 61, b: 98 },
    { position: 0, r: 70, g: 130, b: 160 },
    { position: 3, r: 240, g: 248, b: 255 }
  ];

  constructor(canvas: HTMLCanvasElement, gridEngine: GridEngine) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context');
    this.ctx = ctx;
    this.gridEngine = gridEngine;
    this.resize();
  }

  resize(): void {
    const container = this.canvas.parentElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';

    this.ctx.scale(dpr, dpr);
    this.calculateLayout();
  }

  private calculateLayout(): void {
    const cols = this.gridEngine.getCols();
    const rows = this.gridEngine.getRows();
    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);

    this.cellWidth = 28;
    this.cellHeight = 28;

    const maxColRowDiff = (cols - 1) - 0;
    const minColRowDiff = 0 - (rows - 1);
    const gridWidth = (maxColRowDiff - minColRowDiff) * this.cellWidth * this.isoScaleX;

    const maxColRowSum = (cols - 1) + (rows - 1);
    const minColRowSum = 0 + 0;
    const gridHeight = (maxColRowSum - minColRowSum) * this.cellHeight * this.isoScaleY;

    const totalHeight = gridHeight + this.heightScale * 6;

    const scaleX = (width * 0.9) / gridWidth;
    const scaleY = (height * 0.85) / totalHeight;
    const scale = Math.min(scaleX, scaleY, 1.5);

    this.cellWidth *= scale;
    this.cellHeight *= scale;
    this.heightScale *= scale;

    const finalGridHeight = gridHeight * scale;

    this.offsetX = width / 2;

    const centerY = (maxColRowSum + minColRowSum) / 2 * this.cellHeight * this.isoScaleY;
    this.offsetY = height / 2 - centerY + finalGridHeight * 0.1;
  }

  gridToScreen(row: number, col: number, height: number = 0): { x: number; y: number } {
    const x = (col - row) * this.cellWidth * this.isoScaleX + this.offsetX;
    const y = (col + row) * this.cellHeight * this.isoScaleY + this.offsetY - height * this.heightScale;
    return { x, y };
  }

  screenToGrid(screenX: number, screenY: number): { row: number; col: number; distance: number } {
    const x = screenX - this.offsetX;
    const y = screenY - this.offsetY;

    const col = (x / (this.cellWidth * this.isoScaleX) + y / (this.cellHeight * this.isoScaleY)) / 2;
    const row = (y / (this.cellHeight * this.isoScaleY) - x / (this.cellWidth * this.isoScaleX)) / 2;

    const rowRound = Math.round(row);
    const colRound = Math.round(col);

    const distance = Math.sqrt(Math.pow(row - rowRound, 2) + Math.pow(col - colRound, 2));

    return { row: rowRound, col: colRound, distance };
  }

  getNodeRadius(): number {
    return this.nodeRadius;
  }

  render(): void {
    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);

    this.ctx.clearRect(0, 0, width, height);

    this.drawTriangles();
    this.drawGridLines();
    this.drawNodes();
  }

  private getColorForHeight(height: number): string {
    const { min, max } = this.gridEngine.getHeightRange();
    const t = (height - min) / (max - min);
    const clampedT = Math.max(0, Math.min(1, t));

    const pos = min + clampedT * (max - min);

    for (let i = 0; i < this.colorStops.length - 1; i++) {
      const stop1 = this.colorStops[i];
      const stop2 = this.colorStops[i + 1];

      if (pos >= stop1.position && pos <= stop2.position) {
        const range = stop2.position - stop1.position;
        const localT = (pos - stop1.position) / range;

        const r = Math.round(stop1.r + (stop2.r - stop1.r) * localT);
        const g = Math.round(stop1.g + (stop2.g - stop1.g) * localT);
        const b = Math.round(stop1.b + (stop2.b - stop1.b) * localT);

        return `rgb(${r}, ${g}, ${b})`;
      }
    }

    if (pos <= this.colorStops[0].position) {
      return `rgb(${this.colorStops[0].r}, ${this.colorStops[0].g}, ${this.colorStops[0].b})`;
    }

    const last = this.colorStops[this.colorStops.length - 1];
    return `rgb(${last.r}, ${last.g}, ${last.b})`;
  }

  private drawTriangles(): void {
    const nodes = this.gridEngine.getNodes();
    const rows = this.gridEngine.getRows();
    const cols = this.gridEngine.getCols();

    this.ctx.lineWidth = 0.5;
    this.ctx.strokeStyle = 'rgba(130, 204, 221, 0.15)';

    for (let row = 0; row < rows - 1; row++) {
      for (let col = 0; col < cols - 1; col++) {
        const n1 = nodes[row][col];
        const n2 = nodes[row][col + 1];
        const n3 = nodes[row + 1][col];
        const n4 = nodes[row + 1][col + 1];

        const p1 = this.gridToScreen(n1.y, n1.x, n1.height);
        const p2 = this.gridToScreen(n2.y, n2.x, n2.height);
        const p3 = this.gridToScreen(n3.y, n3.x, n3.height);
        const p4 = this.gridToScreen(n4.y, n4.x, n4.height);

        const avgHeight1 = (n1.height + n2.height + n3.height) / 3;
        const color1 = this.getColorForHeight(avgHeight1);
        
        this.ctx.fillStyle = color1;
        this.ctx.beginPath();
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(p2.x, p2.y);
        this.ctx.lineTo(p3.x, p3.y);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        const avgHeight2 = (n2.height + n4.height + n3.height) / 3;
        const color2 = this.getColorForHeight(avgHeight2);
        
        this.ctx.fillStyle = color2;
        this.ctx.beginPath();
        this.ctx.moveTo(p2.x, p2.y);
        this.ctx.lineTo(p4.x, p4.y);
        this.ctx.lineTo(p3.x, p3.y);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
      }
    }
  }

  private drawGridLines(): void {
    const nodes = this.gridEngine.getNodes();
    const rows = this.gridEngine.getRows();
    const cols = this.gridEngine.getCols();

    this.ctx.strokeStyle = 'rgba(130, 204, 221, 0.4)';
    this.ctx.lineWidth = 1;

    for (let row = 0; row < rows; row++) {
      this.ctx.beginPath();
      for (let col = 0; col < cols; col++) {
        const node = nodes[row][col];
        const pos = this.gridToScreen(node.y, node.x, node.height);
        if (col === 0) {
          this.ctx.moveTo(pos.x, pos.y);
        } else {
          this.ctx.lineTo(pos.x, pos.y);
        }
      }
      this.ctx.stroke();
    }

    for (let col = 0; col < cols; col++) {
      this.ctx.beginPath();
      for (let row = 0; row < rows; row++) {
        const node = nodes[row][col];
        const pos = this.gridToScreen(node.y, node.x, node.height);
        if (row === 0) {
          this.ctx.moveTo(pos.x, pos.y);
        } else {
          this.ctx.lineTo(pos.x, pos.y);
        }
      }
      this.ctx.stroke();
    }
  }

  private drawNodes(): void {
    const nodes = this.gridEngine.getNodes();

    for (let row = 0; row < nodes.length; row++) {
      for (let col = 0; col < nodes[row].length; col++) {
        const node = nodes[row][col];
        const pos = this.gridToScreen(node.y, node.x, node.height);
        const color = this.getColorForHeight(node.height);

        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, this.nodeRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = color;
        this.ctx.fill();

        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = node.isDragging ? 12 : 6;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        if (node.isDragging) {
          this.ctx.beginPath();
          this.ctx.arc(pos.x, pos.y, this.nodeRadius + 3, 0, Math.PI * 2);
          this.ctx.strokeStyle = 'rgba(240, 248, 255, 0.6)';
          this.ctx.lineWidth = 2;
          this.ctx.stroke();
        }
      }
    }
  }
}
