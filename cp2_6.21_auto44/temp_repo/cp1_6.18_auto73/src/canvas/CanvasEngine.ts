import type { Card, Relation } from '@/shared/cardTypes';
import { getNodeRadius, getRelationCountForCard } from '@/shared/cardTypes';

interface NodePosition {
  id: string;
  x: number;
  y: number;
  radius: number;
  targetRadius: number;
  scale: number;
  targetScale: number;
  opacity: number;
  targetOpacity: number;
  pulsePhase: number;
}

interface DragState {
  nodeId: string | null;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  isDragging: boolean;
}

interface PanState {
  isPanning: boolean;
  lastX: number;
  lastY: number;
  velocityX: number;
  velocityY: number;
}

interface AnimationLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  progress: number;
  createdAt: number;
}

export class CanvasEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private nodes: Map<string, NodePosition> = new Map();
  private cards: Card[] = [];
  private relations: Relation[] = [];
  private filteredCardIds: Set<string> = new Set();
  private drag: DragState = { nodeId: null, startX: 0, startY: 0, offsetX: 0, offsetY: 0, isDragging: false };
  private pan: PanState = { isPanning: false, lastX: 0, lastY: 0, velocityX: 0, velocityY: 0 };
  private scale = 1;
  private offsetX = 0;
  private offsetY = 0;
  private animFrame: number = 0;
  private animationLines: AnimationLine[] = [];
  private onRelationCreate: ((sourceId: string, targetId: string) => void) | null = null;
  private hoveredNodeId: string | null = null;
  private dpr: number = 1;
  private width = 0;
  private height = 0;
  private isDisposed = false;
  private panInertiaFrame: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2d context');
    this.ctx = ctx;
    this.dpr = window.devicePixelRatio || 1;
    this.setupEvents();
    this.startRenderLoop();
  }

  setOnRelationCreate(cb: (sourceId: string, targetId: string) => void) {
    this.onRelationCreate = cb;
  }

  updateData(cards: Card[], relations: Relation[], filteredCardIds: Set<string>) {
    this.cards = cards;
    this.relations = relations;
    this.filteredCardIds = filteredCardIds;

    const existingIds = new Set(this.nodes.keys());
    const cardIds = new Set(cards.map(c => c.id));

    for (const card of cards) {
      const relCount = getRelationCountForCard(card.id, relations);
      const radius = getNodeRadius(relCount);
      const isFiltered = filteredCardIds.has(card.id);

      if (this.nodes.has(card.id)) {
        const node = this.nodes.get(card.id)!;
        node.targetRadius = radius;
        node.targetOpacity = isFiltered ? 1 : 0.3;
      } else {
        const angle = Math.random() * Math.PI * 2;
        const dist = 100 + Math.random() * 200;
        this.nodes.set(card.id, {
          id: card.id,
          x: this.width / 2 / this.dpr / 2 + Math.cos(angle) * dist,
          y: this.height / 2 / this.dpr / 2 + Math.sin(angle) * dist,
          radius: radius,
          targetRadius: radius,
          scale: 1,
          targetScale: 1,
          opacity: isFiltered ? 1 : 0.3,
          targetOpacity: isFiltered ? 1 : 0.3,
          pulsePhase: Math.random() * Math.PI * 2,
        });
      }
    }

    for (const id of existingIds) {
      if (!cardIds.has(id)) {
        this.nodes.delete(id);
      }
    }
  }

  triggerRelationAnimation(sourceId: string, targetId: string) {
    const source = this.nodes.get(sourceId);
    const target = this.nodes.get(targetId);
    if (!source || !target) return;

    this.animationLines.push({
      x1: source.x,
      y1: source.y,
      x2: target.x,
      y2: target.y,
      progress: 0,
      createdAt: Date.now(),
    });

    source.targetScale = 1.05;
    target.targetScale = 1.05;
    setTimeout(() => {
      if (this.nodes.has(sourceId)) this.nodes.get(sourceId)!.targetScale = 1;
      if (this.nodes.has(targetId)) this.nodes.get(targetId)!.targetScale = 1;
    }, 300);
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.dpr = window.devicePixelRatio || 1;
    this.width = rect.width * this.dpr;
    this.height = rect.height * this.dpr;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx.scale(this.dpr, this.dpr);
  }

  private setupEvents() {
    this.canvas.addEventListener('mousedown', this.onMouseDown);
    this.canvas.addEventListener('mousemove', this.onMouseMove);
    this.canvas.addEventListener('mouseup', this.onMouseUp);
    this.canvas.addEventListener('mouseleave', this.onMouseUp);
    this.canvas.addEventListener('wheel', this.onWheel, { passive: false });
    this.canvas.addEventListener('dblclick', this.onDblClick);
  }

  private screenToWorld(sx: number, sy: number): { x: number; y: number } {
    return {
      x: (sx - this.offsetX) / this.scale,
      y: (sy - this.offsetY) / this.scale,
    };
  }

  private findNodeAt(wx: number, wy: number): string | null {
    for (const [id, node] of this.nodes) {
      const dx = wx - node.x;
      const dy = wy - node.y;
      if (dx * dx + dy * dy <= node.radius * node.radius * node.scale * node.scale) {
        return id;
      }
    }
    return null;
  }

  private onMouseDown = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const { x: wx, y: wy } = this.screenToWorld(sx, sy);
    const nodeId = this.findNodeAt(wx, wy);

    if (nodeId) {
      const node = this.nodes.get(nodeId)!;
      this.drag = {
        nodeId,
        startX: wx,
        startY: wy,
        offsetX: wx - node.x,
        offsetY: wy - node.y,
        isDragging: true,
      };
    } else {
      this.pan = {
        isPanning: true,
        lastX: e.clientX,
        lastY: e.clientY,
        velocityX: 0,
        velocityY: 0,
      };
    }
  };

  private onMouseMove = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const { x: wx, y: wy } = this.screenToWorld(sx, sy);

    if (this.drag.isDragging && this.drag.nodeId) {
      const node = this.nodes.get(this.drag.nodeId);
      if (node) {
        node.x = wx - this.drag.offsetX;
        node.y = wy - this.drag.offsetY;
      }
    } else if (this.pan.isPanning) {
      const dx = e.clientX - this.pan.lastX;
      const dy = e.clientY - this.pan.lastY;
      this.offsetX += dx;
      this.offsetY += dy;
      this.pan.velocityX = dx * 0.9;
      this.pan.velocityY = dy * 0.9;
      this.pan.lastX = e.clientX;
      this.pan.lastY = e.clientY;
    } else {
      const nodeId = this.findNodeAt(wx, wy);
      this.hoveredNodeId = nodeId;
      this.canvas.style.cursor = nodeId ? 'grab' : 'default';
    }
  };

  private onMouseUp = (e: MouseEvent) => {
    if (this.drag.isDragging && this.drag.nodeId) {
      const rect = this.canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const { x: wx, y: wy } = this.screenToWorld(sx, sy);
      const targetId = this.findNodeAt(wx, wy);
      const sourceId = this.drag.nodeId;

      if (targetId && targetId !== sourceId) {
        const exists = this.relations.some(
          r => (r.sourceId === sourceId && r.targetId === targetId) ||
               (r.sourceId === targetId && r.targetId === sourceId)
        );
        if (!exists && this.onRelationCreate) {
          this.onRelationCreate(sourceId, targetId);
        }
      }
    }

    if (this.pan.isPanning) {
      this.pan.isPanning = false;
      this.startPanInertia();
    }

    this.drag = { nodeId: null, startX: 0, startY: 0, offsetX: 0, offsetY: 0, isDragging: false };
  };

  private startPanInertia() {
    cancelAnimationFrame(this.panInertiaFrame);
    const tick = () => {
      if (Math.abs(this.pan.velocityX) < 0.1 && Math.abs(this.pan.velocityY) < 0.1) return;
      this.offsetX += this.pan.velocityX;
      this.offsetY += this.pan.velocityY;
      this.pan.velocityX *= 0.9;
      this.pan.velocityY *= 0.9;
      this.panInertiaFrame = requestAnimationFrame(tick);
    };
    this.panInertiaFrame = requestAnimationFrame(tick);
  }

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.5, Math.min(3, this.scale * delta));
    const ratio = newScale / this.scale;
    this.offsetX = mx - (mx - this.offsetX) * ratio;
    this.offsetY = my - (my - this.offsetY) * ratio;
    this.scale = newScale;
  };

  private onDblClick = (_e: MouseEvent) => {
  };

  private startRenderLoop() {
    const render = () => {
      if (this.isDisposed) return;
      this.render();
      this.animFrame = requestAnimationFrame(render);
    };
    this.animFrame = requestAnimationFrame(render);
  }

  private render() {
    const w = this.width / this.dpr;
    const h = this.height / this.dpr;
    const ctx = this.ctx;

    ctx.save();
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = '#1A1A2E';
    ctx.fillRect(0, 0, w, h);

    this.drawGrid(w, h);

    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);

    this.drawRelations(ctx);
    this.drawAnimationLines(ctx);
    this.drawNodes(ctx);

    ctx.restore();
  }

  private drawGrid(w: number, h: number) {
    const ctx = this.ctx;
    const gridSize = 40 * this.scale;
    const startX = this.offsetX % gridSize;
    const startY = this.offsetY % gridSize;

    ctx.strokeStyle = '#2A2A4422';
    ctx.lineWidth = 1;

    for (let x = startX; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = startY; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }

  private drawRelations(ctx: CanvasRenderingContext2D) {
    for (const relation of this.relations) {
      const source = this.nodes.get(relation.sourceId);
      const target = this.nodes.get(relation.targetId);
      if (!source || !target) continue;

      const sourceOpacity = this.filteredCardIds.has(relation.sourceId) ? source.opacity : 0.1;
      const targetOpacity = this.filteredCardIds.has(relation.targetId) ? target.opacity : 0.1;
      const lineOpacity = Math.min(sourceOpacity, targetOpacity);

      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      ctx.strokeStyle = `rgba(255, 217, 61, ${0.4 * lineOpacity})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  private drawAnimationLines(ctx: CanvasRenderingContext2D) {
    const now = Date.now();
    this.animationLines = this.animationLines.filter(line => {
      const elapsed = now - line.createdAt;
      if (elapsed > 300) return false;

      const progress = elapsed / 300;
      const cx = line.x1 + (line.x2 - line.x1) * progress;
      const cy = line.y1 + (line.y2 - line.y1) * progress;

      ctx.beginPath();
      ctx.moveTo(line.x1, line.y1);
      ctx.lineTo(cx, cy);
      ctx.strokeStyle = '#FFD93D';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#FFD93D';
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      return true;
    });
  }

  private drawNodes(ctx: CanvasRenderingContext2D) {
    for (const [id, node] of this.nodes) {
      node.scale += (node.targetScale - node.scale) * 0.15;
      node.radius += (node.targetRadius - node.radius) * 0.1;
      node.opacity += (node.targetOpacity - node.opacity) * 0.1;

      const card = this.cards.find(c => c.id === id);
      if (!card) continue;

      const r = node.radius * node.scale;
      const isHovered = this.hoveredNodeId === id;

      ctx.save();
      ctx.globalAlpha = node.opacity;

      ctx.shadowColor = '#00000066';
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 4;
      ctx.shadowBlur = 8;

      const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, r);
      gradient.addColorStop(0, '#FF6B6B');
      gradient.addColorStop(1, '#4ECDC4');

      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      if (isHovered) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 2, 0, Math.PI * 2);
        ctx.strokeStyle = '#FFD93D';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      const title = card.title.length > 6 ? card.title.slice(0, 6) + '…' : card.title;
      const fontSize = Math.max(10, Math.min(14, r * 0.4));
      ctx.font = `500 ${fontSize}px "Outfit", sans-serif`;
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(title, node.x, node.y);

      ctx.restore();
    }
  }

  dispose() {
    this.isDisposed = true;
    cancelAnimationFrame(this.animFrame);
    cancelAnimationFrame(this.panInertiaFrame);
    this.canvas.removeEventListener('mousedown', this.onMouseDown);
    this.canvas.removeEventListener('mousemove', this.onMouseMove);
    this.canvas.removeEventListener('mouseup', this.onMouseUp);
    this.canvas.removeEventListener('mouseleave', this.onMouseUp);
    this.canvas.removeEventListener('wheel', this.onWheel);
    this.canvas.removeEventListener('dblclick', this.onDblClick);
  }
}
