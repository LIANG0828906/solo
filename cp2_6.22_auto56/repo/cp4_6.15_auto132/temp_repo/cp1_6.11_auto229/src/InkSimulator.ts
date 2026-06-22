export interface StrokePoint {
  x: number;
  y: number;
  timestamp: number;
}

export interface Stroke {
  points: StrokePoint[];
  inkDensity: number;
  brushSize: number;
}

interface InterpolatedPoint {
  x: number;
  y: number;
  speed: number;
}

const INK_COLORS = ['#0A0A0A', '#1E1E1E', '#333333', '#505050', '#707070'];
const BRUSH_RADII = [1, 2, 3];

export class InkSimulator {
  private ctx: CanvasRenderingContext2D;
  private strokes: Stroke[] = [];
  private currentStroke: Stroke | null = null;
  private inkDensity: number = 0;
  private brushSize: number = 1;
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;
  private width: number;
  private height: number;

  constructor(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.width = canvas.width;
    this.height = canvas.height;
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = this.width;
    this.offscreenCanvas.height = this.height;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d')!;
  }

  startStroke(x: number, y: number): void {
    this.currentStroke = {
      points: [{ x, y, timestamp: performance.now() }],
      inkDensity: this.inkDensity,
      brushSize: this.brushSize
    };
  }

  continueStroke(x: number, y: number): void {
    if (!this.currentStroke) return;
    const last = this.currentStroke.points[this.currentStroke.points.length - 1];
    const dx = x - last.x;
    const dy = y - last.y;
    if (dx * dx + dy * dy < 1) return;
    this.currentStroke.points.push({ x, y, timestamp: performance.now() });
  }

  endStroke(): void {
    if (!this.currentStroke || this.currentStroke.points.length < 2) {
      this.currentStroke = null;
      return;
    }
    this.renderStrokeToOffscreen(this.currentStroke);
    this.strokes.push(this.currentStroke);
    this.currentStroke = null;
  }

  private renderStrokeToOffscreen(stroke: Stroke): void {
    this.renderStrokeOnCtx(this.offscreenCtx, stroke);
  }

  private renderStrokeOnCtx(ctx: CanvasRenderingContext2D, stroke: Stroke): void {
    const points = stroke.points;
    if (points.length < 2) return;

    const inkColor = INK_COLORS[stroke.inkDensity];
    const baseRadius = BRUSH_RADII[stroke.brushSize];

    const speeds = this.calculateSpeeds(points);
    const maxSpeed = Math.max(...speeds, 0.001);
    const interpolated = this.interpolatePoints(points, speeds);

    for (let i = 0; i < interpolated.length; i++) {
      const pt = interpolated[i];
      const normalizedSpeed = Math.min(pt.speed / maxSpeed, 1);
      const pressure = 1 - normalizedSpeed * 0.6;

      if (normalizedSpeed > 0.65 && Math.random() < (normalizedSpeed - 0.65) * 2.5) {
        continue;
      }

      const startFade = Math.min(i / 8, 1);
      const endFade = Math.min((interpolated.length - 1 - i) / 8, 1);
      const fadeFactor = Math.min(startFade, endFade);

      const radius = baseRadius * (0.35 + 0.65 * pressure) * (0.5 + 0.5 * fadeFactor);
      const opacity = (0.3 + 0.7 * pressure) * (0.5 + 0.5 * fadeFactor);

      ctx.beginPath();
      ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = inkColor;
      ctx.globalAlpha = opacity;
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  drawCurrentStroke(): void {
    if (!this.currentStroke || this.currentStroke.points.length < 2) return;
    this.renderStrokeOnCtx(this.ctx, this.currentStroke);
  }

  drawCompletedStrokes(): void {
    this.ctx.drawImage(this.offscreenCanvas, 0, 0);
  }

  private calculateSpeeds(points: StrokePoint[]): number[] {
    const speeds: number[] = [0];
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      const dt = Math.max(points[i].timestamp - points[i - 1].timestamp, 1);
      speeds.push(Math.sqrt(dx * dx + dy * dy) / dt);
    }
    return speeds;
  }

  private interpolatePoints(points: StrokePoint[], speeds: number[]): InterpolatedPoint[] {
    const result: InterpolatedPoint[] = [];
    const spacing = 1.5;

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const steps = Math.max(Math.ceil(dist / spacing), 1);
      const avgSpeed = (speeds[i] + speeds[i + 1]) / 2;

      for (let j = 0; j < steps; j++) {
        const t = j / steps;
        result.push({
          x: p1.x + dx * t,
          y: p1.y + dy * t,
          speed: avgSpeed
        });
      }
    }

    const last = points[points.length - 1];
    result.push({ x: last.x, y: last.y, speed: speeds[speeds.length - 1] });
    return result;
  }

  getStrokes(): Stroke[] {
    return this.strokes;
  }

  clear(): void {
    this.strokes = [];
    this.currentStroke = null;
    this.offscreenCtx.clearRect(0, 0, this.width, this.height);
  }

  setInkDensity(level: number): void {
    this.inkDensity = level;
  }

  setBrushSize(size: number): void {
    this.brushSize = size;
  }

  isDrawing(): boolean {
    return this.currentStroke !== null;
  }

  getInkColor(): string {
    return INK_COLORS[this.inkDensity];
  }

  renderAllStrokesOnCtx(ctx: CanvasRenderingContext2D): void {
    for (const stroke of this.strokes) {
      this.renderStrokeOnCtx(ctx, stroke);
    }
  }
}
