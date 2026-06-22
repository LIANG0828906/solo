import { GraphNode, GraphEdge, LayoutResult } from '../graph/forceLayout';
import { ColorEntry } from '../parser/colorExtractor';

export interface InteractionState {
  hoveredNode: GraphNode | null;
  hoveredEdge: GraphEdge | null;
  selectedNode: GraphNode | null;
  selectedEdge: GraphEdge | null;
  dragNode: GraphNode | null;
  highlightedNodeIds: Set<string>;
  highlightedEdgeKeys: Set<string>;
}

export type InteractionCallback = (state: InteractionState) => void;

interface AnimationState {
  nodeOpacities: Map<string, number>;
  edgeOpacities: Map<string, number>;
  startTime: number;
  initialized: boolean;
}

export class GraphCanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private layout: LayoutResult | null = null;
  private cssText: string = '';
  private interaction: InteractionState = {
    hoveredNode: null,
    hoveredEdge: null,
    selectedNode: null,
    selectedEdge: null,
    dragNode: null,
    highlightedNodeIds: new Set(),
    highlightedEdgeKeys: new Set(),
  };
  private animation: AnimationState = {
    nodeOpacities: new Map(),
    edgeOpacities: new Map(),
    startTime: 0,
    initialized: false,
  };
  private callback: InteractionCallback | null = null;
  private animFrameId: number = 0;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private dragOffset = { x: 0, y: 0 };
  private isDragging = false;
  private entries: ColorEntry[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.resize();
    this.canvas.addEventListener('mousemove', this.onMouseMove);
    this.canvas.addEventListener('mousedown', this.onMouseDown);
    this.canvas.addEventListener('mouseup', this.onMouseUp);
    this.canvas.addEventListener('mouseleave', this.onMouseLeave);
    this.canvas.addEventListener('click', this.onClick);
    this.startRenderLoop();
  }

  setCallback(cb: InteractionCallback) {
    this.callback = cb;
  }

  setLayout(layout: LayoutResult) {
    this.layout = layout;
    this.animation = {
      nodeOpacities: new Map(),
      edgeOpacities: new Map(),
      startTime: performance.now(),
      initialized: true,
    };
    for (const node of layout.nodes) {
      this.animation.nodeOpacities.set(node.id, 0);
    }
    for (let i = 0; i < layout.edges.length; i++) {
      this.animation.edgeOpacities.set(`edge-${i}`, 0);
    }
  }

  setCssText(text: string) {
    this.cssText = text;
  }

  setEntries(entries: ColorEntry[]) {
    this.entries = entries;
  }

  setInteraction(state: Partial<InteractionState>) {
    this.interaction = { ...this.interaction, ...state };
  }

  resize() {
    const rect = this.canvas.parentElement?.getBoundingClientRect();
    if (!rect) return;
    this.dpr = window.devicePixelRatio || 1;
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = rect.width * this.dpr;
    this.canvas.height = rect.height * this.dpr;
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  destroy() {
    cancelAnimationFrame(this.animFrameId);
    this.canvas.removeEventListener('mousemove', this.onMouseMove);
    this.canvas.removeEventListener('mousedown', this.onMouseDown);
    this.canvas.removeEventListener('mouseup', this.onMouseUp);
    this.canvas.removeEventListener('mouseleave', this.onMouseLeave);
    this.canvas.removeEventListener('click', this.onClick);
  }

  private startRenderLoop() {
    const loop = () => {
      this.render();
      this.animFrameId = requestAnimationFrame(loop);
    };
    loop();
  }

  private render() {
    const ctx = this.ctx;
    const now = performance.now();
    ctx.clearRect(0, 0, this.width, this.height);

    if (!this.layout) return;

    const hasHighlight = this.interaction.highlightedNodeIds.size > 0;

    this.updateAnimations(now);

    for (let i = 0; i < this.layout.edges.length; i++) {
      const edge = this.layout.edges[i];
      const src = edge.source as GraphNode;
      const tgt = edge.target as GraphNode;
      if (!src || !tgt) continue;

      const edgeKey = `edge-${i}`;
      const opacity = this.animation.edgeOpacities.get(edgeKey) ?? 1;

      const isHighlighted = this.interaction.highlightedEdgeKeys.has(edgeKey);
      const isHovered = this.interaction.hoveredEdge === edge;
      const isSelected = this.interaction.selectedEdge === edge;

      let strokeColor = 'rgba(180, 180, 180, 0.4)';
      let lineWidth = 1.5;
      let globalAlpha = opacity;

      if (isHovered || isSelected) {
        strokeColor = '#00bfff';
        lineWidth = 2.5;
      } else if (isHighlighted) {
        strokeColor = '#ff8c00';
        lineWidth = 2;
      } else if (hasHighlight) {
        globalAlpha = opacity * 0.3;
      }

      ctx.save();
      ctx.globalAlpha = globalAlpha;
      this.drawEdge(src, tgt, strokeColor, lineWidth, opacity);
      ctx.restore();
    }

    for (const node of this.layout.nodes) {
      const opacity = this.animation.nodeOpacities.get(node.id) ?? 1;
      const isHighlighted = this.interaction.highlightedNodeIds.has(node.id);
      const isHovered = this.interaction.hoveredNode === node;
      const isSelected = this.interaction.selectedNode === node;
      const isDragged = this.interaction.dragNode === node;

      let scale = 1;
      let globalAlpha = opacity;

      if (isHovered || isSelected) {
        scale = 1.2;
      }
      if (isDragged) {
        scale = 1.15;
      }
      if (hasHighlight && !isHighlighted) {
        globalAlpha = opacity * 0.3;
      }

      ctx.save();
      ctx.globalAlpha = globalAlpha;
      this.drawNode(node, scale, isHighlighted);
      ctx.restore();
    }

    if (this.interaction.hoveredNode) {
      this.drawTooltip(this.interaction.hoveredNode);
    }
    if (this.interaction.hoveredEdge) {
      this.drawEdgeTooltip(this.interaction.hoveredEdge);
    }
  }

  private updateAnimations(now: number) {
    if (!this.animation.initialized) return;
    const elapsed = now - this.animation.startTime;

    for (const [id, _] of this.animation.nodeOpacities) {
      const target = 1;
      const progress = Math.min(elapsed / 500, 1);
      this.animation.nodeOpacities.set(id, progress * target);
    }

    for (let i = 0; i < this.layout!.edges.length; i++) {
      const key = `edge-${i}`;
      const progress = Math.min(Math.max((elapsed - 100 * i) / 600, 0), 1);
      this.animation.edgeOpacities.set(key, progress);
    }
  }

  private drawNode(node: GraphNode, scale: number, highlighted: boolean) {
    const ctx = this.ctx;
    const r = node.radius * scale;

    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, Math.PI * 2);

    if (node.type === 'color' && node.color) {
      ctx.fillStyle = node.color;
    } else {
      ctx.fillStyle = highlighted ? '#ff8c00' : '#4a4a6a';
    }
    ctx.fill();

    ctx.strokeStyle = highlighted ? '#ff8c00' : 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (node.type === 'selector') {
      ctx.fillStyle = '#e0e0e0';
      ctx.font = `${Math.max(9, r * 0.45)}px "Outfit", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const text = node.label.length > 12 ? node.label.slice(0, 10) + '…' : node.label;
      ctx.fillText(text, node.x, node.y);
    }
  }

  private drawEdge(src: GraphNode, tgt: GraphNode, color: string, width: number, opacity: number) {
    const ctx = this.ctx;
    const dx = tgt.x - src.x;
    const dy = tgt.y - src.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) return;

    const cx = (src.x + tgt.x) / 2 + (dy * 0.15);
    const cy = (src.y + tgt.y) / 2 - (dx * 0.15);

    ctx.beginPath();
    ctx.moveTo(src.x, src.y);
    ctx.quadraticCurveTo(cx, cy, tgt.x, tgt.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.globalAlpha = opacity;
    ctx.stroke();

    const arrowLen = 8;
    const arrowAngle = Math.atan2(tgt.y - cy, tgt.x - cx);
    const tipX = tgt.x - Math.cos(arrowAngle) * tgt.radius;
    const tipY = tgt.y - Math.sin(arrowAngle) * tgt.radius;

    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(
      tipX - arrowLen * Math.cos(arrowAngle - 0.4),
      tipY - arrowLen * Math.sin(arrowAngle - 0.4)
    );
    ctx.lineTo(
      tipX - arrowLen * Math.cos(arrowAngle + 0.4),
      tipY - arrowLen * Math.sin(arrowAngle + 0.4)
    );
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  private drawTooltip(node: GraphNode) {
    const ctx = this.ctx;
    let text = '';
    if (node.type === 'color') {
      text = `${node.label} (使用 ${node.usageCount} 次)`;
    } else {
      const lineNums = this.entries
        .filter((e) => e.selector === node.label)
        .map((e) => e.lineNum);
      text = `${node.label} (行 ${lineNums.join(', ')})`;
    }

    ctx.font = '12px "Outfit", sans-serif';
    const metrics = ctx.measureText(text);
    const padding = 8;
    const boxW = metrics.width + padding * 2;
    const boxH = 24;
    const tx = node.x - boxW / 2;
    const ty = node.y - node.radius - boxH - 8;

    ctx.fillStyle = 'rgba(20, 20, 40, 0.9)';
    ctx.beginPath();
    ctx.roundRect(tx, ty, boxW, boxH, 4);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#e0e0e0';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, node.x, ty + boxH / 2);
  }

  private drawEdgeTooltip(edge: GraphEdge) {
    const ctx = this.ctx;
    const src = edge.source as GraphNode;
    const tgt = edge.target as GraphNode;
    if (!src || !tgt) return;

    const text = `引用 ${edge.count} 次`;
    const mx = (src.x + tgt.x) / 2;
    const my = (src.y + tgt.y) / 2;

    ctx.font = '11px "Outfit", sans-serif';
    const metrics = ctx.measureText(text);
    const padding = 6;
    const boxW = metrics.width + padding * 2;
    const boxH = 20;

    ctx.fillStyle = 'rgba(0, 80, 160, 0.85)';
    ctx.beginPath();
    ctx.roundRect(mx - boxW / 2, my - boxH / 2, boxW, boxH, 4);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, mx, my);
  }

  private hitTestNode(mx: number, my: number): GraphNode | null {
    if (!this.layout) return null;
    for (let i = this.layout.nodes.length - 1; i >= 0; i--) {
      const node = this.layout.nodes[i];
      const dx = mx - node.x;
      const dy = my - node.y;
      if (dx * dx + dy * dy <= node.radius * node.radius) {
        return node;
      }
    }
    return null;
  }

  private hitTestEdge(mx: number, my: number): GraphEdge | null {
    if (!this.layout) return null;
    const threshold = 8;
    for (const edge of this.layout.edges) {
      const src = edge.source as GraphNode;
      const tgt = edge.target as GraphNode;
      if (!src || !tgt) continue;

      const dist = this.pointToSegmentDist(mx, my, src.x, src.y, tgt.x, tgt.y);
      if (dist < threshold) return edge;
    }
    return null;
  }

  private pointToSegmentDist(
    px: number, py: number,
    x1: number, y1: number,
    x2: number, y2: number
  ): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const cx = x1 + t * dx;
    const cy = y1 + t * dy;
    return Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
  }

  private getMousePos(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  private onMouseMove = (e: MouseEvent) => {
    const pos = this.getMousePos(e);

    if (this.isDragging && this.interaction.dragNode && this.layout) {
      const node = this.interaction.dragNode;
      const layoutNode = this.layout.nodes.find((n) => n.id === node.id);
      if (layoutNode) {
        layoutNode.x = pos.x;
        layoutNode.y = pos.y;
      }
      this.interaction.dragNode = { ...node, x: pos.x, y: pos.y };
      return;
    }

    const hitNode = this.hitTestNode(pos.x, pos.y);
    const hitEdge = hitNode ? null : this.hitTestEdge(pos.x, pos.y);

    this.interaction.hoveredNode = hitNode;
    this.interaction.hoveredEdge = hitEdge;
    this.canvas.style.cursor = hitNode ? 'pointer' : hitEdge ? 'pointer' : 'default';
  };

  private onMouseDown = (e: MouseEvent) => {
    const pos = this.getMousePos(e);
    const hitNode = this.hitTestNode(pos.x, pos.y);
    if (hitNode) {
      this.isDragging = true;
      this.interaction.dragNode = hitNode;
      this.dragOffset = { x: pos.x - hitNode.x, y: pos.y - hitNode.y };
      this.canvas.style.cursor = 'grabbing';
    }
  };

  private onMouseUp = (_e: MouseEvent) => {
    if (this.isDragging) {
      this.isDragging = false;
      this.interaction.dragNode = null;
      this.canvas.style.cursor = 'default';
    }
  };

  private onMouseLeave = () => {
    this.interaction.hoveredNode = null;
    this.interaction.hoveredEdge = null;
    if (this.isDragging) {
      this.isDragging = false;
      this.interaction.dragNode = null;
    }
  };

  private onClick = (e: MouseEvent) => {
    if (this.isDragging) return;
    const pos = this.getMousePos(e);
    const hitNode = this.hitTestNode(pos.x, pos.y);
    const hitEdge = hitNode ? null : this.hitTestEdge(pos.x, pos.y);

    if (hitNode) {
      this.interaction.selectedNode = hitNode;
      this.interaction.selectedEdge = null;
      this.computeHighlightPaths(hitNode);
    } else if (hitEdge) {
      this.interaction.selectedEdge = hitEdge;
      this.interaction.selectedNode = null;
      this.interaction.highlightedNodeIds.clear();
      this.interaction.highlightedEdgeKeys.clear();
    } else {
      this.interaction.selectedNode = null;
      this.interaction.selectedEdge = null;
      this.interaction.highlightedNodeIds.clear();
      this.interaction.highlightedEdgeKeys.clear();
    }

    this.callback?.(this.interaction);
  };

  private computeHighlightPaths(targetNode: GraphNode) {
    const highlightedNodes = new Set<string>();
    const highlightedEdges = new Set<string>();

    highlightedNodes.add(targetNode.id);

    if (!this.layout) return;

    if (targetNode.type === 'color') {
      for (let i = 0; i < this.layout.edges.length; i++) {
        const edge = this.layout.edges[i];
        const tgt = edge.target as GraphNode;
        if (tgt && tgt.id === targetNode.id) {
          const src = edge.source as GraphNode;
          highlightedNodes.add(src.id);
          highlightedEdges.add(`edge-${i}`);

          for (let j = 0; j < this.layout.edges.length; j++) {
            const e2 = this.layout.edges[j];
            const s2 = e2.source as GraphNode;
            if (s2 && s2.id === src.id) {
              const t2 = e2.target as GraphNode;
              if (t2) {
                highlightedNodes.add(t2.id);
                highlightedEdges.add(`edge-${j}`);
              }
            }
          }
        }
      }
    } else {
      for (let i = 0; i < this.layout.edges.length; i++) {
        const edge = this.layout.edges[i];
        const src = edge.source as GraphNode;
        if (src && src.id === targetNode.id) {
          const tgt = edge.target as GraphNode;
          if (tgt) {
            highlightedNodes.add(tgt.id);
            highlightedEdges.add(`edge-${i}`);
          }
        }
      }
    }

    this.interaction.highlightedNodeIds = highlightedNodes;
    this.interaction.highlightedEdgeKeys = highlightedEdges;
  }

  getCssSnippetForEdge(edge: GraphEdge): string {
    const src = edge.source as GraphNode;
    const tgt = edge.target as GraphNode;
    if (!src || !tgt || !this.cssText) return '';

    const lines = this.cssText.split('\n');
    const startLine = Math.max(0, (edge.lineNum ?? 1) - 3);
    const endLine = Math.min(lines.length, (edge.lineNum ?? 1) + 2);

    return lines.slice(startLine, endLine).join('\n');
  }
}
