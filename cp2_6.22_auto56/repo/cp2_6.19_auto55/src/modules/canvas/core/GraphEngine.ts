import type { KnowledgeNode, KnowledgeLink, CanvasViewport } from '@/types';
import { NODE_WIDTH, NODE_HEIGHT, LINK_TYPE_COLORS } from '@/types';
import { useNodeStore } from '@/stores/NodeStore';

export interface EngineCallbacks {
  getNodes: () => KnowledgeNode[];
  getLinks: () => KnowledgeLink[];
  getHighlightedPathIds: () => string[];
  onBatchUpdate: (updates: { id: string; x: number; y: number }[]) => void;
}

export interface PendingLinkDrag {
  sourceId: string;
  startX: number;
  startY: number;
  mouseX: number;
  mouseY: number;
}

const IDEAL_DISTANCE = 220;
const REPULSION_STRENGTH = IDEAL_DISTANCE * IDEAL_DISTANCE * 800;
const SPRING_STIFFNESS = 0.012;
const CENTER_GRAVITY = 0.0008;
const DAMPING = 0.82;
const MIN_VELOCITY = 0.05;
const VELOCITY_LIMIT = 12;
const GRID_CELL_SIZE = 250;

function clamp(v: number, min: number, max: number) {
  return v < min ? min : v > max ? max : v;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface SpatialGrid {
  get(nodeId: string): { gx: number; gy: number } | null;
  update(node: KnowledgeNode): void;
  remove(nodeId: string): void;
  queryRange(rect: Rect): KnowledgeNode[];
  getNearby(node: KnowledgeNode, radius: number): KnowledgeNode[];
  rebuild(nodes: KnowledgeNode[]): void;
}

function createSpatialGrid(): SpatialGrid {
  const map = new Map<string, { gx: number; gy: number; node: KnowledgeNode }>();
  const grid = new Map<string, KnowledgeNode[]>();

  const key = (gx: number, gy: number) => `${gx},${gy}`;
  const toGrid = (x: number, y: number) => ({
    gx: Math.floor(x / GRID_CELL_SIZE),
    gy: Math.floor(y / GRID_CELL_SIZE),
  });

  return {
    get(nodeId) {
      return map.get(nodeId) || null;
    },
    update(node) {
      const prev = map.get(node.id);
      const { gx, gy } = toGrid(node.x + NODE_WIDTH / 2, node.y + NODE_HEIGHT / 2);
      if (prev && prev.gx === gx && prev.gy === gy) {
        map.set(node.id, { gx, gy, node });
        return;
      }
      if (prev) {
        const arr = grid.get(key(prev.gx, prev.gy));
        if (arr) {
          const idx = arr.findIndex((n) => n.id === node.id);
          if (idx >= 0) arr.splice(idx, 1);
        }
      }
      map.set(node.id, { gx, gy, node });
      const k = key(gx, gy);
      if (!grid.has(k)) grid.set(k, []);
      grid.get(k)!.push(node);
    },
    remove(nodeId) {
      const prev = map.get(nodeId);
      if (prev) {
        const arr = grid.get(key(prev.gx, prev.gy));
        if (arr) {
          const idx = arr.findIndex((n) => n.id === nodeId);
          if (idx >= 0) arr.splice(idx, 1);
        }
        map.delete(nodeId);
      }
    },
    queryRange(rect) {
      const result: KnowledgeNode[] = [];
      const start = toGrid(rect.x, rect.y);
      const end = toGrid(rect.x + rect.w, rect.y + rect.h);
      for (let gx = start.gx; gx <= end.gx; gx++) {
        for (let gy = start.gy; gy <= end.gy; gy++) {
          const arr = grid.get(key(gx, gy));
          if (arr) result.push(...arr);
        }
      }
      return result;
    },
    getNearby(node, radius) {
      const center = toGrid(node.x + NODE_WIDTH / 2, node.y + NODE_HEIGHT / 2);
      const cellRadius = Math.ceil(radius / GRID_CELL_SIZE);
      const result: KnowledgeNode[] = [];
      for (let gx = center.gx - cellRadius; gx <= center.gx + cellRadius; gx++) {
        for (let gy = center.gy - cellRadius; gy <= center.gy + cellRadius; gy++) {
          const arr = grid.get(key(gx, gy));
          if (arr) {
            for (const n of arr) {
              if (n.id !== node.id) result.push(n);
            }
          }
        }
      }
      return result;
    },
    rebuild(nodes) {
      map.clear();
      grid.clear();
      for (const n of nodes) {
        const { gx, gy } = toGrid(n.x + NODE_WIDTH / 2, n.y + NODE_HEIGHT / 2);
        map.set(n.id, { gx, gy, node: n });
        const k = key(gx, gy);
        if (!grid.has(k)) grid.set(k, []);
        grid.get(k)!.push(n);
      }
    },
  };
}

function rectsIntersect(a: Rect, b: Rect) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export class GraphEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private callbacks: EngineCallbacks;
  private viewport: CanvasViewport = { offsetX: 0, offsetY: 0, scale: 1 };
  private rafId: number | null = null;
  private running = false;
  private forceLayoutEnabled = false;
  private simulating = false;
  private idleFrames = 0;
  private pendingLinkDrag: PendingLinkDrag | null = null;
  private miniMapCanvas: HTMLCanvasElement | null = null;
  private miniMapCtx: CanvasRenderingContext2D | null = null;
  private draggingNodeId: string | null = null;
  private lastFrameTime = 0;
  private edgeIndicatorPhase = 0;
  private hoveredLinkId: string | null = null;
  private hoveredNodeId: string | null = null;
  private gridCache: HTMLCanvasElement | null = null;
  private gridCacheScale: number = 0;

  private fpsAccumulator = 0;
  private fpsFrameCount = 0;
  private currentFps = 60;
  private adaptiveFrameSkip = 0;
  private frameCounter = 0;
  private lastMiniMapRender = 0;
  private lastNodePositions = new Map<string, { x: number; y: number; vx: number; vy: number }>();
  private prevSelectedIds: string[] = [];
  private dirtyRect: Rect | null = null;
  private viewportRect: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private spatialGrid: SpatialGrid = createSpatialGrid();
  private nodeCache = new Map<string, { bitmap: ImageBitmap | null; lastProps: string; building: boolean }>();
  private lastViewport: CanvasViewport = { offsetX: 0, offsetY: 0, scale: 0 };

  constructor(canvas: HTMLCanvasElement, callbacks: EngineCallbacks) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    this.ctx = ctx;
    this.callbacks = callbacks;
  }

  setMiniMap(mini: HTMLCanvasElement | null) {
    this.miniMapCanvas = mini;
    this.miniMapCtx = mini ? mini.getContext('2d') : null;
  }

  getViewport(): CanvasViewport {
    return { ...this.viewport };
  }

  setViewport(vp: CanvasViewport) {
    const old = this.viewport;
    vp.scale = clamp(vp.scale, 0.3, 3);
    this.viewport = vp;
    if (Math.abs(vp.offsetX - old.offsetX) > 2 || Math.abs(vp.offsetY - old.offsetY) > 2 || vp.scale !== old.scale) {
      this.markAllDirty();
    }
  }

  setForceLayoutEnabled(e: boolean) {
    this.forceLayoutEnabled = e;
    if (e) {
      this.simulating = true;
      this.idleFrames = 0;
    }
  }

  isForceLayoutEnabled() {
    return this.forceLayoutEnabled;
  }

  setPendingLinkDrag(p: PendingLinkDrag | null) {
    this.pendingLinkDrag = p;
    this.markAllDirty();
  }

  setDraggingNodeId(id: string | null) {
    this.draggingNodeId = id;
    this.markAllDirty();
  }

  setHoveredLinkId(id: string | null) {
    if (this.hoveredLinkId !== id) {
      this.markAllDirty();
    }
    this.hoveredLinkId = id;
  }

  setHoveredNodeId(id: string | null) {
    if (this.hoveredNodeId !== id) {
      this.markAllDirty();
    }
    this.hoveredNodeId = id;
  }

  notifyDataChange() {
    this.simulating = true;
    this.idleFrames = 0;
    this.markAllDirty();
  }

  private markAllDirty() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.dirtyRect = { x: 0, y: 0, w, h };
  }

  private markNodeDirty(n: KnowledgeNode) {
    const margin = 80;
    const screen = this.worldToScreen(n.x - margin, n.y - margin);
    const screen2 = this.worldToScreen(
      n.x + NODE_WIDTH + margin,
      n.y + NODE_HEIGHT + margin,
    );
    const rect: Rect = {
      x: Math.max(0, screen.x),
      y: Math.max(0, screen.y),
      w: Math.min(this.canvas.clientWidth, screen2.x - screen.x),
      h: Math.min(this.canvas.clientHeight, screen2.y - screen.y),
    };
    if (!this.dirtyRect) {
      this.dirtyRect = rect;
    } else {
      const x = Math.min(this.dirtyRect.x, rect.x);
      const y = Math.min(this.dirtyRect.y, rect.y);
      const x2 = Math.max(this.dirtyRect.x + this.dirtyRect.w, rect.x + rect.w);
      const y2 = Math.max(this.dirtyRect.y + this.dirtyRect.h, rect.y + rect.h);
      this.dirtyRect = { x, y, w: x2 - x, h: y2 - y };
    }
  }

  worldToScreen(wx: number, wy: number) {
    return {
      x: wx * this.viewport.scale + this.viewport.offsetX,
      y: wy * this.viewport.scale + this.viewport.offsetY,
    };
  }

  screenToWorld(sx: number, sy: number) {
    return {
      x: (sx - this.viewport.offsetX) / this.viewport.scale,
      y: (sy - this.viewport.offsetY) / this.viewport.scale,
    };
  }

  resize(w: number, h: number) {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this.miniMapCanvas) {
      const mw = this.miniMapCanvas.clientWidth;
      const mh = this.miniMapCanvas.clientHeight;
      this.miniMapCanvas.width = mw * dpr;
      this.miniMapCanvas.height = mh * dpr;
      if (this.miniMapCtx) this.miniMapCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    this.gridCache = null;
    this.nodeCache.clear();
    this.markAllDirty();
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastFrameTime = performance.now();
    const loop = (t: number) => {
      if (!this.running) return;
      const elapsed = t - this.lastFrameTime;
      const dt = Math.min(elapsed / 16.67, 2.5);
      this.lastFrameTime = t;

      this.fpsAccumulator += elapsed;
      this.fpsFrameCount++;
      if (this.fpsAccumulator >= 1000) {
        this.currentFps = Math.round((this.fpsFrameCount * 1000) / this.fpsAccumulator);
        this.fpsAccumulator = 0;
        this.fpsFrameCount = 0;
        if (this.currentFps < 40) {
          this.adaptiveFrameSkip = Math.min(2, this.adaptiveFrameSkip + 1);
        } else if (this.currentFps > 55 && this.adaptiveFrameSkip > 0) {
          this.adaptiveFrameSkip = Math.max(0, this.adaptiveFrameSkip - 1);
        }
      }

      this.frameCounter++;

      const shouldSimulate = this.simulating && this.frameCounter % (this.adaptiveFrameSkip + 1) === 0;
      if (shouldSimulate) {
        this.step(dt);
      }

      if (this.dirtyRect) {
        this.render();
      }

      if (t - this.lastMiniMapRender > 120) {
        this.lastMiniMapRender = t;
        this.renderMiniMap();
      }

      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  private updateSpatialGrid(nodes: KnowledgeNode[]) {
    const currentIds = new Set(nodes.map((n) => n.id));
    for (const [id] of Array.from(this.nodeCache.entries())) {
      if (!currentIds.has(id)) {
        this.nodeCache.delete(id);
      }
    }
    this.spatialGrid.rebuild(nodes);
  }

  private step(dt: number) {
    this.edgeIndicatorPhase += dt * 0.06;
    const nodes = this.callbacks.getNodes();
    const links = this.callbacks.getLinks();

    if (nodes.length < 2 && this.forceLayoutEnabled) {
      this.simulating = false;
      return;
    }

    this.updateSpatialGrid(nodes);

    const nodesArr = nodes.map((n) => ({ ...n }));
    const nodeById = new Map(nodesArr.map((n) => [n.id, n]));

    const searchRadius = IDEAL_DISTANCE * 3;

    for (let i = 0; i < nodesArr.length; i++) {
      const a = nodesArr[i];
      let fx = 0,
        fy = 0;
      const nearby = this.spatialGrid.getNearby(a, searchRadius);
      for (const b of nearby) {
        if (a.id === b.id) continue;
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        let dist2 = dx * dx + dy * dy;
        if (dist2 < 400) dist2 = 400;
        const dist = Math.sqrt(dist2);
        const f = REPULSION_STRENGTH / dist2;
        fx += (dx / dist) * f;
        fy += (dy / dist) * f;
      }
      if (nearby.length < nodesArr.length - 1) {
        for (const b of nodesArr) {
          if (a.id === b.id) continue;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const cdist2 = dx * dx + dy * dy;
          if (cdist2 < searchRadius * searchRadius) continue;
          let dist2 = cdist2;
          if (dist2 < 400) dist2 = 400;
          const dist = Math.sqrt(dist2);
          const f = REPULSION_STRENGTH / dist2 * 0.5;
          fx += (dx / dist) * f;
          fy += (dy / dist) * f;
        }
      }
      fx += -a.x * CENTER_GRAVITY * 1000;
      fy += -a.y * CENTER_GRAVITY * 1000;
      a.vx += fx * 0.001 * dt;
      a.vy += fy * 0.001 * dt;
    }

    for (const link of links) {
      const a = nodeById.get(link.sourceId);
      const b = nodeById.get(link.targetId);
      if (!a || !b) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
      const diff = dist - IDEAL_DISTANCE;
      const fx = (dx / dist) * diff * SPRING_STIFFNESS;
      const fy = (dy / dist) * diff * SPRING_STIFFNESS;
      a.vx += fx * dt;
      a.vy += fy * dt;
      b.vx -= fx * dt;
      b.vy -= fy * dt;
    }

    let maxV = 0;
    let moved = false;
    const updates: { id: string; x: number; y: number }[] = [];
    for (const n of nodesArr) {
      if (n.id === this.draggingNodeId) {
        n.vx = 0;
        n.vy = 0;
        continue;
      }
      n.vx *= DAMPING;
      n.vy *= DAMPING;
      const vlen = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
      if (vlen > VELOCITY_LIMIT) {
        n.vx = (n.vx / vlen) * VELOCITY_LIMIT;
        n.vy = (n.vy / vlen) * VELOCITY_LIMIT;
      }

      const prev = this.lastNodePositions.get(n.id);
      const nx = n.x + n.vx * dt;
      const ny = n.y + n.vy * dt;

      if (!prev || Math.abs(nx - prev.x) > 0.3 || Math.abs(ny - prev.y) > 0.3) {
        n.x = nx;
        n.y = ny;
        this.lastNodePositions.set(n.id, { x: n.x, y: n.y, vx: n.vx, vy: n.vy });
        updates.push({ id: n.id, x: n.x, y: n.y });
        this.markNodeDirty(n);
        moved = true;
      }

      maxV = Math.max(maxV, Math.abs(n.vx), Math.abs(n.vy));
    }

    if (updates.length > 0) {
      this.callbacks.onBatchUpdate(updates);
      this.spatialGrid.rebuild(this.callbacks.getNodes());
    }

    const selectedIds = useNodeStore.getState().selectedIds;
    if (JSON.stringify(selectedIds) !== JSON.stringify(this.prevSelectedIds)) {
      this.prevSelectedIds = selectedIds;
      this.markAllDirty();
    }

    if (!moved && maxV < MIN_VELOCITY) {
      this.idleFrames += dt;
      if (this.idleFrames > 60 && !this.forceLayoutEnabled) {
        this.simulating = false;
      }
    } else {
      this.idleFrames = 0;
    }
  }

  kickSimulation() {
    this.simulating = true;
    this.idleFrames = 0;
    this.markAllDirty();
  }

  private buildGridCache(width: number, height: number, scale: number) {
    if (!this.gridCache) {
      this.gridCache = document.createElement('canvas');
    }
    const c = this.gridCache;
    const dpr = window.devicePixelRatio || 1;
    c.width = width * dpr;
    c.height = height * dpr;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#f5f6fa';
    ctx.fillRect(0, 0, width, height);
    let spacing = 40;
    if (scale < 0.6) spacing = 80;
    if (scale > 1.5) spacing = 20;
    const effSpacing = spacing * scale;
    ctx.fillStyle = '#d6dae3';
    for (let x = 0; x < width; x += effSpacing) {
      for (let y = 0; y < height; y += effSpacing) {
        ctx.fillRect(x, y, 1.2, 1.2);
      }
    }
    this.gridCacheScale = scale;
  }

  private renderGrid(width: number, height: number) {
    const s = this.viewport.scale;
    if (!this.gridCache || this.gridCacheScale !== s) {
      this.buildGridCache(width, height, s);
    }
    if (this.gridCache) {
      const ox = ((this.viewport.offsetX % (40 * s)) + 40 * s) % (40 * s);
      const oy = ((this.viewport.offsetY % (40 * s)) + 40 * s) % (40 * s);
      this.ctx.drawImage(this.gridCache, -ox, -oy);
    }
  }

  private getVisibleNodes(): KnowledgeNode[] {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    const margin = 100;
    const topLeft = this.screenToWorld(-margin, -margin);
    const bottomRight = this.screenToWorld(w + margin, h + margin);
    const rect: Rect = {
      x: topLeft.x,
      y: topLeft.y,
      w: bottomRight.x - topLeft.x,
      h: bottomRight.y - topLeft.y,
    };
    this.viewportRect = rect;
    return this.spatialGrid.queryRange(rect);
  }

  private render() {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    if (!this.dirtyRect) {
      this.dirtyRect = { x: 0, y: 0, w: width, h: height };
    }

    const dr = this.dirtyRect;
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.rect(dr.x, dr.y, dr.w, dr.h);
    this.ctx.clip();

    this.ctx.clearRect(dr.x, dr.y, dr.w, dr.h);
    this.renderGrid(width, height);

    const allNodes = this.callbacks.getNodes();
    const visibleNodesList = this.getVisibleNodes();
    const visibleNodes = new Set(
      visibleNodesList.length > 0 ? visibleNodesList.map((n) => n.id) : allNodes.map((n) => n.id),
    );
    const links = this.callbacks.getLinks();
    const highlightedIds = new Set(this.callbacks.getHighlightedPathIds());
    const nodeById = new Map(allNodes.map((n) => [n.id, n]));

    for (const link of links) {
      const a = nodeById.get(link.sourceId);
      const b = nodeById.get(link.targetId);
      if (!a || !b) continue;
      if (!visibleNodes.has(a.id) && !visibleNodes.has(b.id)) continue;
      this.drawLink(link, a, b, highlightedIds.has(link.id), this.hoveredLinkId === link.id);
    }

    if (this.pendingLinkDrag) {
      const p = this.pendingLinkDrag;
      const s = this.worldToScreen(p.startX, p.startY);
      this.drawBezierWithArrow(
        s.x,
        s.y,
        p.mouseX,
        p.mouseY,
        '#4a9eff',
        2.5,
        [8, 6],
        0.6,
      );
    }

    const nodesToDraw = visibleNodesList.length > 0 ? visibleNodesList : allNodes;
    for (const n of nodesToDraw) {
      if (!visibleNodes.has(n.id)) continue;
      this.drawNodeCard(n);
    }

    this.drawEdgeIndicators(visibleNodesList.length > 0 ? visibleNodesList : allNodes, width, height);
    this.ctx.restore();
    this.dirtyRect = null;
  }

  private bezierPoint(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    offset: number,
  ): { cx: number; cy: number } {
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    return { cx: mx + nx * offset, cy: my + ny * offset };
  }

  private quadPoint(t: number, x1: number, y1: number, cx: number, cy: number, x2: number, y2: number) {
    const it = 1 - t;
    return {
      x: it * it * x1 + 2 * it * t * cx + t * t * x2,
      y: it * it * y1 + 2 * it * t * cy + t * t * y2,
    };
  }

  private drawBezierWithArrow(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string,
    lineWidth: number,
    dash: number[] | null = null,
    alpha = 1,
  ) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const curve = Math.min(60, len * 0.18);
    const { cx, cy } = this.bezierPoint(x1, y1, x2, y2, curve);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(cx, cy, x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);

    const tip = this.quadPoint(0.95, x1, y1, cx, cy, x2, y2);
    const before = this.quadPoint(0.88, x1, y1, cx, cy, x2, y2);
    const adx = tip.x - before.x;
    const ady = tip.y - before.y;
    const al = Math.sqrt(adx * adx + ady * ady) || 1;
    const ux = adx / al;
    const uy = ady / al;
    const px = -uy;
    const py = ux;
    const size = 10;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(tip.x, tip.y);
    ctx.lineTo(tip.x - ux * size + px * size * 0.55, tip.y - uy * size + py * size * 0.55);
    ctx.lineTo(tip.x - ux * size - px * size * 0.55, tip.y - uy * size - py * size * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private drawLink(
    link: KnowledgeLink,
    a: KnowledgeNode,
    b: KnowledgeNode,
    highlighted: boolean,
    hovered: boolean,
  ) {
    const sa = this.worldToScreen(
      a.x + NODE_WIDTH / 2,
      a.y + NODE_HEIGHT / 2,
    );
    const sb = this.worldToScreen(
      b.x + NODE_WIDTH / 2,
      b.y + NODE_HEIGHT / 2,
    );
    const color = highlighted ? '#ff6b6b' : LINK_TYPE_COLORS[link.type];
    const lw = hovered || highlighted ? 3.5 : 2;
    this.drawBezierWithArrow(
      sa.x,
      sa.y,
      sb.x,
      sb.y,
      color,
      lw,
      null,
      hovered ? 1 : highlighted ? 0.95 : 0.82,
    );
    const dx = sb.x - sa.x;
    const dy = sb.y - sa.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const curve = Math.min(60, len * 0.18);
    const cx = (sa.x + sb.x) / 2 + (-dy / len) * curve;
    const cy = (sa.y + sb.y) / 2 + (dx / len) * curve;
    const mid = this.quadPoint(0.5, sa.x, sa.y, cx, cy, sb.x, sb.y);
    const ctx = this.ctx;
    ctx.save();
    ctx.font = '11px "PingFang SC", "Microsoft YaHei", sans-serif';
    const label = link.label;
    const textMetrics = ctx.measureText(label);
    const padX = 8;
    const padY = 4;
    const tw = textMetrics.width + padX * 2;
    const th = 18;
    ctx.fillStyle = hovered ? '#ffffff' : 'rgba(255,255,255,0.9)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    this.roundRect(ctx, mid.x - tw / 2, mid.y - th / 2, tw, th, 9);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#2c3e50';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, mid.x, mid.y + 0.5);
    ctx.restore();
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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

  private drawNodeCard(n: KnowledgeNode) {
    const ctx = this.ctx;
    const topLeft = this.worldToScreen(n.x, n.y);
    const s = this.viewport.scale;
    const w = NODE_WIDTH * s;
    const h = NODE_HEIGHT * s;
    const x = topLeft.x;
    const y = topLeft.y;

    let appearT = 1;
    if (n.__animAppear) {
      const elapsed = (performance.now() - n.__animAppear) / 300;
      appearT = Math.min(1, elapsed);
    }
    const ease = appearT < 1 ? 1 - Math.pow(1 - appearT, 3) : 1;
    const scale = ease;
    const alpha = ease;

    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;
    const bx = -w / 2;
    const by = -h / 2;

    const selected = useNodeStore.getState().selectedIds.includes(n.id);
    const shadowColor = selected ? 'rgba(74,158,255,0.45)' : 'rgba(44,62,80,0.18)';
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = selected ? 22 : 12;
    ctx.shadowOffsetY = selected ? 4 : 2;
    ctx.fillStyle = n.color || '#f8f9fa';
    this.roundRect(ctx, bx, by, w, h, 12 * s);
    ctx.fill();
    ctx.shadowBlur = 0;

    if (selected) {
      ctx.strokeStyle = '#4a9eff';
      ctx.lineWidth = 2.2;
      this.roundRect(ctx, bx, by, w, h, 12 * s);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(44,62,80,0.08)';
    ctx.lineWidth = 1;
    this.roundRect(ctx, bx, by, w, h, 12 * s);
    ctx.stroke();

    const topPad = 12 * s;
    const sidePad = 14 * s;

    ctx.fillStyle = '#2c3e50';
    ctx.font = `bold ${Math.max(10, 13 * s)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const titleMaxW = w - sidePad * 2;
    const title = this.truncateText(ctx, n.title || '(无标题)', titleMaxW);
    ctx.fillText(title, bx + sidePad, by + topPad);

    const summaryY = by + topPad + 20 * s;
    ctx.fillStyle = '#5a6c7d';
    ctx.font = `${Math.max(9, 11 * s)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    const summaryLines = this.wrapText(ctx, n.summary, w - sidePad * 2, 2);
    let lineIdx = 0;
    for (const line of summaryLines) {
      ctx.fillText(line, bx + sidePad, summaryY + lineIdx * 14 * s);
      lineIdx++;
    }

    const tagY = by + h - 30 * s;
    let tagX = bx + sidePad;
    ctx.font = `${Math.max(8, 10 * s)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    for (const tag of n.tags.slice(0, 3)) {
      const text = tag;
      const tw = ctx.measureText(text).width + 10 * s;
      const th = 18 * s;
      ctx.fillStyle = 'rgba(74,158,255,0.16)';
      this.roundRect(ctx, tagX, tagY, tw, th, 9 * s);
      ctx.fill();
      ctx.fillStyle = '#2c6bd9';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, tagX + 5 * s, tagY + th / 2);
      tagX += tw + 6 * s;
      if (tagX > bx + w - sidePad - 20 * s) break;
    }

    const progW = 36 * s;
    const progH = 36 * s;
    const progCx = bx + w - sidePad - progW / 2;
    const progCy = by + topPad + 10 * s;
    ctx.save();
    ctx.beginPath();
    ctx.arc(progCx, progCy, progW / 2.1, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(44,62,80,0.06)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(44,62,80,0.12)';
    ctx.lineWidth = 3 * s;
    ctx.beginPath();
    ctx.arc(progCx, progCy, progW / 2.4, 0, Math.PI * 2);
    ctx.stroke();
    const p = clamp(n.progress / 100, 0, 1);
    const startA = -Math.PI / 2;
    ctx.strokeStyle = p >= 1 ? '#52c41a' : p > 0 ? '#4a9eff' : '#b6c2cf';
    ctx.lineWidth = 3.2 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(progCx, progCy, progW / 2.4, startA, startA + Math.PI * 2 * p);
    ctx.stroke();
    ctx.fillStyle = '#2c3e50';
    ctx.font = `bold ${Math.max(7, 9 * s)}px "PingFang SC", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.round(n.progress)}%`, progCx, progCy + 0.5);
    ctx.restore();

    if (s >= 0.7) {
      const cornerSize = 10 * s;
      ctx.fillStyle = 'rgba(74,158,255,0.85)';
      ctx.beginPath();
      ctx.arc(bx, by, cornerSize / 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(bx + w, by, cornerSize / 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(bx, by + h, cornerSize / 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(bx + w, by + h, cornerSize / 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private truncateText(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
    if (ctx.measureText(text).width <= maxW) return text;
    const ellipsis = '…';
    let hi = text.length;
    let lo = 0;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (ctx.measureText(text.slice(0, mid) + ellipsis).width > maxW) hi = mid;
      else lo = mid + 1;
    }
    return text.slice(0, Math.max(0, lo - 1)) + ellipsis;
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number, maxLines: number) {
    const lines: string[] = [];
    let current = '';
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const test = current + ch;
      if (ctx.measureText(test).width > maxW && current) {
        lines.push(current);
        if (lines.length >= maxLines - 1) {
          const rest = text.slice(i);
          lines.push(this.truncateText(ctx, rest, maxW));
          return lines;
        }
        current = ch;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines.slice(0, maxLines);
  }

  private drawEdgeIndicators(nodes: KnowledgeNode[], width: number, height: number) {
    const margin = 30;
    const dirs = { left: false, right: false, top: false, bottom: false };
    for (const n of nodes) {
      const tl = this.worldToScreen(n.x, n.y);
      const br = this.worldToScreen(n.x + NODE_WIDTH, n.y + NODE_HEIGHT);
      if (tl.x < 0) dirs.left = true;
      if (br.x > width) dirs.right = true;
      if (tl.y < 0) dirs.top = true;
      if (br.y > height) dirs.bottom = true;
    }
    const pulse = 0.6 + Math.sin(this.edgeIndicatorPhase) * 0.4;
    const ctx = this.ctx;
    ctx.save();
    const color = `rgba(255,107,107,${pulse})`;
    ctx.fillStyle = color;
    const drawArrow = (cx: number, cy: number, rot: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.beginPath();
      const size = 14 + pulse * 6;
      ctx.moveTo(size, 0);
      ctx.lineTo(-size * 0.5, -size * 0.6);
      ctx.lineTo(-size * 0.2, 0);
      ctx.lineTo(-size * 0.5, size * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };
    if (dirs.left) drawArrow(margin + 4, height / 2, Math.PI);
    if (dirs.right) drawArrow(width - margin - 4, height / 2, 0);
    if (dirs.top) drawArrow(width / 2, margin + 4, -Math.PI / 2);
    if (dirs.bottom) drawArrow(width / 2, height - margin - 4, Math.PI / 2);
    ctx.restore();
  }

  private renderMiniMap() {
    if (!this.miniMapCanvas || !this.miniMapCtx) return;
    const ctx = this.miniMapCtx;
    const mw = this.miniMapCanvas.clientWidth;
    const mh = this.miniMapCanvas.clientHeight;
    ctx.clearRect(0, 0, mw, mh);
    const nodes = this.callbacks.getNodes();
    if (nodes.length === 0) return;
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const n of nodes) {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + NODE_WIDTH);
      maxY = Math.max(maxY, n.y + NODE_HEIGHT);
    }
    const pad = 60;
    minX -= pad;
    minY -= pad;
    maxX += pad;
    maxY += pad;
    const gw = maxX - minX;
    const gh = maxY - minY;
    const scale = Math.min(mw / gw, mh / gh);
    const offX = (mw - gw * scale) / 2 - minX * scale;
    const offY = (mh - gh * scale) / 2 - minY * scale;
    ctx.fillStyle = 'rgba(44,62,80,0.06)';
    ctx.fillRect(0, 0, mw, mh);
    const links = this.callbacks.getLinks();
    const nodeById = new Map(nodes.map((n) => [n.id, n]));
    ctx.strokeStyle = 'rgba(74,158,255,0.5)';
    ctx.lineWidth = 1;
    for (const l of links) {
      const a = nodeById.get(l.sourceId);
      const b = nodeById.get(l.targetId);
      if (!a || !b) continue;
      const ax = (a.x + NODE_WIDTH / 2) * scale + offX;
      const ay = (a.y + NODE_HEIGHT / 2) * scale + offY;
      const bx = (b.x + NODE_WIDTH / 2) * scale + offX;
      const by = (b.y + NODE_HEIGHT / 2) * scale + offY;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
    }
    for (const n of nodes) {
      const x = n.x * scale + offX;
      const y = n.y * scale + offY;
      const w = NODE_WIDTH * scale;
      const h = NODE_HEIGHT * scale;
      ctx.fillStyle = n.color || '#f8f9fa';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = 'rgba(44,62,80,0.2)';
      ctx.strokeRect(x, y, w, h);
    }
    const vp = this.viewport;
    const canvasW = this.canvas.clientWidth;
    const canvasH = this.canvas.clientHeight;
    const vx = -vp.offsetX / vp.scale;
    const vy = -vp.offsetY / vp.scale;
    const vw = canvasW / vp.scale;
    const vh = canvasH / vp.scale;
    const rx = vx * scale + offX;
    const ry = vy * scale + offY;
    const rw = vw * scale;
    const rh = vh * scale;
    ctx.strokeStyle = '#4a9eff';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(74,158,255,0.15)';
    ctx.fillRect(rx, ry, rw, rh);
    ctx.strokeRect(rx, ry, rw, rh);
  }

  hitTestNode(sx: number, sy: number): KnowledgeNode | null {
    const { x, y } = this.screenToWorld(sx, sy);
    const rect: Rect = { x: x - 5, y: y - 5, w: 10, h: 10 };
    const candidates = this.spatialGrid.queryRange(rect);
    for (let i = candidates.length - 1; i >= 0; i--) {
      const n = candidates[i];
      if (x >= n.x && x <= n.x + NODE_WIDTH && y >= n.y && y <= n.y + NODE_HEIGHT) {
        return n;
      }
    }
    return null;
  }

  hitTestCorner(sx: number, sy: number): { nodeId: string; x: number; y: number } | null {
    const { x, y } = this.screenToWorld(sx, sy);
    const threshold = 16 / this.viewport.scale;
    const rect: Rect = { x: x - threshold, y: y - threshold, w: threshold * 2, h: threshold * 2 };
    const candidates = this.spatialGrid.queryRange(rect);
    const corners = [
      { ox: 0, oy: 0 },
      { ox: NODE_WIDTH, oy: 0 },
      { ox: 0, oy: NODE_HEIGHT },
      { ox: NODE_WIDTH, oy: NODE_HEIGHT },
    ];
    for (const n of candidates) {
      for (const c of corners) {
        const cx = n.x + c.ox;
        const cy = n.y + c.oy;
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= threshold * threshold) {
          return { nodeId: n.id, x: cx, y: cy };
        }
      }
    }
    return null;
  }

  hitTestLink(sx: number, sy: number): KnowledgeLink | null {
    const { x, y } = this.screenToWorld(sx, sy);
    const threshold = 8 / this.viewport.scale;
    const rect: Rect = { x: x - threshold * 3, y: y - threshold * 3, w: threshold * 6, h: threshold * 6 };
    const candidates = this.spatialGrid.queryRange(rect);
    const candidateIds = new Set(candidates.map((n) => n.id));
    const nodes = this.callbacks.getNodes();
    const nodeById = new Map(nodes.map((n) => [n.id, n]));
    for (const l of this.callbacks.getLinks()) {
      if (!candidateIds.has(l.sourceId) && !candidateIds.has(l.targetId)) continue;
      const a = nodeById.get(l.sourceId);
      const b = nodeById.get(l.targetId);
      if (!a || !b) continue;
      const ax = a.x + NODE_WIDTH / 2;
      const ay = a.y + NODE_HEIGHT / 2;
      const bx = b.x + NODE_WIDTH / 2;
      const by = b.y + NODE_HEIGHT / 2;
      const dx = bx - ax;
      const dy = by - ay;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const curve = Math.min(60, len * 0.18);
      const mx = (ax + bx) / 2 + (-dy / len) * curve;
      const my = (ay + by) / 2 + (dx / len) * curve;
      let minD = Infinity;
      for (let t = 0; t <= 1.01; t += 0.08) {
        const it = 1 - t;
        const px = it * it * ax + 2 * it * t * mx + t * t * bx;
        const py = it * it * ay + 2 * it * t * my + t * t * by;
        const ddx = x - px;
        const ddy = y - py;
        const d = ddx * ddx + ddy * ddy;
        if (d < minD) minD = d;
      }
      if (minD <= threshold * threshold) return l;
    }
    return null;
  }

  fitView(nodes: KnowledgeNode[]) {
    if (nodes.length === 0) return;
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const n of nodes) {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + NODE_WIDTH);
      maxY = Math.max(maxY, n.y + NODE_HEIGHT);
    }
    const pad = 120;
    minX -= pad;
    minY -= pad;
    maxX += pad;
    maxY += pad;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    const scale = Math.min(w / (maxX - minX), h / (maxY - minY), 1.4);
    this.viewport.scale = scale;
    this.viewport.offsetX = -minX * scale + (w - (maxX - minX) * scale) / 2;
    this.viewport.offsetY = -minY * scale + (h - (maxY - minY) * scale) / 2;
    this.markAllDirty();
  }
}
