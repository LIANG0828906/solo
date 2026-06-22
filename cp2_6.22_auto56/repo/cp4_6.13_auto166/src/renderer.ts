import type { CommitRecord } from './dataParser';

const AUTHOR_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
const BRANCH_COLORS = [
  ['#3b82f6', '#8b5cf6'],
  ['#10b981', '#06b6d4'],
  ['#f59e0b', '#f97316'],
  ['#ef4444', '#ec4899'],
  ['#8b5cf6', '#3b82f6'],
  ['#ec4899', '#ef4444'],
  ['#06b6d4', '#10b981'],
  ['#f97316', '#f59e0b'],
];

const DAY_WIDTH = 40;
const AUTHOR_ROW_HEIGHT = 50;
const PADDING_TOP = 60;
const PADDING_LEFT = 120;
const MIN_NODE_SIZE = 10;
const MAX_NODE_SIZE = 30;
const BRANCH_OFFSET = 4;

interface NodeInfo {
  record: CommitRecord;
  x: number;
  y: number;
  baseRadius: number;
  color: string;
  authorIndex: number;
  branchIndex: number;
  dayOffset: number;
}

interface IntersectionPoint {
  x: number;
  y: number;
}

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private offscreen: HTMLCanvasElement;
  private offCtx: CanvasRenderingContext2D;
  private nodes: NodeInfo[] = [];
  private authorMap: Map<string, number> = new Map();
  private branchMap: Map<string, number> = new Map();
  private scrollOffset = 0;
  private targetScrollOffset = 0;
  private animationFrameId: number | null = null;
  private hoveredNode: NodeInfo | null = null;
  private selectedNode: NodeInfo | null = null;
  private onNodeClick: ((node: NodeInfo) => void) | null = null;
  private onNodeHover: ((node: NodeInfo | null, x: number, y: number) => void) | null = null;
  private nodeGrid: Map<string, NodeInfo[]> = new Map();
  private gridCellSize = 40;
  private visibleStartDay = 0;
  private visibleEndDay = 0;
  private dayTimestamps: number[] = [];
  private intersectionPoints: IntersectionPoint[] = [];
  private nodeBirthProgress: Map<number, number> = new Map();
  private birthAnimFrame: number | null = null;
  private maxDayOffset = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.offscreen = document.createElement('canvas');
    this.offCtx = this.offscreen.getContext('2d')!;
    this.setupEvents();
  }

  setCallbacks(onClick: (node: NodeInfo) => void, onHover: (node: NodeInfo | null, x: number, y: number) => void) {
    this.onNodeClick = onClick;
    this.onNodeHover = onHover;
  }

  private setupEvents() {
    this.canvas.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();
      this.targetScrollOffset += e.deltaY > 0 ? 50 : -50;
      this.targetScrollOffset = Math.max(0, Math.min(this.targetScrollOffset, this.maxDayOffset * DAY_WIDTH - this.canvas.width + PADDING_LEFT + 100));
      this.scheduleScrollAnimation();
    }, { passive: false });

    this.canvas.addEventListener('mousemove', (e: MouseEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left + this.scrollOffset;
      const my = e.clientY - rect.top;
      const found = this.findNodeAt(mx, my);
      if (found !== this.hoveredNode) {
        this.hoveredNode = found;
        if (this.onNodeHover) {
          const screenX = found ? found.x - this.scrollOffset : 0;
          this.onNodeHover(found, screenX, found ? found.y : 0);
        }
        this.renderFrame();
      }
    });

    this.canvas.addEventListener('click', (e: MouseEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left + this.scrollOffset;
      const my = e.clientY - rect.top;
      const found = this.findNodeAt(mx, my);
      if (found) {
        this.selectedNode = found;
        if (this.onNodeClick) this.onNodeClick(found);
        this.renderFrame();
      }
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.hoveredNode = null;
      if (this.onNodeHover) this.onNodeHover(null, 0, 0);
      this.renderFrame();
    });
  }

  private scheduleScrollAnimation() {
    if (this.animationFrameId) return;
    const animate = () => {
      const diff = this.targetScrollOffset - this.scrollOffset;
      if (Math.abs(diff) < 0.5) {
        this.scrollOffset = this.targetScrollOffset;
        this.animationFrameId = null;
      } else {
        this.scrollOffset += diff * 0.2;
        this.animationFrameId = requestAnimationFrame(animate);
      }
      this.renderFrame();
    };
    this.animationFrameId = requestAnimationFrame(animate);
  }

  private findNodeAt(worldX: number, worldY: number): NodeInfo | null {
    const gridX = Math.floor(worldX / this.gridCellSize);
    const gridY = Math.floor(worldY / this.gridCellSize);
    const candidates: NodeInfo[] = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = `${gridX + dx},${gridY + dy}`;
        const cell = this.nodeGrid.get(key);
        if (cell) candidates.push(...cell);
      }
    }
    let closest: NodeInfo | null = null;
    let closestDist = Infinity;
    for (const node of candidates) {
      const dist = Math.hypot(worldX - node.x, worldY - node.y);
      if (dist <= node.baseRadius && dist < closestDist) {
        closest = node;
        closestDist = dist;
      }
    }
    return closest;
  }

  private buildSpatialIndex() {
    this.nodeGrid.clear();
    for (const node of this.nodes) {
      const gx = Math.floor(node.x / this.gridCellSize);
      const gy = Math.floor(node.y / this.gridCellSize);
      const key = `${gx},${gy}`;
      if (!this.nodeGrid.has(key)) this.nodeGrid.set(key, []);
      this.nodeGrid.get(key)!.push(node);
    }
  }

  setData(records: CommitRecord[]) {
    this.authorMap.clear();
    this.branchMap.clear();
    this.nodes = [];
    this.intersectionPoints = [];
    this.nodeBirthProgress.clear();

    let authorIdx = 0;
    for (const r of records) {
      if (!this.authorMap.has(r.author)) {
        this.authorMap.set(r.author, Math.min(authorIdx++, 7));
      }
    }

    let branchIdx = 0;
    for (const r of records) {
      if (!this.branchMap.has(r.branch)) {
        this.branchMap.set(r.branch, branchIdx++);
      }
    }

    if (records.length === 0) return;

    const minTs = records[0].timestamp;
    const dayMs = 86400000;
    const daySet = new Set<number>();

    for (const r of records) {
      const dayOffset = Math.floor((r.timestamp - minTs) / dayMs);
      daySet.add(dayOffset);
    }

    this.dayTimestamps = Array.from(daySet).sort((a, b) => a - b);
    this.maxDayOffset = this.dayTimestamps[this.dayTimestamps.length - 1] || 0;

    const linesMin = Math.min(...records.map(r => r.linesAdded + r.linesDeleted));
    const linesMax = Math.max(...records.map(r => r.linesAdded + r.linesDeleted));
    const linesRange = linesMax - linesMin || 1;

    for (const r of records) {
      const dayOffset = Math.floor((r.timestamp - minTs) / dayMs);
      const ai = this.authorMap.get(r.author) ?? 0;
      const bi = this.branchMap.get(r.branch) ?? 0;
      const totalLines = r.linesAdded + r.linesDeleted;
      const normalized = (totalLines - linesMin) / linesRange;
      const baseRadius = MIN_NODE_SIZE / 2 + normalized * (MAX_NODE_SIZE - MIN_NODE_SIZE) / 2;

      const node: NodeInfo = {
        record: r,
        x: PADDING_LEFT + dayOffset * DAY_WIDTH + bi * BRANCH_OFFSET,
        y: PADDING_TOP + ai * AUTHOR_ROW_HEIGHT + AUTHOR_ROW_HEIGHT / 2,
        baseRadius,
        color: AUTHOR_COLORS[ai],
        authorIndex: ai,
        branchIndex: bi,
        dayOffset,
      };
      this.nodes.push(node);
      this.nodeBirthProgress.set(this.nodes.length - 1, 0);
    }

    this.detectIntersections();
    this.buildSpatialIndex();

    this.resizeCanvas();
    this.renderOffscreen();
    this.startBirthAnimation();
  }

  private detectIntersections() {
    const dayGroups = new Map<number, Set<string>>();
    for (const node of this.nodes) {
      if (!dayGroups.has(node.dayOffset)) {
        dayGroups.set(node.dayOffset, new Set());
      }
      dayGroups.get(node.dayOffset)!.add(node.record.branch);
    }

    for (const [dayOffset, branches] of dayGroups) {
      if (branches.size >= 2) {
        const groupNodes = this.nodes.filter(n => n.dayOffset === dayOffset);
        const authors = new Set(groupNodes.map(n => n.authorIndex));
        for (const ai of authors) {
          this.intersectionPoints.push({
            x: PADDING_LEFT + dayOffset * DAY_WIDTH,
            y: PADDING_TOP + ai * AUTHOR_ROW_HEIGHT + AUTHOR_ROW_HEIGHT / 2,
          });
        }
      }
    }

    for (const node of this.nodes) {
      const msg = node.record.message.toLowerCase();
      if (msg.includes('merge') || msg.includes('merged')) {
        let exists = this.intersectionPoints.some(
          p => Math.abs(p.x - node.x) < DAY_WIDTH / 2 && Math.abs(p.y - node.y) < AUTHOR_ROW_HEIGHT / 2
        );
        if (!exists) {
          this.intersectionPoints.push({ x: node.x, y: node.y });
        }
      }
    }
  }

  private startBirthAnimation() {
    const startTime = performance.now();
    const duration = 500;
    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      for (let i = 0; i < this.nodes.length; i++) {
        const delay = (i / this.nodes.length) * 200;
        const localProgress = Math.min(Math.max((elapsed - delay) / 300, 0), 1);
        const elastic = localProgress < 1
          ? 1 - Math.pow(2, -10 * localProgress) * Math.cos((localProgress * 10 - 0.75) * ((2 * Math.PI) / 3))
          : 1;
        this.nodeBirthProgress.set(i, Math.min(elastic, 1));
      }
      this.renderFrame();
      if (progress < 1) {
        this.birthAnimFrame = requestAnimationFrame(animate);
      } else {
        for (let i = 0; i < this.nodes.length; i++) {
          this.nodeBirthProgress.set(i, 1);
        }
        this.birthAnimFrame = null;
        this.renderFrame();
      }
    };
    if (this.birthAnimFrame) cancelAnimationFrame(this.birthAnimFrame);
    this.birthAnimFrame = requestAnimationFrame(animate);
  }

  resizeCanvas() {
    const area = this.canvas.parentElement!;
    const dpr = window.devicePixelRatio || 1;
    const w = area.clientWidth;
    const h = area.clientHeight;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.renderOffscreen();
    this.renderFrame();
  }

  private renderOffscreen() {
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.width / dpr;
    const h = this.canvas.height / dpr;
    this.offscreen.width = this.canvas.width;
    this.offscreen.height = this.canvas.height;
    this.offCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.offCtx.fillStyle = '#f1f5f9';
    this.offCtx.fillRect(0, 0, w, h);

    this.offCtx.strokeStyle = '#e2e8f0';
    this.offCtx.lineWidth = 0.5;
    for (let x = PADDING_LEFT; x < PADDING_LEFT + (this.maxDayOffset + 1) * DAY_WIDTH; x += DAY_WIDTH) {
      this.offCtx.beginPath();
      this.offCtx.moveTo(x, PADDING_TOP - 10);
      this.offCtx.lineTo(x, PADDING_TOP + this.authorMap.size * AUTHOR_ROW_HEIGHT);
      this.offCtx.stroke();
    }

    for (const [author, idx] of this.authorMap) {
      const y = PADDING_TOP + idx * AUTHOR_ROW_HEIGHT + AUTHOR_ROW_HEIGHT / 2;
      this.offCtx.fillStyle = '#64748b';
      this.offCtx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
      this.offCtx.textAlign = 'right';
      this.offCtx.textBaseline = 'middle';
      this.offCtx.fillText(author, PADDING_LEFT - 12, y);
    }

    this.drawBranchLines(this.offCtx, w, h);
    this.drawIntersectionPoints(this.offCtx);
  }

  private drawBranchLines(ctx: CanvasRenderingContext2D, _w: number, _h: number) {
    const branchNodes = new Map<string, NodeInfo[]>();
    for (const node of this.nodes) {
      if (!branchNodes.has(node.record.branch)) {
        branchNodes.set(node.record.branch, []);
      }
      branchNodes.get(node.record.branch)!.push(node);
    }

    for (const [branch, nodes] of branchNodes) {
      const sorted = nodes.sort((a, b) => a.dayOffset - b.dayOffset);
      if (sorted.length < 2) continue;
      const bi = this.branchMap.get(branch) ?? 0;
      const colorPair = BRANCH_COLORS[bi % BRANCH_COLORS.length];

      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 0.5;

      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const curr = sorted[i];
        const grad = ctx.createLinearGradient(prev.x, prev.y, curr.x, curr.y);
        grad.addColorStop(0, colorPair[0]);
        grad.addColorStop(1, colorPair[1]);
        ctx.strokeStyle = grad;
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(curr.x, curr.y);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  private drawIntersectionPoints(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#fbbf24';
    for (const pt of this.intersectionPoints) {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private renderFrame() {
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.width / dpr;
    const h = this.canvas.height / dpr;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(this.offscreen, 0, 0, this.offscreen.width, this.offscreen.height, 0, 0, w, h);

    ctx.save();
    ctx.translate(-this.scrollOffset, 0);

    const viewLeft = this.scrollOffset;
    const viewRight = this.scrollOffset + w;

    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      if (node.x + MAX_NODE_SIZE < viewLeft || node.x - MAX_NODE_SIZE > viewRight) continue;

      const scale = this.nodeBirthProgress.get(i) ?? 1;
      const isHovered = node === this.hoveredNode;
      const isSelected = node === this.selectedNode;
      const drawRadius = node.baseRadius * scale * (isHovered ? 1.5 : 1);

      if (isHovered) {
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }

      ctx.beginPath();
      ctx.arc(node.x, node.y, drawRadius, 0, Math.PI * 2);
      ctx.fillStyle = node.color;
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      if (isSelected) {
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(node.x, node.y, drawRadius + 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    ctx.restore();

    ctx.save();
    ctx.translate(-this.scrollOffset, 0);

    const minTs = this.nodes.length > 0 ? this.nodes[0].record.timestamp : 0;
    const dayMs = 86400000;
    ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    for (let day = 0; day <= this.maxDayOffset; day++) {
      const x = PADDING_LEFT + day * DAY_WIDTH;
      if (x + DAY_WIDTH < viewLeft || x - DAY_WIDTH > viewRight) continue;
      if (day % 7 === 0) {
        const date = new Date(minTs + day * dayMs);
        const label = `${date.getMonth() + 1}/${date.getDate()}`;
        ctx.fillText(label, x, PADDING_TOP - 14);
      }
    }

    ctx.restore();
  }

  getAuthorMap() { return this.authorMap; }
  getBranchMap() { return this.branchMap; }
  getNodes() { return this.nodes; }
  getSelectedNode() { return this.selectedNode; }
  getIntersectionPoints() { return this.intersectionPoints; }

  filterByBranch(branch: string | null) {
    if (branch === null) {
      for (const node of this.nodes) {
        const bi = this.branchMap.get(node.record.branch) ?? 0;
        node.x = PADDING_LEFT + node.dayOffset * DAY_WIDTH + bi * BRANCH_OFFSET;
      }
    } else {
      for (const node of this.nodes) {
        if (node.record.branch === branch) {
          const bi = this.branchMap.get(node.record.branch) ?? 0;
          node.x = PADDING_LEFT + node.dayOffset * DAY_WIDTH + bi * BRANCH_OFFSET;
        } else {
          node.x = PADDING_LEFT + node.dayOffset * DAY_WIDTH - 9999;
        }
      }
    }
    this.buildSpatialIndex();
    this.renderOffscreen();
    this.renderFrame();
  }
}
