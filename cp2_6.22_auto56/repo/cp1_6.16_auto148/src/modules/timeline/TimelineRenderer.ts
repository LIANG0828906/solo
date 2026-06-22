import {
  TimelineEngine,
  Timeline,
  TimelineNode,
  NodeShape,
  NODE_BASE_SIZE,
} from './TimelineEngine';

export interface RendererCallbacks {
  onNodeClick?: (node: TimelineNode) => void;
  onNodeDoubleClick?: (node: TimelineNode) => void;
  onNodeHover?: (node: TimelineNode | null, screenX?: number, screenY?: number) => void;
  onPan?: (deltaX: number, deltaY: number) => void;
  onZoom?: (delta: number, centerX: number, centerY: number) => void;
  onCanvasDragEnd?: () => void;
}

export interface ThemeColors {
  background: string;
  text: string;
  textSecondary: string;
  gridLine: string;
}

export class TimelineRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private engine: TimelineEngine;
  private callbacks: RendererCallbacks;
  private dpr: number;
  private rafId: number | null = null;
  private isDirty = false;

  private isDragging = false;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private dragStartX = 0;
  private dragStartY = 0;
  private hasDragged = false;
  private hoveredNodeId: string | null = null;
  private pinchStartDistance = 0;
  private pinchStartZoom = 1;
  private pinchCenter = { x: 0, y: 0 };

  private theme: ThemeColors = {
    background: '#FFFFFF',
    text: '#1E1E2E',
    textSecondary: '#6C7086',
    gridLine: 'rgba(0, 0, 0, 0.06)',
  };

  private readonly PASSIVE_OPTIONS: AddEventListenerOptions = { passive: true };

  constructor(canvas: HTMLCanvasElement, engine: TimelineEngine, callbacks: RendererCallbacks = {}) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    this.ctx = ctx;
    this.engine = engine;
    this.callbacks = callbacks;
    this.dpr = window.devicePixelRatio || 1;

    this.setupCanvas();
    this.bindEvents();
    this.requestRender();
  }

  setTheme(theme: ThemeColors): void {
    this.theme = theme;
    this.requestRender();
  }

  setHoveredNode(nodeId: string | null): void {
    this.hoveredNodeId = nodeId;
    this.requestRender();
  }

  requestRender(): void {
    this.isDirty = true;
    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(() => this.renderFrame());
    }
  }

  resize(): void {
    this.setupCanvas();
    this.requestRender();
  }

  private setupCanvas(): void {
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    this.canvas.width = Math.floor(width * this.dpr);
    this.canvas.height = Math.floor(height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  private bindEvents(): void {
    this.canvas.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);
    this.canvas.addEventListener('wheel', this.onWheel, this.PASSIVE_OPTIONS);
    this.canvas.addEventListener('dblclick', this.onDoubleClick);
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    this.canvas.addEventListener('touchstart', this.onTouchStart, this.PASSIVE_OPTIONS);
    this.canvas.addEventListener('touchmove', this.onTouchMove, this.PASSIVE_OPTIONS);
    this.canvas.addEventListener('touchend', this.onTouchEnd, this.PASSIVE_OPTIONS);
  }

  destroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.canvas.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
    this.canvas.removeEventListener('wheel', this.onWheel);
    this.canvas.removeEventListener('dblclick', this.onDoubleClick);
    this.canvas.removeEventListener('touchstart', this.onTouchStart);
    this.canvas.removeEventListener('touchmove', this.onTouchMove);
    this.canvas.removeEventListener('touchend', this.onTouchEnd);
  }

  private onMouseDown = (e: MouseEvent): void => {
    this.isDragging = true;
    this.hasDragged = false;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    this.canvas.classList.add('canvas-dragging');
  };

  private onMouseMove = (e: MouseEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;

    if (this.isDragging) {
      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;
      if (Math.abs(dx) + Math.abs(dy) > 3) {
        this.hasDragged = true;
      }
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      if (this.callbacks.onPan) {
        this.callbacks.onPan(dx, dy);
      }
    } else {
      const hitNode = this.engine.hitTestNode(canvasX, canvasY);
      const newHoveredId = hitNode ? hitNode.id : null;
      if (newHoveredId !== this.hoveredNodeId) {
        this.hoveredNodeId = newHoveredId;
        this.requestRender();
        if (this.callbacks.onNodeHover) {
          this.callbacks.onNodeHover(hitNode, e.clientX, e.clientY);
        }
      }
    }
  };

  private onMouseUp = (e: MouseEvent): void => {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.canvas.classList.remove('canvas-dragging');

    if (!this.hasDragged) {
      const rect = this.canvas.getBoundingClientRect();
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;
      const hitNode = this.engine.hitTestNode(canvasX, canvasY);
      if (hitNode && this.callbacks.onNodeClick) {
        this.callbacks.onNodeClick(hitNode);
      }
    }

    if (this.callbacks.onCanvasDragEnd) {
      this.callbacks.onCanvasDragEnd();
    }
  };

  private onDoubleClick = (e: MouseEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;
    const hitNode = this.engine.hitTestNode(canvasX, canvasY);
    if (hitNode && this.callbacks.onNodeDoubleClick) {
      this.callbacks.onNodeDoubleClick(hitNode);
    }
  };

  private onWheel = (e: WheelEvent): void => {
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const rect = this.canvas.getBoundingClientRect();
    const centerX = e.clientX - rect.left;
    const centerY = e.clientY - rect.top;
    if (this.callbacks.onZoom) {
      this.callbacks.onZoom(delta, centerX, centerY);
    }
  };

  private onTouchStart = (e: TouchEvent): void => {
    if (e.touches.length === 1) {
      this.isDragging = true;
      this.hasDragged = false;
      this.lastMouseX = e.touches[0].clientX;
      this.lastMouseY = e.touches[0].clientY;
      this.dragStartX = e.touches[0].clientX;
      this.dragStartY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      this.isDragging = false;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      this.pinchStartDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      this.pinchStartZoom = this.engine.getViewport().zoom;
      this.pinchCenter = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      };
    }
  };

  private onTouchMove = (e: TouchEvent): void => {
    if (e.touches.length === 1 && this.isDragging) {
      const dx = e.touches[0].clientX - this.lastMouseX;
      const dy = e.touches[0].clientY - this.lastMouseY;
      if (Math.abs(dx) + Math.abs(dy) > 3) {
        this.hasDragged = true;
      }
      this.lastMouseX = e.touches[0].clientX;
      this.lastMouseY = e.touches[0].clientY;
      if (this.callbacks.onPan) {
        this.callbacks.onPan(dx, dy);
      }
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const scale = dist / this.pinchStartDistance;
      const targetZoom = this.pinchStartZoom * scale;
      const delta = targetZoom - this.engine.getViewport().zoom;
      const rect = this.canvas.getBoundingClientRect();
      if (this.callbacks.onZoom) {
        this.callbacks.onZoom(delta, this.pinchCenter.x - rect.left, this.pinchCenter.y - rect.top);
      }
    }
  };

  private onTouchEnd = (e: TouchEvent): void => {
    if (e.touches.length === 0 && this.isDragging) {
      this.isDragging = false;
      if (!this.hasDragged && this.callbacks.onNodeClick) {
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = this.dragStartX - rect.left;
        const canvasY = this.dragStartY - rect.top;
        const hitNode = this.engine.hitTestNode(canvasX, canvasY);
        if (hitNode) {
          this.callbacks.onNodeClick(hitNode);
        }
      }
    }
  };

  private renderFrame(): void {
    this.rafId = null;
    if (!this.isDirty) return;
    this.isDirty = false;

    const t0 = performance.now();
    this.render();
    const elapsed = performance.now() - t0;
    if (elapsed > 40) {
      console.warn(`[TimelineRenderer] 渲染耗时: ${elapsed.toFixed(1)}ms`);
    }
  }

  private render(): void {
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    this.ctx.fillStyle = this.theme.background;
    this.ctx.fillRect(0, 0, width, height);

    this.drawGrid(width, height);

    const timelines = this.engine.getTimelines();
    for (const timeline of timelines) {
      this.drawTimelineConnections(timeline, width);
    }

    for (const timeline of timelines) {
      this.drawTimelineLabel(timeline);
      this.drawTimelineNodes(timeline, width);
    }
  }

  private drawGrid(width: number, height: number): void {
    const viewport = this.engine.getViewport();
    const zoom = viewport.zoom;
    this.ctx.strokeStyle = this.theme.gridLine;
    this.ctx.lineWidth = 1;

    let gridSpacing = 100 * zoom;
    while (gridSpacing < 40) gridSpacing *= 2;
    while (gridSpacing > 160) gridSpacing /= 2;

    const offsetX = ((viewport.offsetX % gridSpacing) + gridSpacing) % gridSpacing;
    const offsetY = ((viewport.offsetY % gridSpacing) + gridSpacing) % gridSpacing;

    this.ctx.beginPath();
    for (let x = offsetX; x < width; x += gridSpacing) {
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
    }
    for (let y = offsetY; y < height; y += gridSpacing) {
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
    }
    this.ctx.stroke();
  }

  private drawTimelineConnections(timeline: Timeline, viewportWidth: number): void {
    if (timeline.nodes.length < 2) return;

    const nodes = [...timeline.nodes].sort((a, b) => a.date - b.date);
    const viewport = this.engine.getViewport();
    const margin = 100;

    this.ctx.strokeStyle = timeline.color;
    this.ctx.lineWidth = 2.5 * Math.max(0.6, viewport.zoom);
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    for (let i = 0; i < nodes.length - 1; i++) {
      const n1 = nodes[i];
      const n2 = nodes[i + 1];

      const s1 = this.engine.worldToScreen(n1.positionX, timeline.yPosition);
      const s2 = this.engine.worldToScreen(n2.positionX, timeline.yPosition);

      if (s1.x < -margin && s2.x < -margin) continue;
      if (s1.x > viewportWidth + margin && s2.x > viewportWidth + margin) continue;

      const { controlPoints } = this.engine.getBezierPath(
        s1.x, s1.y, s2.x, s2.y
      );

      this.ctx.beginPath();
      this.ctx.moveTo(s1.x, s1.y);
      this.ctx.bezierCurveTo(
        controlPoints.cp1x, controlPoints.cp1y,
        controlPoints.cp2x, controlPoints.cp2y,
        s2.x, s2.y
      );
      this.ctx.globalAlpha = 0.6;
      this.ctx.stroke();
      this.ctx.globalAlpha = 1;
    }
  }

  private drawTimelineLabel(timeline: Timeline): void {
    const viewport = this.engine.getViewport();
    const y = timeline.yPosition * viewport.zoom + viewport.offsetY;

    if (y < -50 || y > this.canvas.getBoundingClientRect().height + 50) return;

    this.ctx.save();
    this.ctx.font = `${600} ${13 * Math.max(0.8, viewport.zoom)}px -apple-system, BlinkMacSystemFont, sans-serif`;
    this.ctx.fillStyle = timeline.color;
    this.ctx.textBaseline = 'middle';

    const labelX = 20;
    this.ctx.beginPath();
    this.ctx.arc(labelX, y, 6 * Math.max(0.8, viewport.zoom), 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = this.theme.text;
    this.ctx.fillText(timeline.title, labelX + 16, y);
    this.ctx.restore();
  }

  private drawTimelineNodes(timeline: Timeline, viewportWidth: number): void {
    const margin = 60;
    for (const node of timeline.nodes) {
      const { x: sX, y: sY } = this.engine.worldToScreen(node.positionX, timeline.yPosition);

      if (sX < -margin || sX > viewportWidth + margin) continue;
      if (sY < -margin || sY > this.canvas.getBoundingClientRect().height + margin) continue;

      const isHovered = this.hoveredNodeId === node.id;
      this.drawNode(sX, sY, node.shape, timeline.color, isHovered);
    }
  }

  private drawNode(
    x: number, y: number,
    shape: NodeShape,
    color: string,
    isHovered: boolean
  ): void {
    const viewport = this.engine.getViewport();
    const baseSize = NODE_BASE_SIZE * viewport.zoom;
    const size = isHovered ? baseSize * 1.3 : baseSize;

    this.ctx.save();
    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = isHovered ? 16 : 8;

    this.ctx.fillStyle = color;
    this.ctx.beginPath();

    switch (shape) {
      case 'circle':
        this.ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        break;
      case 'diamond':
        this.drawDiamond(x, y, size);
        break;
      case 'star':
        this.drawStar(x, y, size / 2, size / 4.5, 5);
        break;
    }

    this.ctx.fill();

    this.ctx.shadowBlur = 0;
    this.ctx.strokeStyle = this.theme.background;
    this.ctx.lineWidth = 2.5;
    this.ctx.stroke();

    if (isHovered) {
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 1.5;
      this.ctx.setLineDash([4, 3]);
      this.ctx.beginPath();
      this.ctx.arc(x, y, size / 2 + 8, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    }

    this.ctx.restore();
  }

  private drawDiamond(cx: number, cy: number, size: number): void {
    const half = size / 2;
    this.ctx.moveTo(cx, cy - half);
    this.ctx.lineTo(cx + half, cy);
    this.ctx.lineTo(cx, cy + half);
    this.ctx.lineTo(cx - half, cy);
    this.ctx.closePath();
  }

  private drawStar(
    cx: number, cy: number,
    outerR: number, innerR: number,
    points: number
  ): void {
    const step = Math.PI / points;
    let rotation = -Math.PI / 2;

    this.ctx.moveTo(
      cx + Math.cos(rotation) * outerR,
      cy + Math.sin(rotation) * outerR
    );

    for (let i = 0; i < points; i++) {
      rotation += step;
      this.ctx.lineTo(
        cx + Math.cos(rotation) * innerR,
        cy + Math.sin(rotation) * innerR
      );
      rotation += step;
      this.ctx.lineTo(
        cx + Math.cos(rotation) * outerR,
        cy + Math.sin(rotation) * outerR
      );
    }
    this.ctx.closePath();
  }

  getCanvasSize(): { width: number; height: number } {
    const rect = this.canvas.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }
}
