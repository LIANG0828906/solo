import type { Point, PathBounds } from './DataModel';

export class StrokeToPath {
  private simplifyThreshold: number;
  private smoothingFactor: number;

  constructor(threshold = 2, smoothingFactor = 0.25) {
    this.simplifyThreshold = threshold;
    this.smoothingFactor = smoothingFactor;
  }

  processPoints(points: Point[]): {
    simplifiedPoints: Point[];
    pathString: string;
    bounds: PathBounds;
  } {
    const t0 = performance.now();

    if (points.length === 0) {
      return {
        simplifiedPoints: [],
        pathString: '',
        bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0, centerX: 0, centerY: 0 }
      };
    }

    if (points.length === 1) {
      const p = points[0];
      const r = 2.5;
      return {
        simplifiedPoints: [p],
        pathString: `M ${p.x} ${p.y} m -${r} 0 a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 -${r * 2} 0`,
        bounds: {
          minX: p.x - r, minY: p.y - r,
          maxX: p.x + r, maxY: p.y + r,
          width: r * 2, height: r * 2,
          centerX: p.x, centerY: p.y
        }
      };
    }

    const filteredPoints = this.filterClosePoints(points, 0.5);

    if (filteredPoints.length < 2) {
      const p = filteredPoints[0] || points[0];
      return {
        simplifiedPoints: [p],
        pathString: `M ${p.x} ${p.y} L ${p.x + 0.5} ${p.y + 0.5}`,
        bounds: {
          minX: p.x, minY: p.y,
          maxX: p.x + 0.5, maxY: p.y + 0.5,
          width: 0.5, height: 0.5,
          centerX: p.x, centerY: p.y
        }
      };
    }

    const simplifiedPoints = this.ramerDouglasPeucker(filteredPoints, this.simplifyThreshold);

    if (simplifiedPoints.length < 2) {
      const p = simplifiedPoints[0] || points[0];
      return {
        simplifiedPoints: [p],
        pathString: `M ${p.x} ${p.y} L ${p.x + 0.5} ${p.y + 0.5}`,
        bounds: {
          minX: p.x, minY: p.y,
          maxX: p.x + 0.5, maxY: p.y + 0.5,
          width: 0.5, height: 0.5,
          centerX: p.x, centerY: p.y
        }
      };
    }

    if (simplifiedPoints.length === 2) {
      const [p1, p2] = simplifiedPoints;
      const minX = Math.min(p1.x, p2.x) - 2;
      const minY = Math.min(p1.y, p2.y) - 2;
      const maxX = Math.max(p1.x, p2.x) + 2;
      const maxY = Math.max(p1.y, p2.y) + 2;
      return {
        simplifiedPoints,
        pathString: `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} L ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
        bounds: {
          minX, minY, maxX, maxY,
          width: Math.max(1, maxX - minX),
          height: Math.max(1, maxY - minY),
          centerX: (minX + maxX) / 2,
          centerY: (minY + maxY) / 2
        }
      };
    }

    const pathString = this.fitCubicBezier(simplifiedPoints);
    const bounds = this.calculateBounds(points);

    const t1 = performance.now();
    if (t1 - t0 > 80) {
      console.warn(`StrokeToPath processing took ${(t1 - t0).toFixed(1)}ms, near threshold`);
    }

    return { simplifiedPoints, pathString, bounds };
  }

  private filterClosePoints(points: Point[], minDist: number): Point[] {
    if (points.length < 2) return [...points];
    const result: Point[] = [points[0]];
    for (let i = 1; i < points.length; i++) {
      const last = result[result.length - 1];
      const d = Math.hypot(points[i].x - last.x, points[i].y - last.y);
      if (d >= minDist) {
        result.push(points[i]);
      }
    }
    if (result.length < 2 && points.length >= 2) {
      return [points[0], points[points.length - 1]];
    }
    return result;
  }

  private ramerDouglasPeucker(points: Point[], epsilon: number): Point[] {
    if (points.length <= 2) return [...points];
    if (epsilon <= 0) return [...points];

    let maxDist = 0;
    let maxIndex = 0;
    const end = points.length - 1;

    for (let i = 1; i < end; i++) {
      const d = this.perpendicularDistance(points[i], points[0], points[end]);
      if (d > maxDist) {
        maxDist = d;
        maxIndex = i;
      }
    }

    if (maxDist > epsilon) {
      const rec1 = this.ramerDouglasPeucker(points.slice(0, maxIndex + 1), epsilon);
      const rec2 = this.ramerDouglasPeucker(points.slice(maxIndex), epsilon);
      return rec1.slice(0, -1).concat(rec2);
    } else {
      return [points[0], points[end]];
    }
  }

  private perpendicularDistance(p: Point, p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const magSq = dx * dx + dy * dy;
    if (magSq === 0) return Math.hypot(p.x - p1.x, p.y - p1.y);
    const t = Math.max(0, Math.min(1, ((p.x - p1.x) * dx + (p.y - p1.y) * dy) / magSq));
    const projX = p1.x + t * dx;
    const projY = p1.y + t * dy;
    return Math.hypot(p.x - projX, p.y - projY);
  }

  private fitCubicBezier(points: Point[]): string {
    if (points.length < 2) return '';

    let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

    if (points.length === 2) {
      return d + ` L ${points[1].x.toFixed(2)} ${points[1].y.toFixed(2)}`;
    }

    for (let i = 0; i < points.length - 1; i++) {
      const prev = i > 0 ? points[i - 1] : points[i];
      const curr = points[i];
      const next = points[i + 1];
      const nextNext = i < points.length - 2 ? points[i + 2] : next;

      const { cp1, cp2 } = this.computeControlPoints(prev, curr, next, nextNext);

      d += ` C ${cp1.x.toFixed(2)} ${cp1.y.toFixed(2)}, ${cp2.x.toFixed(2)} ${cp2.y.toFixed(2)}, ${next.x.toFixed(2)} ${next.y.toFixed(2)}`;
    }

    return d;
  }

  private computeControlPoints(
    p0: Point,
    p1: Point,
    p2: Point,
    p3: Point
  ): { cp1: Point; cp2: Point } {
    const d01 = Math.hypot(p1.x - p0.x, p1.y - p0.y);
    const d12 = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const d23 = Math.hypot(p3.x - p2.x, p3.y - p2.y);

    const smoothing = this.smoothingFactor;

    const fa = (smoothing * d01) / Math.max(1, d01 + d12);
    const fb = (smoothing * d12) / Math.max(1, d01 + d12);
    const fc = (smoothing * d12) / Math.max(1, d12 + d23);
    const fd = (smoothing * d23) / Math.max(1, d12 + d23);

    const dx1 = p1.x - p0.x;
    const dy1 = p1.y - p0.y;
    const dx2 = p2.x - p1.x;
    const dy2 = p2.y - p1.y;
    const dx3 = p3.x - p2.x;
    const dy3 = p3.y - p2.y;

    const cp1x = p1.x + fa * dx2 - fb * dx1;
    const cp1y = p1.y + fa * dy2 - fb * dy1;
    const cp2x = p2.x - fc * dx3 + fd * dx2;
    const cp2y = p2.y - fc * dy3 + fd * dy2;

    return {
      cp1: { x: cp1x, y: cp1y },
      cp2: { x: cp2x, y: cp2y }
    };
  }

  private calculateBounds(points: Point[]): PathBounds {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    const padding = 6;
    minX -= padding; minY -= padding; maxX += padding; maxY += padding;
    const width = Math.max(2, maxX - minX);
    const height = Math.max(2, maxY - minY);
    return {
      minX, minY, maxX, maxY, width, height,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2
    };
  }

  static createQuickSVGPath(points: Point[]): string {
    if (points.length < 2) return '';
    let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x.toFixed(1)} ${points[i].y.toFixed(1)}`;
    }
    return d;
  }
}
