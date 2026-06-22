import { GraphNode, GraphLink, FACTION_COLORS } from '../types';

export interface RenderOptions {
  width: number;
  height: number;
  scale: number;
  offsetX: number;
  offsetY: number;
}

export class GraphRenderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');
    this.ctx = ctx;
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  clear(): void {
    this.ctx.fillStyle = '#0A0A2E';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  render(
    nodes: GraphNode[],
    links: GraphLink[],
    options: RenderOptions,
    hoveredNodeId: string | null,
    hoveredLinkIndex: number | null,
    focusedNodeId: string | null
  ): void {
    this.clear();
    this.ctx.save();
    this.ctx.translate(options.offsetX, options.offsetY);
    this.ctx.scale(options.scale, options.scale);

    this.renderLinks(links, hoveredLinkIndex);
    this.renderNodes(nodes, hoveredNodeId, focusedNodeId);

    this.ctx.restore();
  }

  private renderLinks(links: GraphLink[], hoveredIndex: number | null): void {
    links.forEach((link, index) => {
      const source = typeof link.source === 'object' ? link.source : null;
      const target = typeof link.target === 'object' ? link.target : null;
      if (!source || !target) return;

      const isHovered = hoveredIndex === index;

      this.ctx.save();
      this.ctx.strokeStyle = isHovered ? '#00CEC9' : '#4A4A6A';
      this.ctx.lineWidth = isHovered ? 3 : 2;

      if (link.relation.style === 'dashed') {
        this.ctx.setLineDash([8, 4]);
      }

      this.ctx.beginPath();
      this.ctx.moveTo(source.x, source.y);

      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const radius = target.radius;
      const endX = target.x - (dx / dist) * (radius + 5);
      const endY = target.y - (dy / dist) * (radius + 5);

      this.ctx.lineTo(endX, endY);
      this.ctx.stroke();

      this.drawArrowhead(source.x, source.y, endX, endY, isHovered ? '#00CEC9' : '#4A4A6A');

      this.ctx.restore();
    });
  }

  private drawArrowhead(x1: number, y1: number, x2: number, y2: number, color: string): void {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const headLen = 10;
    const headAngle = Math.PI / 6;

    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.moveTo(x2, y2);
    this.ctx.lineTo(
      x2 - headLen * Math.cos(angle - headAngle),
      y2 - headLen * Math.sin(angle - headAngle)
    );
    this.ctx.lineTo(
      x2 - headLen * Math.cos(angle + headAngle),
      y2 - headLen * Math.sin(angle + headAngle)
    );
    this.ctx.closePath();
    this.ctx.fill();
  }

  private renderNodes(
    nodes: GraphNode[],
    hoveredId: string | null,
    focusedId: string | null
  ): void {
    nodes.forEach((node) => {
      const isHovered = hoveredId === node.id;
      const isFocused = focusedId === node.id;
      const color = FACTION_COLORS[node.character.faction];

      this.ctx.save();

      if (isFocused) {
        this.ctx.shadowColor = '#00CEC9';
        this.ctx.shadowBlur = 20;
      }

      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.strokeStyle = isHovered ? '#fff' : 'rgba(255,255,255,0.3)';
      this.ctx.lineWidth = isHovered ? 3 : 1;
      this.ctx.stroke();

      this.ctx.shadowBlur = 0;

      this.ctx.fillStyle = '#DFE6E9';
      this.ctx.font = 'bold 12px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';

      const name = node.character.name;
      const maxChars = Math.floor(node.radius / 8);
      const displayName = name.length > maxChars ? name.slice(0, maxChars) + '…' : name;
      this.ctx.fillText(displayName, node.x, node.y);

      this.ctx.restore();
    });
  }

  getNodeAtPosition(
    x: number,
    y: number,
    nodes: GraphNode[],
    options: RenderOptions
  ): GraphNode | null {
    const canvasX = (x - options.offsetX) / options.scale;
    const canvasY = (y - options.offsetY) / options.scale;

    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      const dx = canvasX - node.x;
      const dy = canvasY - node.y;
      if (dx * dx + dy * dy <= node.radius * node.radius) {
        return node;
      }
    }
    return null;
  }

  getLinkAtPosition(
    x: number,
    y: number,
    links: GraphLink[],
    options: RenderOptions,
    threshold: number = 5
  ): number {
    const canvasX = (x - options.offsetX) / options.scale;
    const canvasY = (y - options.offsetY) / options.scale;

    for (let i = links.length - 1; i >= 0; i--) {
      const link = links[i];
      const source = typeof link.source === 'object' ? link.source : null;
      const target = typeof link.target === 'object' ? link.target : null;
      if (!source || !target) continue;

      const dist = this.pointToLineDistance(
        canvasX,
        canvasY,
        source.x,
        source.y,
        target.x,
        target.y
      );
      if (dist < threshold) {
        return i;
      }
    }
    return -1;
  }

  private pointToLineDistance(
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): number {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
