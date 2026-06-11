import { Point, Stroke, ToolType } from './types';
import { eventBus } from './eventBus';

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 700;
const BG_COLOR = '#F5F0E8';
const STROKE_COLOR = '#3A3A3A';
const BASE_WIDTH = 3;
const MAX_WIDTH = 8;
const MIN_WIDTH = 1;
const SMOOTHING = 0.3;
const ERASER_HIT_DISTANCE = 10;

export class CanvasDrawing {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private bus: typeof eventBus;
  private strokes: Stroke[] = [];
  private currentStroke: Stroke | null = null;
  private isDrawing = false;
  private tool: ToolType = 'pencil';
  private lastSpeed = 0;
  private animFrameId: number | null = null;
  private pendingPoint: Point | null = null;

  constructor(canvas: HTMLCanvasElement, bus: typeof eventBus) {
    this.canvas = canvas;
    this.bus = bus;
    this.ctx = canvas.getContext('2d')!;
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
    this.fillBackground();
    this.bindEvents();
  }

  private fillBackground(): void {
    this.ctx.fillStyle = BG_COLOR;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private getCanvasPoint(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  private calculateSpeed(p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const dt = Math.max(p2.timestamp - p1.timestamp, 1);
    return dist / dt;
  }

  private smoothSpeed(current: number, previous: number): number {
    return previous * (1 - SMOOTHING) + current * SMOOTHING;
  }

  private speedToWidth(speed: number): number {
    const normalized = Math.min(speed / 2, 1);
    const width = MAX_WIDTH - normalized * (MAX_WIDTH - MIN_WIDTH);
    return Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, width));
  }

  private createPoint(x: number, y: number, prevPoint: Point | null): Point {
    const now = Date.now();
    const point: Point = { x, y, timestamp: now, speed: 0, pressure: 0 };
    if (prevPoint) {
      const rawSpeed = this.calculateSpeed(prevPoint, point);
      this.lastSpeed = this.smoothSpeed(rawSpeed, this.lastSpeed);
      point.speed = this.lastSpeed;
      const width = this.speedToWidth(this.lastSpeed);
      point.pressure = (width - MIN_WIDTH) / (MAX_WIDTH - MIN_WIDTH);
    } else {
      this.lastSpeed = 0;
    }
    return point;
  }

  private bindEvents(): void {
    this.canvas.addEventListener('mousedown', this.onPointerDown);
    this.canvas.addEventListener('mousemove', this.onPointerMove);
    this.canvas.addEventListener('mouseup', this.onPointerUp);
    this.canvas.addEventListener('mouseleave', this.onPointerUp);
    this.canvas.addEventListener('touchstart', this.onTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', this.onTouchMove, { passive: false });
    this.canvas.addEventListener('touchend', this.onTouchEnd);
  }

  private onPointerDown = (e: MouseEvent): void => {
    const pos = this.getCanvasPoint(e.clientX, e.clientY);
    this.handleDown(pos.x, pos.y);
  };

  private onPointerMove = (e: MouseEvent): void => {
    if (!this.isDrawing) return;
    const pos = this.getCanvasPoint(e.clientX, e.clientY);
    this.handleMove(pos.x, pos.y);
  };

  private onPointerUp = (): void => {
    this.handleUp();
  };

  private onTouchStart = (e: TouchEvent): void => {
    e.preventDefault();
    const touch = e.touches[0];
    const pos = this.getCanvasPoint(touch.clientX, touch.clientY);
    this.handleDown(pos.x, pos.y);
  };

  private onTouchMove = (e: TouchEvent): void => {
    e.preventDefault();
    if (!this.isDrawing) return;
    const touch = e.touches[0];
    const pos = this.getCanvasPoint(touch.clientX, touch.clientY);
    this.handleMove(pos.x, pos.y);
  };

  private onTouchEnd = (): void => {
    this.handleUp();
  };

  private handleDown(x: number, y: number): void {
    if (this.tool === 'eraser') {
      this.eraseAt(x, y);
      return;
    }
    this.isDrawing = true;
    this.lastSpeed = 0;
    const point = this.createPoint(x, y, null);
    this.currentStroke = {
      id: this.generateId(),
      points: [point],
      baseWidth: BASE_WIDTH,
      color: STROKE_COLOR,
    };
  }

  private handleMove(x: number, y: number): void {
    if (!this.currentStroke) return;
    const points = this.currentStroke.points;
    const prev = points[points.length - 1];
    const point = this.createPoint(x, y, prev);
    points.push(point);
    this.pendingPoint = point;
    if (this.animFrameId === null) {
      this.animFrameId = requestAnimationFrame(this.drawFrame);
    }
  }

  private drawFrame = (): void => {
    this.animFrameId = null;
    if (!this.currentStroke || !this.pendingPoint) return;
    const points = this.currentStroke.points;
    if (points.length < 2) return;
    const i = points.length - 1;
    const prev = points[i - 1];
    const curr = points[i];
    const width = this.speedToWidth(curr.speed || 0);
    this.drawSegment(prev, curr, this.currentStroke.color, width);
    this.pendingPoint = null;
  };

  private handleUp(): void {
    if (!this.isDrawing || !this.currentStroke) {
      this.isDrawing = false;
      return;
    }
    this.isDrawing = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.strokes.push(this.currentStroke);
    this.bus.emit('stroke:complete', this.currentStroke);
    this.currentStroke = null;
    this.redrawStrokes();
  }

  private drawSegment(from: Point, to: Point, color: string, width: number): void {
    this.ctx.beginPath();
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = width;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.moveTo(from.x, from.y);
    this.ctx.lineTo(to.x, to.y);
    this.ctx.stroke();
  }

  private drawStroke(stroke: Stroke): void {
    const points = stroke.points;
    if (points.length === 0) return;
    if (points.length === 1) {
      this.ctx.beginPath();
      this.ctx.fillStyle = stroke.color;
      this.ctx.arc(points[0].x, points[0].y, stroke.baseWidth / 2, 0, Math.PI * 2);
      this.ctx.fill();
      return;
    }
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const width = this.speedToWidth(curr.speed || 0);
      this.drawSegment(prev, curr, stroke.color, width);
    }
  }

  private eraseAt(x: number, y: number): void {
    for (let i = this.strokes.length - 1; i >= 0; i--) {
      const stroke = this.strokes[i];
      for (const pt of stroke.points) {
        const dx = pt.x - x;
        const dy = pt.y - y;
        if (dx * dx + dy * dy <= ERASER_HIT_DISTANCE * ERASER_HIT_DISTANCE) {
          const removed = this.strokes.splice(i, 1)[0];
          this.bus.emit('stroke:removed', removed.id);
          this.redrawStrokes();
          return;
        }
      }
    }
  }

  private generateId(): string {
    return `stroke_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  redrawStrokes(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.fillBackground();
    for (const stroke of this.strokes) {
      this.drawStroke(stroke);
    }
  }

  setTool(tool: ToolType): void {
    this.tool = tool;
  }

  getTool(): ToolType {
    return this.tool;
  }

  clearCanvas(): void {
    const overlay = document.createElement('canvas');
    overlay.width = this.canvas.width;
    overlay.height = this.canvas.height;
    const overlayCtx = overlay.getContext('2d')!;
    overlayCtx.fillStyle = '#FFFFFF';
    overlayCtx.fillRect(0, 0, overlay.width, overlay.height);
    overlayCtx.globalAlpha = 0;
    const startTime = performance.now();
    const duration = 300;
    const parent = this.canvas.parentNode;
    const sibling = this.canvas.nextSibling;
    if (parent) {
      parent.insertBefore(overlay, this.canvas);
    }
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      overlayCtx.globalAlpha = progress;
      overlayCtx.clearRect(0, 0, overlay.width, overlay.height);
      overlayCtx.fillStyle = '#FFFFFF';
      overlayCtx.fillRect(0, 0, overlay.width, overlay.height);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.strokes = [];
        this.redrawStrokes();
        if (parent) {
          parent.removeChild(overlay);
        }
        this.bus.emit('canvas:cleared');
      }
    };
    requestAnimationFrame(animate);
  }
}
