import type { RootNode, MoisturePoint } from './growthEngine';

export interface RenderOptions {
  showMoisture: boolean;
  backgroundColor: string;
  mainRootColor: string;
  lateralRootColor: string;
  tipColor: string;
  moistureColor: string;
  mainRootLineWidth: number;
  lateralRootLineWidth: number;
  tipRadius: number;
}

const DEFAULT_OPTIONS: RenderOptions = {
  showMoisture: false,
  backgroundColor: '#3E2723',
  mainRootColor: '#6D4C41',
  lateralRootColor: '#81C784',
  tipColor: '#A5D6A7',
  moistureColor: '#64B5F6',
  mainRootLineWidth: 1.5,
  lateralRootLineWidth: 1,
  tipRadius: 2
};

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private options: RenderOptions;
  private mergedNodesCache: { x: number; y: number }[] = [];
  private cacheDirty = true;

  constructor(canvas: HTMLCanvasElement, options: Partial<RenderOptions> = {}) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  setOptions(options: Partial<RenderOptions>): void {
    this.options = { ...this.options, ...options };
    if (options.showMoisture !== undefined) {
      this.cacheDirty = true;
    }
  }

  setSize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.cacheDirty = true;
  }

  private clear(): void {
    this.ctx.fillStyle = this.options.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private drawMoisturePoints(points: MoisturePoint[]): void {
    if (!this.options.showMoisture) return;

    for (const point of points) {
      this.ctx.beginPath();
      this.ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = this.options.moistureColor + Math.floor(point.opacity * 255).toString(16).padStart(2, '0');
      this.ctx.fill();
    }
  }

  private collectMergedNodes(nodes: RootNode[]): void {
    if (!this.cacheDirty) return;

    this.mergedNodesCache = [];
    const collect = (node: RootNode) => {
      if (node.isMerged) {
        if (node.currentLength > 5) {
          const steps = Math.floor(node.currentLength / 10);
          for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const x = node.startX + (node.x - node.startX) * t;
            const y = node.startY + (node.y - node.startY) * t;
            this.mergedNodesCache.push({ x, y });
          }
        }
      }
      for (const child of node.children) {
        collect(child);
      }
    };

    for (const node of nodes) {
      collect(node);
    }

    this.cacheDirty = false;
  }

  private drawMergedNodes(): void {
    if (this.mergedNodesCache.length === 0) return;

    this.ctx.fillStyle = this.options.lateralRootColor + '60';
    for (const point of this.mergedNodesCache) {
      this.ctx.beginPath();
      this.ctx.arc(point.x, point.y, 1, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private drawRootNode(node: RootNode): void {
    if (node.isMerged) {
      for (const child of node.children) {
        this.drawRootNode(child);
      }
      return;
    }

    const color = node.isMain ? this.options.mainRootColor : this.options.lateralRootColor;
    const lineWidth = node.isMain ? this.options.mainRootLineWidth : this.options.lateralRootLineWidth;

    this.ctx.beginPath();
    this.ctx.moveTo(node.startX, node.startY);
    this.ctx.lineTo(node.x, node.y);
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.lineCap = 'round';
    this.ctx.stroke();

    if (node.isTip && node.isGrowing) {
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, this.options.tipRadius, 0, Math.PI * 2);
      this.ctx.fillStyle = this.options.tipColor;
      this.ctx.fill();
    }

    for (const child of node.children) {
      this.drawRootNode(child);
    }
  }

  render(roots: RootNode[], moisturePoints: MoisturePoint[]): void {
    this.clear();
    this.drawMoisturePoints(moisturePoints);
    this.collectMergedNodes(roots);
    this.drawMergedNodes();
    
    for (const root of roots) {
      this.drawRootNode(root);
    }
  }

  markCacheDirty(): void {
    this.cacheDirty = true;
  }

  toDataURL(): string {
    return this.canvas.toDataURL('image/png');
  }
}
