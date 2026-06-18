import type { Point, Stroke } from '@/store/useCanvasStore';

const DEFAULT_COLOR = '#1A237E';
const MIN_WIDTH = 2;
const MAX_WIDTH = 6;
const SMOOTHING_FACTOR = 0.3;

export class StrokeRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private dpr: number;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.dpr = window.devicePixelRatio || 1;
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  renderAll(
    strokes: Stroke[],
    currentPoints: Point[],
    zoom: number,
    offset: { x: number; y: number },
    selectedStrokeId: string | null,
    currentTool: string
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);

    this.drawBackground();
    this.drawGrid(zoom, offset);

    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(zoom, zoom);

    for (const stroke of strokes) {
      this.renderStroke(stroke, stroke.id === selectedStrokeId);
    }

    if (currentPoints.length >= 2 && currentTool === 'pen') {
      this.renderPoints(currentPoints, DEFAULT_COLOR, false);
    }

    ctx.restore();
    ctx.restore();
  }

  renderStroke(stroke: Stroke, selected: boolean): void {
    if (stroke.points.length < 2) return;

    if (selected) {
      const bounds = this.getStrokeBounds(stroke.points);
      const ctx = this.ctx;
      ctx.save();
      ctx.strokeStyle = '#3F51B5';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      const pad = 6;
      ctx.strokeRect(
        bounds.x - pad,
        bounds.y - pad,
        bounds.width + pad * 2,
        bounds.height + pad * 2
      );
      ctx.restore();
    }

    this.renderPoints(stroke.points, stroke.color, selected);
  }

  private renderPoints(
    points: Point[],
    color: string,
    selected: boolean
  ): void {
    if (points.length < 2) return;
    const ctx = this.ctx;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (selected) {
      ctx.shadowColor = '#3F51B5';
      ctx.shadowBlur = 4;
    }

    let prevMid = this.midpoint(points[0], points[1]);

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(prevMid.x, prevMid.y);

    for (let i = 1; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const mid = this.midpoint(curr, next);
      const width = this.computeWidth(points, i);

      ctx.lineWidth = width;
      ctx.quadraticCurveTo(curr.x, curr.y, mid.x, mid.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(mid.x, mid.y);
    }

    const last = points[points.length - 1];
    const prev = points[points.length - 2];
    const lastWidth = this.computeWidth(points, points.length - 1);
    ctx.lineWidth = lastWidth;
    ctx.quadraticCurveTo(prev.x, prev.y, last.x, last.y);
    ctx.stroke();

    ctx.restore();
  }

  private computeWidth(points: Point[], index: number): number {
    const point = points[index];
    if (point.pressure > 0 && point.pressure <= 1) {
      return MIN_WIDTH + (MAX_WIDTH - MIN_WIDTH) * point.pressure;
    }

    if (index > 0 && index < points.length) {
      const prev = points[index - 1];
      const dt = point.timestamp - prev.timestamp;
      if (dt > 0) {
        const dx = point.x - prev.x;
        const dy = point.y - prev.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speed = dist / dt;
        const normalizedSpeed = Math.min(speed / 2, 1);
        const width = MAX_WIDTH - (MAX_WIDTH - MIN_WIDTH) * normalizedSpeed;
        return Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, width));
      }
    }

    return (MIN_WIDTH + MAX_WIDTH) / 2;
  }

  private midpoint(a: Point, b: Point): Point {
    return {
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2,
      timestamp: 0,
      pressure: (a.pressure + b.pressure) / 2,
    };
  }

  private drawBackground(): void {
    const ctx = this.ctx;
    ctx.fillStyle = '#FDF5E6';
    ctx.fillRect(0, 0, this.width, this.height);
  }

  private drawGrid(
    zoom: number,
    offset: { x: number; y: number }
  ): void {
    const ctx = this.ctx;
    const gridSize = 20;
    const scaledGrid = gridSize * zoom;

    if (scaledGrid < 4) return;

    ctx.save();
    ctx.strokeStyle = '#E0E0E0';
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 0.5;

    const startX = offset.x % scaledGrid;
    const startY = offset.y % scaledGrid;

    ctx.beginPath();
    for (let x = startX; x < this.width; x += scaledGrid) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
    }
    for (let y = startY; y < this.height; y += scaledGrid) {
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
    }
    ctx.stroke();

    ctx.restore();
  }

  private getStrokeBounds(
    points: Point[]
  ): { x: number; y: number; width: number; height: number } {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  captureStrokeImage(
    strokes: Stroke[],
    padding: number = 20
  ): ImageData | null {
    if (strokes.length === 0) return null;

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const stroke of strokes) {
      for (const p of stroke.points) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      }
    }

    const x = Math.floor(minX - padding);
    const y = Math.floor(minY - padding);
    const w = Math.ceil(maxX - minX + padding * 2);
    const h = Math.ceil(maxY - minY + padding * 2);

    if (w <= 0 || h <= 0) return null;

    const offscreen = new OffscreenCanvas(w, h);
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return null;

    offCtx.fillStyle = '#FFFFFF';
    offCtx.fillRect(0, 0, w, h);
    offCtx.translate(-x, -y);

    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue;
      offCtx.strokeStyle = '#000000';
      offCtx.lineCap = 'round';
      offCtx.lineJoin = 'round';
      offCtx.lineWidth = 3;

      offCtx.beginPath();
      offCtx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        offCtx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      offCtx.stroke();
    }

    return offCtx.getImageData(0, 0, w, h);
  }

  hitTestStroke(
    strokes: Stroke[],
    x: number,
    y: number,
    threshold: number = 10
  ): string | null {
    for (let i = strokes.length - 1; i >= 0; i--) {
      const stroke = strokes[i];
      for (const p of stroke.points) {
        const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
        if (dist <= threshold) {
          return stroke.id;
        }
      }
    }
    return null;
  }
}
