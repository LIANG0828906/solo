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
  private nodeRadius: number = 5;
  private isoScaleX: number = 1;
  private isoScaleY: number = 0.5;
  private heightScale: number = 15;
  private cellWidth: number = 28;
  private cellHeight: number = 28;
  private offsetX: number = 0;
  private offsetY: number = 0;

  private colorStops: ColorStop[] = [
    { position: -3, r: 10, g: 61, b: 98 },
    { position: 0, r: 130, g: 204, b: 221 },
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

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.calculateLayout();
  }

  private calculateLayout(): void {
    const cols = this.gridEngine.getCols();
    const rows = this.gridEngine.getRows();
    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);

    this.cellWidth = 28;
    this.cellHeight = 28;
    this.heightScale = 15;

    const gridIsoWidth = (cols + rows - 1) * this.cellWidth * this.isoScaleX;
    const gridIsoHeight = (cols + rows - 2) * this.cellHeight * this.isoScaleY;
    const heightMargin = this.heightScale * 6;
    const totalHeight = gridIsoHeight + heightMargin;

    const scaleX = (width * 0.9) / gridIsoWidth;
    const scaleY = (height * 0.85) / totalHeight;
    const scale = Math.min(scaleX, scaleY, 2);

    this.cellWidth *= scale;
    this.cellHeight *= scale;
    this.heightScale *= scale;

    const centerOffsetY = ((cols + rows - 2) / 2) * this.cellHeight * this.isoScaleY;

    this.offsetX = width / 2;
    this.offsetY = height / 2 - centerOffsetY + this.heightScale * 2;
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

    if (pos <= this.colorStops[0].position) {
      return `rgb(${this.colorStops[0].r}, ${this.colorStops[0].g}, ${this.colorStops[0].b})`;
    }

    if (pos >= this.colorStops[this.colorStops.length - 1].position) {
      const last = this.colorStops[this.colorStops.length - 1];
      return `rgb(${last.r}, ${last.g}, ${last.b})`;
    }

    for (let i = 0; i < this.colorStops.length - 1; i++) {
      const stop1 = this.colorStops[i];
      const stop2 = this.colorStops[i + 1];

      if (pos >= stop1.position && pos <= stop2.position) {
        const range = stop2.position - stop1.position;
        const localT = range === 0 ? 0 : (pos - stop1.position) / range;

        const r = Math.round(stop1.r + (stop2.r - stop1.r) * localT);
        const g = Math.round(stop1.g + (stop2.g - stop1.g) * localT);
        const b = Math.round(stop1.b + (stop2.b - stop1.b) * localT);

        return `rgb(${r}, ${g}, ${b})`;
      }
    }

    const last = this.colorStops[this.colorStops.length - 1];
    return `rgb(${last.r}, ${last.g}, ${last.b})`;
  }

  private getAverageColor(heights: number[]): string {
    let rSum = 0, gSum = 0, bSum = 0;
    
    for (const h of heights) {
      const color = this.getColorForHeight(h);
      const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (match) {
        rSum += parseInt(match[1]);
        gSum += parseInt(match[2]);
        bSum += parseInt(match[3]);
      }
    }

    const count = heights.length;
    return `rgb(${Math.round(rSum / count)}, ${Math.round(gSum / count)}, ${Math.round(bSum / count)})`;
  }

  private drawTriangles(): void {
    const nodes = this.gridEngine.getNodes();
    const rows = this.gridEngine.getRows();
    const cols = this.gridEngine.getCols();

    this.ctx.lineWidth = 0.5;
    this.ctx.strokeStyle = 'rgba(130, 204, 221, 0.2)';

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

        const color1 = this.getAverageColor([n1.height, n2.height, n3.height]);
        
        this.ctx.fillStyle = color1;
        this.ctx.beginPath();
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(p2.x, p2.y);
        this.ctx.lineTo(p3.x, p3.y);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        const color2 = this.getAverageColor([n2.height, n4.height, n3.height]);
        
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

    this.ctx.strokeStyle = 'rgba(130, 204, 221, 0.5)';
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
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = node.isDragging ? 10 : 4;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        if (node.isDragging) {
          this.ctx.beginPath();
          this.ctx.arc(pos.x, pos.y, this.nodeRadius + 3, 0, Math.PI * 2);
          this.ctx.strokeStyle = 'rgba(240, 248, 255, 0.7)';
          this.ctx.lineWidth = 2;
          this.ctx.stroke();
        }
      }
    }
  }
}
