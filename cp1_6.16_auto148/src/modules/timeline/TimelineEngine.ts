import { v4 as uuidv4 } from 'uuid';

export type NodeShape = 'circle' | 'diamond' | 'star';
export type ThemeMode = 'dark' | 'light';

export interface TimelineNode {
  id: string;
  timelineId: string;
  title: string;
  description: string;
  date: number;
  tags: string[];
  shape: NodeShape;
  positionX: number;
}

export interface Timeline {
  id: string;
  title: string;
  color: string;
  yPosition: number;
  nodes: TimelineNode[];
  createdAt: number;
}

export interface ViewportState {
  offsetX: number;
  offsetY: number;
  zoom: number;
  centerTime: number;
}

export interface TimelineSnapshot {
  version: string;
  exportedAt: number;
  timelines: Timeline[];
  viewport: ViewportState;
}

export const COLOR_PALETTE = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];
export const NODE_SHAPES: NodeShape[] = ['circle', 'diamond', 'star'];
export const TIMELINE_VERTICAL_SPACING = 140;
export const NODE_BASE_SIZE = 14;
export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 3.0;
export const TIME_BASE_OFFSET = new Date('2020-01-01').getTime();
export const TIME_PIXELS_PER_MS = 0.0000005;

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

export class TimelineEngine {
  private timelines: Timeline[] = [];
  private viewport: ViewportState;
  private colorIndex = 0;
  private timelineCounter = 0;

  constructor(initialViewport?: Partial<ViewportState>) {
    this.viewport = {
      offsetX: 100,
      offsetY: 100,
      zoom: 1,
      centerTime: Date.now(),
      ...initialViewport,
    };
  }

  getTimelines(): Timeline[] {
    return this.timelines;
  }

  getViewport(): ViewportState {
    return { ...this.viewport };
  }

  getTimelineById(id: string): Timeline | undefined {
    return this.timelines.find(t => t.id === id);
  }

  getNodeById(nodeId: string): { node: TimelineNode; timeline: Timeline } | undefined {
    for (const timeline of this.timelines) {
      const node = timeline.nodes.find(n => n.id === nodeId);
      if (node) return { node, timeline };
    }
    return undefined;
  }

  getNextColor(): string {
    const color = COLOR_PALETTE[this.colorIndex % COLOR_PALETTE.length];
    this.colorIndex++;
    return color;
  }

  addTimeline(title?: string): Timeline {
    this.timelineCounter++;
    const timeline: Timeline = {
      id: uuidv4(),
      title: title || `时间线 ${this.timelineCounter}`,
      color: this.getNextColor(),
      yPosition: 120 + (this.timelines.length) * TIMELINE_VERTICAL_SPACING,
      nodes: [],
      createdAt: Date.now(),
    };
    this.timelines.push(timeline);
    return timeline;
  }

  removeTimeline(id: string): boolean {
    const index = this.timelines.findIndex(t => t.id === id);
    if (index === -1) return false;
    this.timelines.splice(index, 1);
    this.rebalanceTimelinePositions();
    return true;
  }

  updateTimeline(id: string, patch: Partial<Timeline>): Timeline | undefined {
    const timeline = this.getTimelineById(id);
    if (!timeline) return undefined;
    Object.assign(timeline, patch);
    return timeline;
  }

  rebalanceTimelinePositions(): void {
    this.timelines.forEach((t, i) => {
      t.yPosition = 120 + i * TIMELINE_VERTICAL_SPACING;
    });
  }

  addNode(timelineId: string, data?: Partial<TimelineNode>): TimelineNode | undefined {
    const timeline = this.getTimelineById(timelineId);
    if (!timeline) return undefined;

    const existingCount = timeline.nodes.length;
    const baseDate = data?.date ?? (TIME_BASE_OFFSET + existingCount * 86400000 * 30);
    const positionX = this.computeNodePositionX(baseDate);

    const shapeOptions: NodeShape[] = ['circle', 'diamond', 'star'];

    const node: TimelineNode = {
      id: uuidv4(),
      timelineId,
      title: data?.title || `事件 ${existingCount + 1}`,
      description: data?.description || '',
      date: baseDate,
      tags: data?.tags || [],
      shape: data?.shape || shapeOptions[existingCount % 3],
      positionX,
    };

    timeline.nodes.push(node);
    timeline.nodes.sort((a, b) => a.date - b.date);
    return node;
  }

  removeNode(nodeId: string): boolean {
    for (const timeline of this.timelines) {
      const idx = timeline.nodes.findIndex(n => n.id === nodeId);
      if (idx !== -1) {
        timeline.nodes.splice(idx, 1);
        return true;
      }
    }
    return false;
  }

  updateNode(nodeId: string, patch: Partial<TimelineNode>): TimelineNode | undefined {
    const result = this.getNodeById(nodeId);
    if (!result) return undefined;
    Object.assign(result.node, patch);
    if (patch.date !== undefined) {
      result.node.positionX = this.computeNodePositionX(patch.date);
    }
    result.timeline.nodes.sort((a, b) => a.date - b.date);
    return result.node;
  }

  computeNodePositionX(date: number): number {
    return (date - TIME_BASE_OFFSET) * TIME_PIXELS_PER_MS;
  }

  setViewport(patch: Partial<ViewportState>): void {
    if (patch.zoom !== undefined) {
      patch.zoom = clamp(patch.zoom, MIN_ZOOM, MAX_ZOOM);
    }
    this.viewport = { ...this.viewport, ...patch };
    this.viewport.centerTime = this.computeCenterTime();
  }

  computeCenterTime(): number {
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const centerScreenX = viewportWidth / 2;
    const worldX = this.screenToWorldX(centerScreenX);
    return TIME_BASE_OFFSET + worldX / TIME_PIXELS_PER_MS;
  }

  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: worldX * this.viewport.zoom + this.viewport.offsetX,
      y: worldY * this.viewport.zoom + this.viewport.offsetY,
    };
  }

  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: (screenX - this.viewport.offsetX) / this.viewport.zoom,
      y: (screenY - this.viewport.offsetY) / this.viewport.zoom,
    };
  }

  worldToScreenX(worldX: number): number {
    return worldX * this.viewport.zoom + this.viewport.offsetX;
  }

  screenToWorldX(screenX: number): number {
    return (screenX - this.viewport.offsetX) / this.viewport.zoom;
  }

  worldToScreenY(worldY: number): number {
    return worldY * this.viewport.zoom + this.viewport.offsetY;
  }

  screenToWorldY(screenY: number): number {
    return (screenY - this.viewport.offsetY) / this.viewport.zoom;
  }

  getBezierPath(
    x1: number, y1: number,
    x2: number, y2: number
  ): { path: string; controlPoints: { cp1x: number; cp1y: number; cp2x: number; cp2y: number } } {
    const dx = Math.abs(x2 - x1);
    const curveIntensity = Math.min(dx * 0.3, 80);
    const cp1x = x1 + curveIntensity;
    const cp1y = y1;
    const cp2x = x2 - curveIntensity;
    const cp2y = y2;
    const path = `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
    return { path, controlPoints: { cp1x, cp1y, cp2x, cp2y } };
  }

  hitTestNode(screenX: number, screenY: number): TimelineNode | null {
    const nodeSize = NODE_BASE_SIZE * this.viewport.zoom;
    const hitRadius = nodeSize * 1.2;

    for (const timeline of this.timelines) {
      for (const node of timeline.nodes) {
        const { x: sX, y: sY } = this.worldToScreen(node.positionX, timeline.yPosition);
        if (this.hitTestShape(screenX, screenY, sX, sY, node.shape, hitRadius)) {
          return node;
        }
      }
    }
    return null;
  }

  private hitTestShape(
    px: number, py: number,
    cx: number, cy: number,
    shape: NodeShape,
    radius: number
  ): boolean {
    const dx = px - cx;
    const dy = py - cy;

    switch (shape) {
      case 'circle':
        return dx * dx + dy * dy <= radius * radius;
      case 'diamond':
        return (Math.abs(dx) + Math.abs(dy)) <= radius * 1.2;
      case 'star':
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > radius * 1.3) return false;
        const angle = Math.atan2(dy, dx);
        const normalized = ((angle % (Math.PI * 2 / 5)) + Math.PI * 2 / 5) % (Math.PI * 2 / 5);
        const boundary = radius * (0.6 + 0.4 * Math.cos(5 * normalized));
        return dist <= boundary;
      default:
        return false;
    }
  }

  getViewportState(): ViewportState {
    return {
      offsetX: this.viewport.offsetX,
      offsetY: this.viewport.offsetY,
      zoom: this.viewport.zoom,
      centerTime: this.viewport.centerTime,
    };
  }

  setViewportState(state: ViewportState): void {
    this.viewport = { ...state };
    if (this.viewport.zoom) {
      this.viewport.zoom = clamp(this.viewport.zoom, MIN_ZOOM, MAX_ZOOM);
    }
  }

  exportSnapshot(): TimelineSnapshot {
    return {
      version: '1.0.0',
      exportedAt: Date.now(),
      timelines: JSON.parse(JSON.stringify(this.timelines)),
      viewport: { ...this.viewport },
    };
  }

  importSnapshot(snapshot: TimelineSnapshot): { success: boolean; error?: string } {
    try {
      if (!snapshot || !Array.isArray(snapshot.timelines)) {
        return { success: false, error: '无效的快照格式' };
      }
      this.timelines = JSON.parse(JSON.stringify(snapshot.timelines));
      this.timelineCounter = this.timelines.length;
      this.colorIndex = this.timelines.length;
      if (snapshot.viewport) {
        this.viewport = { ...snapshot.viewport };
        this.viewport.zoom = clamp(this.viewport.zoom, MIN_ZOOM, MAX_ZOOM);
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  }

  setTimelines(timelines: Timeline[]): void {
    this.timelines = timelines;
    this.timelineCounter = timelines.length;
    this.colorIndex = timelines.length;
  }

  getTotalNodes(): number {
    return this.timelines.reduce((sum, t) => sum + t.nodes.length, 0);
  }

  getAllNodes(): TimelineNode[] {
    return this.timelines.flatMap(t => t.nodes);
  }

  formatDate(timestamp: number): string {
    try {
      const d = new Date(timestamp);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '未知日期';
    }
  }
}
