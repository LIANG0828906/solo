import type { Point } from './DataModel';

export class StrokeToPath {
  private simplifyThreshold: number;

  constructor(threshold = 2) {
    this.simplifyThreshold = threshold;
  }

  processPoints(points: Point[]): {
    simplifiedPoints: Point[];
    pathString: string;
    bounds: { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number; centerX: number; centerY: number };
  } {
    if (points.length === 0) {
      return {
        simplifiedPoints: [],
        pathString: '',
        bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0, centerX: 0, centerY: 0 }
      };
    }

    if (points.length === 1) {
      const p = points[0];
      const r = 2;
      return {
        simplifiedPoints: [p],
        pathString: `M ${p.x} ${p.y} m -${r} 0 a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 -${r * 2} 0`,
        bounds: { minX: p.x - r, minY: p.y - r, maxX: p.x + r, maxY: p.y + r, width: r * 2, height: r * 2, centerX: p.x, centerY: p.y }
      };
    }

    const simplifiedPoints = this.ramerDouglasPeucker(points, this.simplifyThreshold);

    if (simplifiedPoints.length < 2) {
      const p = points[0];
      return {
        simplifiedPoints: [p],
        pathString: `M ${p.x} ${p.y} L ${p.x + 0.1} ${p.y + 0.1}`,
        bounds: { minX: p.x, minY: p.y, maxX: p.x + 0.1, maxY: p.y + 0.1, width: 0.1, height: 0.1, centerX: p.x, centerY: p.y }
      };
    }

    if (simplifiedPoints.length === 2) {
      const [p1, p2] = simplifiedPoints;
      const minX = Math.min(p1.x, p2.x);
      const minY = Math.min(p1.y, p2.y);
      const maxX = Math.max(p1.x, p2.x);
      const maxY = Math.max(p1.y, p2.y);
      return {
        simplifiedPoints,
        pathString: `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`,
        bounds: { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY, centerX: (minX + maxX) / 2, centerY: (minY + maxY) / 2 }
      };
    }

    const pathString = this.generateBezierPath(simplifiedPoints);
    const bounds = this.calculateBounds(simplifiedPoints);

    return { simplifiedPoints, pathString, bounds };
  }

  private ramerDouglasPeucker(points: Point[], epsilon: number): Point[] {
    if (points.length < 3) return [...points];

    const dmax = { value: 0 };
    const index = { value: 0 };
    const end = points.length - 1;

    for (let i = 1; i < end; i++) {
      const d = this.perpendicularDistance(points[i], points[0], points[end]);
      if (d > dmax.value) {
        dmax.value = d;
        index.value = i;
      }
    }

    if (dmax.value > epsilon) {
      const rec1 = this.ramerDouglasPeucker(points.slice(0, index.value + 1), epsilon);
      const rec2 = this.ramerDouglasPeucker(points.slice(index.value), epsilon);
      return rec1.slice(0, -1).concat(rec2);
    } else {
      return [points[0], points[end]];
    }
  }

  private perpendicularDistance(p: Point, p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const mag = Math.sqrt(dx * dx + dy * dy);
    if (mag === 0) return Math.sqrt((p.x - p1.x) ** 2 + (p.y - p1.y) ** 2);
    const u = ((p.x - p1.x) * dx + (p.y - p1.y) * dy) / (mag * mag);
    const ix = p1.x + u * dx;
    const iy = p1.y + u * dy;
    return Math.sqrt((p.x - ix) ** 2 + (p.y - iy) ** 2);
  }

  private generateBezierPath(points: Point[]): string {
    if (points.length < 2) return '';

    let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

    if (points.length === 2) {
      path += ` L ${points[1].x.toFixed(2)} ${points[1].y.toFixed(2)}`;
      return path;
    }

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i < points.length - 2 ? points[i + 2] : p2;

      const cp1 = this.calculateControlPoint(p0, p1, p2, true);
      const cp2 = this.calculateControlPoint(p1, p2, p3, false);

      path += ` C ${cp1.x.toFixed(2)} ${cp1.y.toFixed(2)}, ${cp2.x.toFixed(2)} ${cp2.y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
    }

    return path;
  }

  private calculateControlPoint(p0: Point, p1: Point, p2: Point, isStart: boolean): Point {
    const smoothing = 0.2;

    const d01 = Math.sqrt((p1.x - p0.x) ** 2 + (p1.y - p0.y) ** 2);
    const d12 = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);

    const dTotal = d01 + d12;
    if (dTotal === 0) return { x: p1.x, y: p1.y };

    const fa = (smoothing * d01) / dTotal;
    const fb = (smoothing * d12) / dTotal;

    if (isStart) {
      return {
        x: p1.x - fa * (p2.x - p0.x),
        y: p1.y - fa * (p2.y - p0.y)
      };
    } else {
      return {
        x: p1.x + fb * (p2.x - p0.x),
        y: p1.y + fb * (p2.y - p0.y)
      };
    }
  }

  private calculateBounds(points: Point[]): {
    minX: number; minY: number; maxX: number; maxY: number;
    width: number; height: number; centerX: number; centerY: number;
  } {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    const padding = 5;
    minX -= padding; minY -= padding; maxX += padding; maxY += padding;
    const width = Math.max(1, maxX - minX);
    const height = Math.max(1, maxY - minY);
    return {
      minX, minY, maxX, maxY, width, height,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2
    };
  }
}
