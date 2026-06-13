import type { DependencyNode, DependencyEdge } from './parser';

export interface RendererOptions {
  showLabels: boolean;
  canvasWidth: number;
  canvasHeight: number;
}

const DEFAULT_OPTIONS: RendererOptions = {
  showLabels: true,
  canvasWidth: 800,
  canvasHeight: 600,
};

const TYPE_COLORS = {
  local: '#3498db',
  'third-party': '#e74c3c',
  builtin: '#2ecc71',
} as const;

const BG_COLOR_START = '#0f0f23';
const BG_COLOR_END = '#1a1a2e';
const EDGE_CURVE_OFFSET = 30;
const ARROW_SIZE = 8;
const LABEL_FONT = '14px monospace';
const LABEL_Y_OFFSET = 18;
const MAX_LABEL_LEN = 15;

export class Renderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  options: RendererOptions;
  scale = 1;
  offsetX = 0;
  offsetY = 0;
  hoveredNode: DependencyNode | null = null;
  selectedNode: DependencyNode | null = null;
  isDragging = false;
  dragNode: DependencyNode | null = null;
  dragOffsetX = 0;
  dragOffsetY = 0;

  private nodes: DependencyNode[] = [];
  private edges: DependencyEdge[] = [];
  private resizeObserver: ResizeObserver | null = null;
  private animFrameId = 0;

  constructor(canvas: HTMLCanvasElement, options?: Partial<RendererOptions>) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.setupCanvas();
    this.setupResizeObserver();
  }

  private setupCanvas(): void {
    const dpr = window.devicePixelRatio || 1;
    const width = this.options.canvasWidth;
    const height = this.options.canvasHeight;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private setupResizeObserver(): void {
    if (typeof ResizeObserver === 'undefined') return;
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          this.options.canvasWidth = width;
          this.options.canvasHeight = height;
          this.setupCanvas();
          this.render();
        }
      }
    });
    this.resizeObserver.observe(this.canvas.parentElement ?? this.canvas);
  }

  setNodesAndEdges(nodes: DependencyNode[], edges: DependencyEdge[]): void {
    this.nodes = nodes;
    this.edges = edges;
  }

  setShowLabels(show: boolean): void {
    this.options.showLabels = show;
  }

  render(): void {
    const ctx = this.ctx;
    const w = this.options.canvasWidth;
    const h = this.options.canvasHeight;

    this.clearCanvas(w, h);

    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);

    this.drawEdges();
    this.drawNodes();
    if (this.options.showLabels) {
      this.drawLabels();
    }

    ctx.restore();
  }

  private clearCanvas(w: number, h: number): void {
    const ctx = this.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, BG_COLOR_START);
    gradient.addColorStop(1, BG_COLOR_END);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  }

  private drawEdges(): void {
    const ctx = this.ctx;
    for (const edge of this.edges) {
      const source = this.nodes.find((n) => n.id === edge.source);
      const target = this.nodes.find((n) => n.id === edge.target);
      if (!source || !target) continue;

      const color = TYPE_COLORS[edge.type as keyof typeof TYPE_COLORS] ?? '#888888';
      const midX = (source.x + target.x) / 2;
      const midY = (source.y + target.y) / 2;
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const nx = len > 0 ? -dy / len : 0;
      const ny = len > 0 ? dx / len : 0;
      const cpX = midX + nx * EDGE_CURVE_OFFSET;
      const cpY = midY + ny * EDGE_CURVE_OFFSET;

      const targetR = target.size ?? 30;

      const t = 0.95;
      const edgeEndX = (1 - t) * (1 - t) * source.x + 2 * (1 - t) * t * cpX + t * t * target.x;
      const edgeEndY = (1 - t) * (1 - t) * source.y + 2 * (1 - t) * t * cpY + t * t * target.y;
      const dirX = edgeEndX - target.x;
      const dirY = edgeEndY - target.y;
      const dirLen = Math.sqrt(dirX * dirX + dirY * dirY);
      const ux = dirLen > 0 ? dirX / dirLen : 0;
      const uy = dirLen > 0 ? dirY / dirLen : 0;
      const arrowTipX = target.x + ux * targetR;
      const arrowTipY = target.y + uy * targetR;

      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.quadraticCurveTo(cpX, cpY, arrowTipX, arrowTipY);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      const tangentX = 2 * (1 - t) * (cpX - source.x) + 2 * t * (target.x - cpX);
      const tangentY = 2 * (1 - t) * (cpY - source.y) + 2 * t * (target.y - cpY);
      const tangentLen = Math.sqrt(tangentX * tangentX + tangentY * tangentY);
      const tux = tangentLen > 0 ? tangentX / tangentLen : 0;
      const tuy = tangentLen > 0 ? tangentY / tangentLen : 0;

      const perpX = -tuy;
      const perpY = tux;

      ctx.beginPath();
      ctx.moveTo(arrowTipX, arrowTipY);
      ctx.lineTo(
        arrowTipX - tux * ARROW_SIZE + perpX * (ARROW_SIZE / 2),
        arrowTipY - tuy * ARROW_SIZE + perpY * (ARROW_SIZE / 2)
      );
      ctx.lineTo(
        arrowTipX - tux * ARROW_SIZE - perpX * (ARROW_SIZE / 2),
        arrowTipY - tuy * ARROW_SIZE - perpY * (ARROW_SIZE / 2)
      );
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    }
  }

  private drawNodes(): void {
    const ctx = this.ctx;
    for (const node of this.nodes) {
      const color = TYPE_COLORS[node.type as keyof typeof TYPE_COLORS] ?? '#888888';
      const isSelected = this.selectedNode?.id === node.id;
      const isHovered = this.hoveredNode?.id === node.id;
      const radius = node.size ?? 30;
      const drawRadius = isSelected ? radius * 1.2 : radius;

      if (isSelected) {
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, drawRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'transparent';
        ctx.fill();
        ctx.restore();
      }

      const gradient = ctx.createRadialGradient(
        node.x, node.y, 0,
        node.x, node.y, drawRadius
      );
      gradient.addColorStop(0, this.colorWithAlpha(color, 0.6));
      gradient.addColorStop(1, color);

      ctx.beginPath();
      ctx.arc(node.x, node.y, drawRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();

      if (isHovered) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, drawRadius + 4, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  }

  private drawLabels(): void {
    const ctx = this.ctx;
    ctx.font = LABEL_FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (const node of this.nodes) {
      const radius = node.size ?? 30;
      const isSelected = this.selectedNode?.id === node.id;
      const drawRadius = isSelected ? radius * 1.2 : radius;
      const labelY = node.y + drawRadius + LABEL_Y_OFFSET;

      let label = node.label ?? node.id;
      if (label.length > MAX_LABEL_LEN) {
        label = label.slice(0, MAX_LABEL_LEN) + '...';
      }

      const metrics = ctx.measureText(label);
      const textW = metrics.width;
      const padX = 6;
      const padY = 3;
      const bgX = node.x - textW / 2 - padX;
      const bgY = labelY - padY;
      const bgW = textW + padX * 2;
      const bgH = 14 + padY * 2;

      ctx.fillStyle = 'rgba(15,15,35,0.7)';
      this.drawRoundRect(bgX, bgY, bgW, bgH, 4);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, node.x, labelY);
    }
  }

  private drawRoundRect(x: number, y: number, w: number, h: number, r: number): void {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  private colorWithAlpha(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  private screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: (screenX - this.offsetX) / this.scale,
      y: (screenY - this.offsetY) / this.scale,
    };
  }

  getNodeAtPosition(x: number, y: number): DependencyNode | null {
    const world = this.screenToWorld(x, y);
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const node = this.nodes[i];
      const radius = node.size ?? 30;
      const dx = world.x - node.x;
      const dy = world.y - node.y;
      if (dx * dx + dy * dy <= radius * radius) {
        return node;
      }
    }
    return null;
  }

  zoom(delta: number, mouseX: number, mouseY: number): void {
    const prevScale = this.scale;
    const zoomFactor = delta > 0 ? 0.9 : 1.1;
    this.scale = Math.min(Math.max(this.scale * zoomFactor, 0.1), 10);

    this.offsetX = mouseX - (mouseX - this.offsetX) * (this.scale / prevScale);
    this.offsetY = mouseY - (mouseY - this.offsetY) * (this.scale / prevScale);
  }

  pan(dx: number, dy: number): void {
    this.offsetX += dx;
    this.offsetY += dy;
  }

  startDrag(node: DependencyNode, x: number, y: number): void {
    this.isDragging = true;
    this.dragNode = node;
    const world = this.screenToWorld(x, y);
    this.dragOffsetX = world.x - node.x;
    this.dragOffsetY = world.y - node.y;
  }

  updateDrag(x: number, y: number): void {
    if (!this.isDragging || !this.dragNode) return;
    const world = this.screenToWorld(x, y);
    this.dragNode.x = world.x - this.dragOffsetX;
    this.dragNode.y = world.y - this.dragOffsetY;
  }

  endDrag(): void {
    this.isDragging = false;
    this.dragNode = null;
  }

  selectNode(node: DependencyNode | null): void {
    this.selectedNode = node;
  }

  destroy(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    cancelAnimationFrame(this.animFrameId);
  }
}
