import { Point, generateBezierControlPoints, bezierPoint, random, hexToRgba } from './utils';

const TRAIL_COLORS = ['#D4A76A', '#F0E6D3', '#A29BFE', '#B0BEC5'];
const TRAIL_DURATION = 2;
const SEGMENTS = 40;

export class StarTrail {
  public startPoint: Point;
  public p1: Point;
  public p2: Point;
  public p3: Point;
  public color: string;
  public lineWidth: number;
  public age: number;
  public duration: number;
  public alpha: number;
  public isDead: boolean;
  public points: Point[];

  constructor(startX: number, startY: number, trailLength: number = 100) {
    this.startPoint = { x: startX, y: startY };
    const controls = generateBezierControlPoints(this.startPoint, trailLength);
    this.p1 = controls.p1;
    this.p2 = controls.p2;
    this.p3 = controls.p3;
    this.color = TRAIL_COLORS[Math.floor(Math.random() * TRAIL_COLORS.length)];
    this.lineWidth = random(4, 12);
    this.age = 0;
    this.duration = TRAIL_DURATION;
    this.alpha = 0.9;
    this.isDead = false;
    this.points = this.generatePoints();
  }

  private generatePoints(): Point[] {
    const points: Point[] = [];
    for (let i = 0; i <= SEGMENTS; i++) {
      const t = i / SEGMENTS;
      points.push(bezierPoint(t, this.startPoint, this.p1, this.p2, this.p3));
    }
    return points;
  }

  public update(deltaTime: number): void {
    if (this.isDead) return;

    this.age += deltaTime;

    const progress = this.age / this.duration;
    if (progress >= 1) {
      this.isDead = true;
      this.alpha = 0;
      return;
    }

    this.alpha = 0.9 * (1 - progress);
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    if (this.isDead || this.alpha <= 0) return;

    const progress = this.age / this.duration;
    const visibleSegments = Math.floor(SEGMENTS * (1 - progress * 0.3));
    if (visibleSegments < 2) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.globalCompositeOperation = 'soft-light';
    for (let layer = 3; layer >= 1; layer--) {
      const layerWidth = this.lineWidth * (1 + layer * 0.5);
      const layerAlpha = this.alpha * 0.15 * (4 - layer);

      for (let i = 0; i < visibleSegments; i++) {
        const t = i / SEGMENTS;
        const p0 = this.points[i];
        const p1 = this.points[i + 1];

        const segmentProgress = t;
        const segmentAlpha = layerAlpha * (1 - segmentProgress * 0.6);
        const segmentWidth = layerWidth * (1 - segmentProgress * 0.75);

        if (segmentWidth < 1 || segmentAlpha < 0.005) continue;

        ctx.strokeStyle = hexToRgba(this.color, segmentAlpha);
        ctx.lineWidth = segmentWidth;

        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
      }
    }

    ctx.globalCompositeOperation = 'overlay';
    for (let i = 0; i < visibleSegments; i++) {
      const t = i / SEGMENTS;
      const p0 = this.points[i];
      const p1 = this.points[i + 1];

      const segmentProgress = t;
      const segmentAlpha = this.alpha * (1 - segmentProgress * 0.7);
      const segmentWidth = this.lineWidth * (1 - segmentProgress * 0.8);

      if (segmentWidth < 0.5 || segmentAlpha < 0.01) continue;

      ctx.strokeStyle = hexToRgba(this.color, segmentAlpha);
      ctx.lineWidth = segmentWidth;

      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
    }

    if (visibleSegments > 0) {
      const headPoint = this.points[0];
      const headSize = this.lineWidth * 0.6;
      const headAlpha = this.alpha * 0.8;

      ctx.globalCompositeOperation = 'soft-light';
      const headGlow = ctx.createRadialGradient(
        headPoint.x, headPoint.y, 0,
        headPoint.x, headPoint.y, headSize * 2
      );
      headGlow.addColorStop(0, hexToRgba('#FFFFFF', headAlpha * 0.8));
      headGlow.addColorStop(0.5, hexToRgba(this.color, headAlpha * 0.5));
      headGlow.addColorStop(1, hexToRgba(this.color, 0));

      ctx.fillStyle = headGlow;
      ctx.beginPath();
      ctx.arc(headPoint.x, headPoint.y, headSize * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
