import type {
  LayoutNode,
  LayoutRelation,
  Collaborator,
  ToolMode,
  MarkingRect,
} from '../types';

const NODE_WIDTH = 80;
const NODE_HEIGHT = 80;
const NODE_RADIUS = 10;
const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const COLORS = {
  primary: '#f5e6d3',
  secondary: '#8b5e3c',
  accent: '#c0392b',
  text: '#4a3728',
  nodeBg: '#faf4ec',
  nodeBorder: '#8b5e3c',
  connector: '#8b5e3c',
  marriageDash: [8, 6],
};

export interface CanvasEngineOptions {
  readonly?: boolean;
  onNodeClick?: (nodeId: string) => void;
  onNodeDoubleClick?: (nodeId: string) => void;
  onNodeDragStart?: (nodeId: string) => void;
  onNodeDragEnd?: (nodeId: string, deltaX: number, deltaY: number) => void;
  onCollapsedBoxClick?: (nodeId: string) => void;
  onConnectStart?: (fromNodeId: string, screenX: number, screenY: number) => void;
  onConnectEnd?: (toNodeId: string | null, screenX: number, screenY: number) => void;
  onMarkRect?: (rect: MarkingRect) => void;
  onCanvasMouseMove?: (worldX: number, worldY: number, screenX: number, screenY: number) => void;
  onScaleChange?: (scale: number) => void;
  onPanChange?: (x: number, y: number) => void;
  onBackgroundClick?: () => void;
}

interface RenderNode extends LayoutNode {
  renderX: number;
  renderY: number;
}

export class CanvasEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private options: CanvasEngineOptions;
  private dpr = 1;
  private width = 0;
  private height = 0;

  private scale = 1;
  private offsetX = 0;
  private offsetY = 0;

  private layoutNodes: RenderNode[] = [];
  private layoutRelations: LayoutRelation[] = [];
  private collaborators: Collaborator[] = [];

  private mode: ToolMode = 'select';
  private selectedNodeId: string | null = null;
  private hoveredNodeId: string | null = null;
  private hoveredRelationId: string | null = null;

  private isPanning = false;
  private panStartX = 0;
  private panStartY = 0;
  private panStartOffsetX = 0;
  private panStartOffsetY = 0;

  private isDraggingNode = false;
  private dragNodeId: string | null = null;
  private dragStartWorldX = 0;
  private dragStartWorldY = 0;
  private dragStartNodeX = 0;
  private dragStartNodeY = 0;

  private connectFromId: string | null = null;
  private connectTempX = 0;
  private connectTempY = 0;

  private isMarking = false;
  private markStartSX = 0;
  private markStartSY = 0;
  private markRect: MarkingRect | null = null;

  private animationFrame = 0;
  private dirty = true;
  private pulseTime = 0;
  private imageCache = new Map<string, HTMLCanvasElement>();
  private nodeRenderCache = new Map<string, { canvas: HTMLCanvasElement; signature: string }>();
  private lastMouseMove = 0;
  private _frameCounter = 0;
  private _fpsSmoothed = 60;

  private onMouseMoveBound = this.handleMouseMove.bind(this);
  private onMouseDownBound = this.handleMouseDown.bind(this);
  private onMouseUpBound = this.handleMouseUp.bind(this);
  private onWheelBound = this.handleWheel.bind(this);
  private onDblClickBound = this.handleDblClick.bind(this);
  private onContextMenuBound = (e: Event) => e.preventDefault();
  private onResizeBound = this.handleResize.bind(this);
  private onTouchStartBound = this.handleTouchStart.bind(this);
  private onTouchMoveBound = this.handleTouchMove.bind(this);
  private onTouchEndBound = this.handleTouchEnd.bind(this);

  constructor(canvas: HTMLCanvasElement, options: CanvasEngineOptions = {}) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    this.ctx = ctx;
    this.options = options;
    this.attachListeners();
    this.resize();
    this.loop();
  }

  private attachListeners(): void {
    this.canvas.addEventListener('mousemove', this.onMouseMoveBound);
    this.canvas.addEventListener('mousedown', this.onMouseDownBound);
    window.addEventListener('mouseup', this.onMouseUpBound);
    this.canvas.addEventListener('wheel', this.onWheelBound, { passive: false });
    this.canvas.addEventListener('dblclick', this.onDblClickBound);
    this.canvas.addEventListener('contextmenu', this.onContextMenuBound);
    window.addEventListener('resize', this.onResizeBound);
    this.canvas.addEventListener('touchstart', this.onTouchStartBound, { passive: false });
    this.canvas.addEventListener('touchmove', this.onTouchMoveBound, { passive: false });
    this.canvas.addEventListener('touchend', this.onTouchEndBound);
  }

  destroy(): void {
    cancelAnimationFrame(this.animationFrame);
    this.canvas.removeEventListener('mousemove', this.onMouseMoveBound);
    this.canvas.removeEventListener('mousedown', this.onMouseDownBound);
    window.removeEventListener('mouseup', this.onMouseUpBound);
    this.canvas.removeEventListener('wheel', this.onWheelBound);
    this.canvas.removeEventListener('dblclick', this.onDblClickBound);
    this.canvas.removeEventListener('contextmenu', this.onContextMenuBound);
    window.removeEventListener('resize', this.onResizeBound);
    this.canvas.removeEventListener('touchstart', this.onTouchStartBound);
    this.canvas.removeEventListener('touchmove', this.onTouchMoveBound);
    this.canvas.removeEventListener('touchend', this.onTouchEndBound);
    this.imageCache.clear();
    this.nodeRenderCache.clear();
  }

  setOptions(options: Partial<CanvasEngineOptions>): void {
    this.options = { ...this.options, ...options };
  }

  setMode(mode: ToolMode): void {
    this.mode = mode;
    this.dirty = true;
    this.canvas.classList.toggle('connect-mode', mode === 'connect');
    this.canvas.classList.toggle('mark-mode', mode === 'mark');
  }

  setSelectedNode(id: string | null): void {
    this.selectedNodeId = id;
    this.dirty = true;
  }

  setLayout(nodes: LayoutNode[], relations: LayoutRelation[]): void {
    const existing = new Map(this.layoutNodes.map((n) => [n.id, n]));
    this.layoutNodes = nodes.map((n) => {
      const prev = existing.get(n.id);
      return {
        ...n,
        renderX: prev?.renderX ?? n.x,
        renderY: prev?.renderY ?? n.y,
        targetX: n.x,
        targetY: n.y,
      };
    });
    this.layoutRelations = relations;
    this.dirty = true;
  }

  setCollaborators(list: Collaborator[]): void {
    this.collaborators = list;
    this.dirty = true;
  }

  setConnecting(fromId: string | null, tempX?: number, tempY?: number): void {
    this.connectFromId = fromId;
    if (tempX !== undefined && tempY !== undefined) {
      this.connectTempX = tempX;
      this.connectTempY = tempY;
    }
    this.dirty = true;
  }

  requestLayout(): void {
    this.dirty = true;
  }

  layout(): { nodes: LayoutNode[]; relations: LayoutRelation[] } {
    return {
      nodes: this.layoutNodes,
      relations: this.layoutRelations,
    };
  }

  centerOnContent(): void {
    if (this.layoutNodes.length === 0) {
      this.offsetX = 0;
      this.offsetY = 0;
      this.scale = 1;
      this.options.onPanChange?.(0, 0);
      this.options.onScaleChange?.(1);
      this.dirty = true;
      return;
    }
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    this.layoutNodes.forEach((n) => {
      if (!n.isVisible) return;
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + n.width);
      maxY = Math.max(maxY, n.y + n.height);
    });
    const padding = 80;
    const contentW = maxX - minX + padding * 2;
    const contentH = maxY - minY + padding * 2;
    const scaleX = this.width / contentW;
    const scaleY = this.height / contentH;
    this.scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, Math.min(scaleX, scaleY, 1)));
    this.offsetX =
      this.width / 2 - ((minX + maxX) / 2) * this.scale;
    this.offsetY =
      this.height / 2 - ((minY + maxY) / 2) * this.scale;
    this.options.onPanChange?.(this.offsetX, this.offsetY);
    this.options.onScaleChange?.(this.scale);
    this.dirty = true;
  }

  setScale(s: number): void {
    const prev = this.scale;
    this.scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, s));
    if (this.scale !== prev) {
      this.options.onScaleChange?.(this.scale);
      this.dirty = true;
    }
  }

  setPan(x: number, y: number): void {
    this.offsetX = x;
    this.offsetY = y;
    this.options.onPanChange?.(x, y);
    this.dirty = true;
  }

  getScale(): number {
    return this.scale;
  }
  getPan(): { x: number; y: number } {
    return { x: this.offsetX, y: this.offsetY };
  }

  private resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.dpr = window.devicePixelRatio || 1;
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = Math.floor(rect.width * this.dpr);
    this.canvas.height = Math.floor(rect.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.dirty = true;
  }

  private handleResize(): void {
    this.resize();
  }

  private screenToWorld(sx: number, sy: number): { x: number; y: number } {
    return {
      x: (sx - this.offsetX) / this.scale,
      y: (sy - this.offsetY) / this.scale,
    };
  }

  private worldToScreen(wx: number, wy: number): { x: number; y: number } {
    return {
      x: wx * this.scale + this.offsetX,
      y: wy * this.scale + this.offsetY,
    };
  }

  private hitNode(sx: number, sy: number): LayoutNode | null {
    const { x, y } = this.screenToWorld(sx, sy);
    for (let i = this.layoutNodes.length - 1; i >= 0; i--) {
      const n = this.layoutNodes[i];
      if (!n.isVisible) continue;
      if (x >= n.x && x <= n.x + n.width && y >= n.y && y <= n.y + n.height) {
        return n;
      }
    }
    return null;
  }

  private hitCollapsedBox(sx: number, sy: number): string | null {
    const { x, y } = this.screenToWorld(sx, sy);
    for (let i = this.layoutNodes.length - 1; i >= 0; i--) {
      const n = this.layoutNodes[i];
      if (!n.isCollapsed || !n.collapsedDescendantCount || !n.isVisible) continue;
      let bx: number;
      let by: number;
      let bw: number;
      let bh: number;
      if (
        typeof n.collapsedBoxX === 'number' &&
        typeof n.collapsedBoxY === 'number' &&
        typeof n.collapsedBoxW === 'number' &&
        typeof n.collapsedBoxH === 'number'
      ) {
        bx = n.collapsedBoxX;
        by = n.collapsedBoxY;
        bw = n.collapsedBoxW;
        bh = n.collapsedBoxH;
      } else {
        bx = n.x + n.width + 12;
        by = n.y + n.height / 2 - 18;
        bw = 96;
        bh = 36;
      }
      if (x >= bx && x <= bx + bw && y >= by && y <= by + bh) {
        return n.id;
      }
    }
    return null;
  }

  private hitRelation(sx: number, sy: number): LayoutRelation | null {
    const { x, y } = this.screenToWorld(sx, sy);
    const threshold = 6 / this.scale;
    for (const r of this.layoutRelations) {
      const cx = (r.fromX + r.toX) / 2;
      const cy = (r.fromY + r.toY) / 2;
      const cp1x = r.fromX;
      const cp1y = cy;
      const cp2x = r.toX;
      const cp2y = cy;
      for (let t = 0; t <= 1; t += 0.05) {
        const px =
          (1 - t) ** 3 * r.fromX +
          3 * (1 - t) ** 2 * t * cp1x +
          3 * (1 - t) * t ** 2 * cp2x +
          t ** 3 * r.toX;
        const py =
          (1 - t) ** 3 * r.fromY +
          3 * (1 - t) ** 2 * t * cp1y +
          3 * (1 - t) * t ** 2 * cp2y +
          t ** 3 * r.toY;
        const dx = px - x;
        const dy = py - y;
        if (dx * dx + dy * dy < threshold * threshold) return r;
      }
    }
    return null;
  }

  private handleMouseDown(e: MouseEvent): void {
    if (this.options.readonly) return;
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    if (this.mode === 'mark') {
      this.isMarking = true;
      this.markStartSX = sx;
      this.markStartSY = sy;
      this.markRect = { x: sx, y: sy, w: 0, h: 0 };
      this.dirty = true;
      return;
    }

    if (e.button === 1 || e.button === 2 || this.mode === 'pan' || e.shiftKey) {
      this.isPanning = true;
      this.panStartX = e.clientX;
      this.panStartY = e.clientY;
      this.panStartOffsetX = this.offsetX;
      this.panStartOffsetY = this.offsetY;
      return;
    }

    if (this.mode === 'connect') {
      const node = this.hitNode(sx, sy);
      if (node) {
        this.connectFromId = node.id;
        const world = this.screenToWorld(sx, sy);
        this.connectTempX = world.x;
        this.connectTempY = world.y;
        this.options.onConnectStart?.(node.id, sx, sy);
        this.dirty = true;
      }
      return;
    }

    const collapsedBoxId = this.hitCollapsedBox(sx, sy);
    if (collapsedBoxId) {
      this.options.onCollapsedBoxClick?.(collapsedBoxId);
      return;
    }

    const node = this.hitNode(sx, sy);
    if (node) {
      this.isDraggingNode = true;
      this.dragNodeId = node.id;
      const world = this.screenToWorld(sx, sy);
      this.dragStartWorldX = world.x;
      this.dragStartWorldY = world.y;
      this.dragStartNodeX = node.x;
      this.dragStartNodeY = node.y;
      this.selectedNodeId = node.id;
      this.options.onNodeClick?.(node.id);
      this.options.onNodeDragStart?.(node.id);
      this.dirty = true;
    } else {
      this.isPanning = true;
      this.panStartX = e.clientX;
      this.panStartY = e.clientY;
      this.panStartOffsetX = this.offsetX;
      this.panStartOffsetY = this.offsetY;
      this.selectedNodeId = null;
      this.options.onBackgroundClick?.();
      this.dirty = true;
    }
  }

  private handleMouseMove(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const world = this.screenToWorld(sx, sy);

    if (this.options.onCanvasMouseMove && performance.now() - this.lastMouseMove > 33) {
      this.lastMouseMove = performance.now();
      this.options.onCanvasMouseMove(world.x, world.y, sx, sy);
    }

    if (this.isMarking && this.markRect) {
      const x = Math.min(this.markStartSX, sx);
      const y = Math.min(this.markStartSY, sy);
      const w = Math.abs(sx - this.markStartSX);
      const h = Math.abs(sy - this.markStartSY);
      this.markRect = { x, y, w, h };
      this.dirty = true;
      return;
    }

    if (this.isPanning) {
      const dx = e.clientX - this.panStartX;
      const dy = e.clientY - this.panStartY;
      this.offsetX = this.panStartOffsetX + dx;
      this.offsetY = this.panStartOffsetY + dy;
      this.options.onPanChange?.(this.offsetX, this.offsetY);
      this.dirty = true;
      return;
    }

    if (this.isDraggingNode && this.dragNodeId) {
      const node = this.layoutNodes.find((n) => n.id === this.dragNodeId);
      if (node) {
        const dx = world.x - this.dragStartWorldX;
        const dy = world.y - this.dragStartWorldY;
        node.renderX = this.dragStartNodeX + dx;
        node.renderY = this.dragStartNodeY + dy;
        node.x = node.renderX;
        node.y = node.renderY;
        node.targetX = node.x;
        node.targetY = node.y;
        this.dirty = true;
      }
      return;
    }

    if (this.connectFromId !== null) {
      this.connectTempX = world.x;
      this.connectTempY = world.y;
      this.dirty = true;
      return;
    }

    const node = this.hitNode(sx, sy);
    const collapsedId = this.hitCollapsedBox(sx, sy);
    const newHover = node ? node.id : collapsedId ? '__collapsed:' + collapsedId : null;
    const rel = this.hitRelation(sx, sy);
    const newRelHover = rel ? rel.id : null;
    if (newHover !== this.hoveredNodeId || newRelHover !== this.hoveredRelationId) {
      this.hoveredNodeId = newHover;
      this.hoveredRelationId = newRelHover;
      this.dirty = true;
    }
  }

  private handleMouseUp(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    if (this.isMarking && this.markRect) {
      if (this.markRect.w > 10 && this.markRect.h > 10) {
        const worldStart = this.screenToWorld(this.markRect.x, this.markRect.y);
        const worldEnd = this.screenToWorld(
          this.markRect.x + this.markRect.w,
          this.markRect.y + this.markRect.h,
        );
        this.options.onMarkRect?.({
          x: Math.min(worldStart.x, worldEnd.x),
          y: Math.min(worldStart.y, worldEnd.y),
          w: Math.abs(worldEnd.x - worldStart.x),
          h: Math.abs(worldEnd.y - worldStart.y),
        });
      }
      this.isMarking = false;
      this.markRect = null;
      this.dirty = true;
      return;
    }

    if (this.isDraggingNode && this.dragNodeId) {
      const node = this.layoutNodes.find((n) => n.id === this.dragNodeId);
      if (node) {
        this.options.onNodeDragEnd?.(
          this.dragNodeId,
          node.x - this.dragStartNodeX,
          node.y - this.dragStartNodeY,
        );
      }
      this.isDraggingNode = false;
      this.dragNodeId = null;
      return;
    }

    if (this.connectFromId !== null) {
      const target = this.hitNode(sx, sy);
      const toId = target && target.id !== this.connectFromId ? target.id : null;
      this.options.onConnectEnd?.(toId, sx, sy);
      this.connectFromId = null;
      this.dirty = true;
      return;
    }

    this.isPanning = false;
  }

  private handleDblClick(e: MouseEvent): void {
    if (this.options.readonly) {
      const rect = this.canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const node = this.hitNode(sx, sy);
      if (node) {
        this.options.onNodeDoubleClick?.(node.id);
      }
      return;
    }
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    const collapsedBoxId = this.hitCollapsedBox(sx, sy);
    if (collapsedBoxId) {
      this.options.onCollapsedBoxClick?.(collapsedBoxId);
      return;
    }

    const node = this.hitNode(sx, sy);
    if (node) {
      this.options.onNodeDoubleClick?.(node.id);
    }
  }

  private handleWheel(e: WheelEvent): void {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const worldBefore = this.screenToWorld(sx, sy);
    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, this.scale * factor));
    if (newScale === this.scale) return;
    this.scale = newScale;
    const worldAfter = this.screenToWorld(sx, sy);
    this.offsetX += (worldAfter.x - worldBefore.x) * this.scale;
    this.offsetY += (worldAfter.y - worldBefore.y) * this.scale;
    this.options.onScaleChange?.(this.scale);
    this.options.onPanChange?.(this.offsetX, this.offsetY);
    this.dirty = true;
  }

  private touchPinchDist = 0;
  private touchStartScale = 1;
  private touchStartOffset = { x: 0, y: 0 };
  private touchLastMid = { x: 0, y: 0 };

  private handleTouchStart(e: TouchEvent): void {
    e.preventDefault();
    if (e.touches.length === 1) {
      const t = e.touches[0];
      const fake = { clientX: t.clientX, clientY: t.clientY, button: 0 } as MouseEvent;
      this.handleMouseDown(fake);
    } else if (e.touches.length === 2) {
      this.isPanning = false;
      this.isDraggingNode = false;
      this.connectFromId = null;
      const [t1, t2] = [e.touches[0], e.touches[1]];
      this.touchPinchDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      this.touchStartScale = this.scale;
      this.touchLastMid = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      };
      this.touchStartOffset = { x: this.offsetX, y: this.offsetY };
    }
  }

  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault();
    if (e.touches.length === 1) {
      const t = e.touches[0];
      const fake = { clientX: t.clientX, clientY: t.clientY } as MouseEvent;
      this.handleMouseMove(fake);
    } else if (e.touches.length === 2) {
      const [t1, t2] = [e.touches[0], e.touches[1]];
      const d = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const mid = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      };
      const rect = this.canvas.getBoundingClientRect();
      const worldBefore = this.screenToWorld(mid.x - rect.left, mid.y - rect.top);
      const newScale = Math.max(
        MIN_SCALE,
        Math.min(MAX_SCALE, this.touchStartScale * (d / this.touchPinchDist)),
      );
      this.scale = newScale;
      const panDx = mid.x - this.touchLastMid.x;
      const panDy = mid.y - this.touchLastMid.y;
      this.offsetX = this.touchStartOffset.x + panDx;
      this.offsetY = this.touchStartOffset.y + panDy;
      const worldAfter = this.screenToWorld(mid.x - rect.left, mid.y - rect.top);
      this.offsetX += (worldAfter.x - worldBefore.x) * this.scale;
      this.offsetY += (worldAfter.y - worldBefore.y) * this.scale;
      this.options.onScaleChange?.(this.scale);
      this.options.onPanChange?.(this.offsetX, this.offsetY);
      this.dirty = true;
    }
  }

  private handleTouchEnd(e: TouchEvent): void {
    if (e.touches.length === 0) {
      const fake = { clientX: 0, clientY: 0 } as MouseEvent;
      this.handleMouseUp(fake);
      this.isPanning = false;
      this.isDraggingNode = false;
    }
  }

  private loop = (): void => {
    this.animationFrame = requestAnimationFrame(this.loop);
    this.pulseTime += 0.05;

    let needRender = this.dirty;
    const lerpFactor = this.isDraggingNode ? 0.45 : 0.18;
    this.layoutNodes.forEach((n) => {
      const tx = n.targetX ?? n.x;
      const ty = n.targetY ?? n.y;
      const dx = tx - n.renderX;
      const dy = ty - n.renderY;
      if (Math.abs(dx) > 0.15 || Math.abs(dy) > 0.15) {
        n.renderX += dx * lerpFactor;
        n.renderY += dy * lerpFactor;
        needRender = true;
      } else if (n.renderX !== tx || n.renderY !== ty) {
        n.renderX = tx;
        n.renderY = ty;
        needRender = true;
      }
    });

    if (needRender) {
      this.render();
      this.dirty = false;
    }
  };

  private render(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);

    this.layoutRelations.forEach((r) => {
      if (
        this.isInViewport(
          Math.min(r.fromX, r.toX) - 40,
          Math.min(r.fromY, r.toY) - 40,
          Math.abs(r.toX - r.fromX) + 80,
          Math.abs(r.toY - r.fromY) + 80,
          40,
        )
      ) {
        this.drawRelation(ctx, r);
      }
    });

    if (this.connectFromId !== null) {
      const from = this.layoutNodes.find((n) => n.id === this.connectFromId);
      if (from) {
        this.drawTempConnection(ctx, from, this.connectTempX, this.connectTempY);
      }
    }

    this.layoutNodes.forEach((n) => {
      if (n.isVisible && this.isInViewport(n.renderX, n.renderY, n.width, n.height, 60)) {
        this.drawNode(ctx, n);
      }
    });

    this.layoutNodes.forEach((n) => {
      if (n.isCollapsed && n.collapsedDescendantCount && n.isVisible) {
        let bx: number;
        let by: number;
        let bw: number;
        let bh: number;
        if (
          typeof n.collapsedBoxX === 'number' &&
          typeof n.collapsedBoxY === 'number' &&
          typeof n.collapsedBoxW === 'number' &&
          typeof n.collapsedBoxH === 'number'
        ) {
          bx = n.collapsedBoxX;
          by = n.collapsedBoxY;
          bw = n.collapsedBoxW;
          bh = n.collapsedBoxH;
        } else {
          bx = n.renderX + n.width + 12;
          by = n.renderY + n.height / 2 - 18;
          bw = 96;
          bh = 36;
        }
        if (this.isInViewport(bx, by, bw, bh, 30)) {
          this.drawCollapsedBox(ctx, n);
        }
      }
    });

    if (this.markRect) {
      const worldStart = this.screenToWorld(this.markRect.x, this.markRect.y);
      const worldEnd = this.screenToWorld(
        this.markRect.x + this.markRect.w,
        this.markRect.y + this.markRect.h,
      );
      ctx.save();
      ctx.strokeStyle = COLORS.accent;
      ctx.fillStyle = 'rgba(192, 57, 43, 0.08)';
      ctx.lineWidth = 2 / this.scale;
      ctx.setLineDash([6 / this.scale, 4 / this.scale]);
      const x = Math.min(worldStart.x, worldEnd.x);
      const y = Math.min(worldStart.y, worldEnd.y);
      const w = Math.abs(worldEnd.x - worldStart.x);
      const h = Math.abs(worldEnd.y - worldStart.y);
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
      ctx.restore();
    }

    this.collaborators.forEach((c) => this.drawCollaboratorCursor(ctx, c));

    ctx.restore();
  }

  private drawRelation(ctx: CanvasRenderingContext2D, r: LayoutRelation): void {
    const isHovered = this.hoveredRelationId === r.id;
    ctx.save();
    ctx.shadowColor = 'rgba(139, 94, 60, 0.3)';
    ctx.shadowBlur = isHovered ? 6 : 3;
    ctx.shadowOffsetY = isHovered ? 2 : 1;
    ctx.strokeStyle = r.type === 'marriage' ? '#b57c3c' : COLORS.connector;
    ctx.lineWidth = isHovered ? 3 : 2;
    if (r.type === 'marriage') {
      ctx.setLineDash(COLORS.marriageDash);
    }
    const cy = (r.fromY + r.toY) / 2;
    ctx.beginPath();
    ctx.moveTo(r.fromX, r.fromY);
    ctx.bezierCurveTo(r.fromX, cy, r.toX, cy, r.toX, r.toY);
    ctx.stroke();
    ctx.restore();

    if (r.label && (isHovered || this.scale > 0.8)) {
      const lx = (r.fromX + r.toX) / 2;
      const ly = cy - 6;
      ctx.save();
      ctx.font = `${12 / this.scale}px Georgia, "Noto Serif SC", serif`;
      ctx.textAlign = 'center';
      const metrics = ctx.measureText(r.label);
      const pad = 6 / this.scale;
      ctx.fillStyle = 'rgba(250, 244, 236, 0.92)';
      ctx.strokeStyle = COLORS.secondary;
      ctx.lineWidth = 1 / this.scale;
      const bw = metrics.width + pad * 2;
      const bh = 20 / this.scale;
      ctx.beginPath();
      ctx.roundRect(lx - bw / 2, ly - bh / 2, bw, bh, 4 / this.scale);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = COLORS.text;
      ctx.fillText(r.label, lx, ly + 4 / this.scale);
      ctx.restore();
    }
  }

  private drawTempConnection(
    ctx: CanvasRenderingContext2D,
    from: RenderNode,
    toX: number,
    toY: number,
  ): void {
    const fx = from.renderX + NODE_WIDTH / 2;
    const fy = from.renderY + NODE_HEIGHT;
    const cy = (fy + toY) / 2;
    ctx.save();
    ctx.strokeStyle = COLORS.accent;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 6]);
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.bezierCurveTo(fx, cy, toX, cy, toX, toY);
    ctx.stroke();
    ctx.restore();
  }

  private drawNode(ctx: CanvasRenderingContext2D, n: RenderNode): void {
    const isSelected = this.selectedNodeId === n.id;
    const isHovered = this.hoveredNodeId === n.id;
    const signature = this.nodeSignature(n);
    const PAD = 28;

    let cached = this.nodeRenderCache.get(n.id);
    if (!cached || cached.signature !== signature) {
      const cw = n.width + PAD * 2;
      const ch = n.height + PAD * 2;
      const off = document.createElement('canvas');
      off.width = cw;
      off.height = ch;
      const octx = off.getContext('2d')!;
      octx.imageSmoothingEnabled = true;

      const x = PAD;
      const y = PAD;
      const w = n.width;
      const h = n.height;

      if (isSelected) {
        const pulse = (Math.sin(this.pulseTime * 2) + 1) / 2;
        octx.shadowColor = COLORS.accent;
        octx.shadowBlur = 12 + pulse * 10;
      } else if (isHovered) {
        octx.shadowColor = 'rgba(139, 94, 60, 0.35)';
        octx.shadowBlur = 8;
        octx.shadowOffsetY = 3;
      } else {
        octx.shadowColor = 'rgba(139, 94, 60, 0.2)';
        octx.shadowBlur = 4;
        octx.shadowOffsetY = 2;
      }

      const genTint = Math.min(0.12, n.generation * 0.03);
      const bgColor = this.tintColor(COLORS.nodeBg, -genTint);
      octx.fillStyle = bgColor;
      octx.strokeStyle = isSelected ? COLORS.accent : COLORS.nodeBorder;
      octx.lineWidth = isSelected ? 3 : 2;
      this.roundRect(octx, x, y, w, h, NODE_RADIUS);
      octx.fill();
      octx.stroke();

      octx.shadowColor = 'transparent';
      octx.shadowBlur = 0;
      octx.shadowOffsetY = 0;

      octx.save();
      this.roundRect(octx, x + 4, y + 4, w - 8, h - 22, 6);
      octx.clip();
      if (n.photoUrl) {
        const img = this.getCachedImage(n);
        if (img) {
          octx.drawImage(img, x + 4, y + 4, w - 8, h - 22);
        } else {
          this.drawPlaceholder(octx, x + 4, y + 4, w - 8, h - 22, n.name);
        }
      } else {
        this.drawPlaceholder(octx, x + 4, y + 4, w - 8, h - 22, n.name);
      }
      octx.restore();

      octx.save();
      octx.fillStyle = COLORS.text;
      octx.font = `bold 13px Georgia, "Noto Serif SC", serif`;
      octx.textAlign = 'center';
      octx.textBaseline = 'middle';
      const label = n.name.length > 6 ? n.name.slice(0, 6) + '…' : n.name;
      octx.fillText(label, x + w / 2, y + h - 11);
      octx.restore();

      cached = { canvas: off, signature };
      this.nodeRenderCache.set(n.id, cached);
    }

    ctx.drawImage(
      cached.canvas,
      Math.round(n.renderX - PAD),
      Math.round(n.renderY - PAD),
    );
  }

  private drawPlaceholder(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    name: string,
  ): void {
    ctx.save();
    const gradient = ctx.createLinearGradient(x, y, x, y + h);
    gradient.addColorStop(0, '#e8d5b8');
    gradient.addColorStop(1, '#d4bb94');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(250, 244, 236, 0.95)';
    ctx.font = `bold ${Math.min(w, h) * 0.5}px Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const initial = name.charAt(0) || '?';
    ctx.fillText(initial, x + w / 2, y + h / 2);
    ctx.restore();
  }

  private getCachedImage(n: LayoutNode): HTMLCanvasElement | null {
    const key = `${n.id}-${n.photoUrl || ''}`;
    if (this.imageCache.has(key)) return this.imageCache.get(key)!;
    if (!n.photoUrl) return null;
    const offscreen = document.createElement('canvas');
    offscreen.width = NODE_WIDTH;
    offscreen.height = NODE_HEIGHT;
    const octx = offscreen.getContext('2d');
    if (!octx) return null;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      octx.save();
      this.roundRect(octx, 0, 0, NODE_WIDTH - 8, NODE_HEIGHT - 22, 6);
      octx.clip();
      if (n.avatarCrop) {
        octx.drawImage(
          img,
          n.avatarCrop.x,
          n.avatarCrop.y,
          n.avatarCrop.w,
          n.avatarCrop.h,
          0,
          0,
          NODE_WIDTH - 8,
          NODE_HEIGHT - 22,
        );
      } else {
        octx.drawImage(img, 0, 0, NODE_WIDTH - 8, NODE_HEIGHT - 22);
      }
      octx.restore();
      this.imageCache.set(key, offscreen);
      this.dirty = true;
    };
    img.src = n.photoUrl;
    return null;
  }

  invalidateImageCache(nodeId?: string): void {
    if (nodeId) {
      for (const k of Array.from(this.imageCache.keys())) {
        if (k.startsWith(`${nodeId}-`)) this.imageCache.delete(k);
      }
      this.nodeRenderCache.delete(nodeId);
    } else {
      this.imageCache.clear();
      this.nodeRenderCache.clear();
    }
    this.dirty = true;
  }

  private nodeSignature(n: RenderNode): string {
    const isSelected = this.selectedNodeId === n.id;
    const isHovered = this.hoveredNodeId === n.id;
    return [
      n.id, n.name, n.photoUrl || '', n.generation,
      isSelected ? '1' : '0', isHovered ? '1' : '0',
      Math.floor(this.pulseTime * 2) % 4,
    ].join('|');
  }

  private isInViewport(
    x: number,
    y: number,
    w: number,
    h: number,
    margin = 60,
  ): boolean {
    const sp = this.worldToScreen(x - margin, y - margin);
    const ep = this.worldToScreen(x + w + margin, y + h + margin);
    return !(ep.x < 0 || ep.y < 0 || sp.x > this.width || sp.y > this.height);
  }

  private drawCollapsedBox(ctx: CanvasRenderingContext2D, n: RenderNode): void {
    let bx: number;
    let by: number;
    let bw: number;
    let bh: number;
    const hasBox =
      typeof n.collapsedBoxX === 'number' &&
      typeof n.collapsedBoxY === 'number' &&
      typeof n.collapsedBoxW === 'number' &&
      typeof n.collapsedBoxH === 'number';
    if (hasBox) {
      bx = n.collapsedBoxX!;
      by = n.collapsedBoxY!;
      bw = n.collapsedBoxW!;
      bh = n.collapsedBoxH!;
    } else {
      bx = n.renderX + n.width + 12;
      by = n.renderY + n.height / 2 - 18;
      bw = 96;
      bh = 36;
    }
    const hovered = this.hoveredNodeId === '__collapsed:' + n.id;
    ctx.save();
    ctx.globalAlpha = hovered ? 0.65 : 0.42;
    ctx.shadowColor = 'rgba(139, 94, 60, 0.3)';
    ctx.shadowBlur = hovered ? 10 : 5;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = hovered ? '#fff6e6' : COLORS.primary;
    ctx.strokeStyle = hovered ? COLORS.accent : COLORS.secondary;
    ctx.lineWidth = hovered ? 2.5 : 1.5;
    ctx.setLineDash([hasBox ? 8 : 6, hasBox ? 6 : 4]);
    this.roundRect(ctx, bx, by, bw, bh, hasBox ? 10 : 8);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.fillStyle = hovered ? COLORS.accent : COLORS.text;
    ctx.font = `bold ${hasBox ? 13 : 12}px Georgia, "Noto Serif SC", serif`;
    ctx.textAlign = hasBox ? 'left' : 'center';
    ctx.textBaseline = 'middle';
    const text = hasBox
      ? `＋ ${n.collapsedDescendantCount} 项已折叠 · 点击展开`
      : `＋ ${n.collapsedDescendantCount}`;
    ctx.fillText(text, hasBox ? bx + 12 : bx + bw / 2, by + bh / 2);
    ctx.restore();
  }

  private drawCollaboratorCursor(ctx: CanvasRenderingContext2D, c: Collaborator): void {
    const x = c.cursorX;
    const y = c.cursorY;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.25)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = c.color;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.fillStyle = c.color;
    ctx.font = `bold ${12 / this.scale}px Georgia, sans-serif`;
    const text = c.username;
    const pad = 6;
    const metrics = ctx.measureText(text);
    const tw = metrics.width + pad * 2;
    const th = 20;
    this.roundRect(ctx, x + 12, y - th / 2, tw, th, 4);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + 12 + pad, y);
    ctx.restore();
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
  ): void {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  private tintColor(hex: string, amount: number): string {
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    const adj = (v: number) =>
      Math.max(0, Math.min(255, Math.round(v + (amount < 0 ? v * amount : (255 - v) * amount))));
    const toHex = (v: number) => v.toString(16).padStart(2, '0');
    return `#${toHex(adj(r))}${toHex(adj(g))}${toHex(adj(b))}`;
  }
}
