export type FlowPointColor = 'purple' | 'cyan' | 'mixed';

export interface FlowConfig {
  spacing: number;
  speed: number;
  color: FlowPointColor;
}

export interface PathNode {
  id: number;
  x: number;
  y: number;
  isBranch: boolean;
  children: { nodeId: number; probability: number }[];
}

export interface PathSegment {
  fromId: number;
  toId: number;
  length: number;
}

export class PathManager {
  private nodes: Map<number, PathNode> = new Map();
  private nextId: number = 1;
  private startNodeId: number | null = null;
  private flowOffset: number = 0;
  private flowConfig: FlowConfig = {
    spacing: 50,
    speed: 80,
    color: 'mixed'
  };

  setFlowConfig(config: Partial<FlowConfig>): void {
    this.flowConfig = { ...this.flowConfig, ...config };
  }

  getFlowConfig(): FlowConfig {
    return { ...this.flowConfig };
  }

  addNode(x: number, y: number, parentId?: number, probability?: number): number {
    const id = this.nextId++;
    const node: PathNode = {
      id,
      x,
      y,
      isBranch: false,
      children: []
    };
    this.nodes.set(id, node);

    if (parentId !== undefined) {
      const parent = this.nodes.get(parentId);
      if (parent) {
        parent.children.push({
          nodeId: id,
          probability: probability ?? 1
        });
        if (parent.children.length > 1) {
          parent.isBranch = true;
        }
      }
    }

    if (this.startNodeId === null) {
      this.startNodeId = id;
    }

    return id;
  }

  removeNode(id: number): void {
    this.nodes.delete(id);
    this.nodes.forEach(node => {
      node.children = node.children.filter(c => c.nodeId !== id);
      if (node.children.length <= 1) {
        node.isBranch = false;
      }
    });
    if (this.startNodeId === id) {
      const firstKey = this.nodes.keys().next().value;
      this.startNodeId = this.nodes.size > 0 && firstKey !== undefined ? firstKey : null;
    }
  }

  getNode(id: number): PathNode | undefined {
    return this.nodes.get(id);
  }

  getAllNodes(): PathNode[] {
    return Array.from(this.nodes.values());
  }

  setNodePosition(id: number, x: number, y: number): void {
    const node = this.nodes.get(id);
    if (node) {
      node.x = x;
      node.y = y;
    }
  }

  getStartNodeId(): number | null {
    return this.startNodeId;
  }

  getNodeChildren(id: number): { nodeId: number; probability: number }[] {
    const node = this.nodes.get(id);
    return node ? node.children : [];
  }

  isBranchNode(id: number): boolean {
    const node = this.nodes.get(id);
    return node ? node.isBranch : false;
  }

  selectBranchChild(id: number): number | null {
    const node = this.nodes.get(id);
    if (!node || node.children.length === 0) return null;
    if (node.children.length === 1) return node.children[0].nodeId;

    const totalProb = node.children.reduce((s, c) => s + c.probability, 0);
    let r = Math.random() * totalProb;
    for (const child of node.children) {
      r -= child.probability;
      if (r <= 0) return child.nodeId;
    }
    return node.children[node.children.length - 1].nodeId;
  }

  clear(): void {
    this.nodes.clear();
    this.startNodeId = null;
    this.nextId = 1;
  }

  getNodeCount(): number {
    return this.nodes.size;
  }

  findNodeAt(x: number, y: number, radius: number = 15): number | null {
    for (const node of this.nodes.values()) {
      const dx = node.x - x;
      const dy = node.y - y;
      if (dx * dx + dy * dy <= radius * radius) {
        return node.id;
      }
    }
    return null;
  }

  getSegments(): PathSegment[] {
    const segments: PathSegment[] = [];
    for (const node of this.nodes.values()) {
      for (const child of node.children) {
        const childNode = this.nodes.get(child.nodeId);
        if (childNode) {
          const dx = childNode.x - node.x;
          const dy = childNode.y - node.y;
          segments.push({
            fromId: node.id,
            toId: child.nodeId,
            length: Math.sqrt(dx * dx + dy * dy)
          });
        }
      }
    }
    return segments;
  }

  getPointOnSegment(fromId: number, toId: number, t: number): { x: number; y: number } {
    const from = this.nodes.get(fromId);
    const to = this.nodes.get(toId);
    if (!from || !to) return { x: 0, y: 0 };
    return {
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t
    };
  }

  getNodeGlowColor(id: number): { fill: string; glow: string } {
    const node = this.nodes.get(id);
    if (!node) {
      return { fill: 'rgba(180, 120, 255, 0.95)', glow: 'rgba(180, 120, 255, 0.9)' };
    }
    if (node.isBranch) {
      return { fill: 'rgba(60, 180, 255, 0.9)', glow: 'rgba(100, 220, 255, 0.9)' };
    }
    return { fill: 'rgba(140, 80, 220, 0.95)', glow: 'rgba(180, 120, 255, 0.9)' };
  }

  updateFlow(deltaTime: number): void {
    const { spacing, speed } = this.flowConfig;
    this.flowOffset = (this.flowOffset + deltaTime * speed) % spacing;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    this.drawSegments(ctx);
    this.drawFlowPoints(ctx);
    this.drawNodes(ctx);
  }

  private drawSegments(ctx: CanvasRenderingContext2D): void {
    const segments = this.getSegments();
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (const seg of segments) {
      const from = this.nodes.get(seg.fromId);
      const to = this.nodes.get(seg.toId);
      if (!from || !to) continue;

      const gradient = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
      gradient.addColorStop(0, 'rgba(140, 80, 220, 0.6)');
      gradient.addColorStop(1, 'rgba(80, 180, 255, 0.6)');

      ctx.strokeStyle = gradient;
      ctx.shadowColor = 'rgba(160, 120, 255, 0.5)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  }

  private drawFlowPoints(ctx: CanvasRenderingContext2D): void {
    const segments = this.getSegments();
    const { spacing, color } = this.flowConfig;

    for (let si = 0; si < segments.length; si++) {
      const seg = segments[si];
      const from = this.nodes.get(seg.fromId);
      const to = this.nodes.get(seg.toId);
      if (!from || !to) continue;

      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < 1) continue;

      let fillRgba: string;
      let glowRgba: string;
      if (color === 'purple') {
        fillRgba = 'rgba(180, 140, 255, ';
        glowRgba = 'rgba(180, 140, 255, ';
      } else if (color === 'cyan') {
        fillRgba = 'rgba(120, 220, 255, ';
        glowRgba = 'rgba(120, 220, 255, ';
      } else {
        fillRgba = si % 2 === 0 ? 'rgba(180, 140, 255, ' : 'rgba(120, 220, 255, ';
        glowRgba = fillRgba;
      }

      const numPoints = Math.ceil(len / spacing);
      for (let i = 0; i <= numPoints; i++) {
        const distFromStart = (i * spacing + this.flowOffset) % (len + spacing) - spacing * 0.5;
        if (distFromStart < 0 || distFromStart > len) continue;
        const t = distFromStart / len;
        const px = from.x + dx * t;
        const py = from.y + dy * t;

        const glow = 0.5 + 0.5 * Math.sin((t + this.flowOffset * 0.01) * Math.PI * 2);
        ctx.beginPath();
        ctx.arc(px, py, 3 + glow, 0, Math.PI * 2);
        ctx.fillStyle = `${fillRgba}${0.7 + glow * 0.3})`;
        ctx.shadowColor = `${glowRgba}0.9)`;
        ctx.shadowBlur = 10 + glow * 6;
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
  }

  private drawNodes(ctx: CanvasRenderingContext2D): void {
    for (const node of this.nodes.values()) {
      const isStart = node.id === this.startNodeId;
      const baseRadius = isStart ? 14 : 11;
      const glowColor = node.isBranch ? 'rgba(100, 220, 255, 0.9)' : 'rgba(180, 120, 255, 0.9)';
      const fillColor = node.isBranch ? 'rgba(60, 180, 255, 0.9)' : 'rgba(140, 80, 220, 0.95)';

      ctx.beginPath();
      ctx.arc(node.x, node.y, baseRadius + 4, 0, Math.PI * 2);
      ctx.fillStyle = glowColor;
      ctx.globalAlpha = 0.25;
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.beginPath();
      ctx.arc(node.x, node.y, baseRadius, 0, Math.PI * 2);
      ctx.fillStyle = fillColor;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;

      if (isStart) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('S', node.x, node.y);
      } else if (node.isBranch) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('B', node.x, node.y);
      }
    }
  }
}
