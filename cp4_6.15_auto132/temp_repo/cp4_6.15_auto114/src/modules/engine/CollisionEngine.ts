import type { Point, CollisionPolygon } from '@/store/mapStore';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CollisionResult {
  collided: boolean;
  direction?: 'top' | 'bottom' | 'left' | 'right';
  overlap?: number;
  normal?: Point;
}

export class CollisionEngine {
  static pointInPolygon(point: Point, polygon: Point[]): boolean {
    if (polygon.length < 3) return false;
    
    let inside = false;
    const n = polygon.length;
    
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      
      if (((yi > point.y) !== (yj > point.y)) &&
          (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    
    return inside;
  }

  static lineIntersectsLine(
    p1: Point, p2: Point,
    p3: Point, p4: Point
  ): Point | null {
    const denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
    if (Math.abs(denom) < 0.0001) return null;

    const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
    const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;

    if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
      return {
        x: p1.x + ua * (p2.x - p1.x),
        y: p1.y + ua * (p2.y - p1.y),
      };
    }

    return null;
  }

  static lineIntersectsPolygon(
    start: Point,
    end: Point,
    polygon: Point[]
  ): Point[] {
    const intersections: Point[] = [];
    const n = polygon.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const intersection = this.lineIntersectsLine(
        start, end,
        polygon[i], polygon[j]
      );
      if (intersection) {
        intersections.push(intersection);
      }
    }

    return intersections;
  }

  static getRectCorners(rect: Rect): Point[] {
    return [
      { x: rect.x, y: rect.y },
      { x: rect.x + rect.width, y: rect.y },
      { x: rect.x + rect.width, y: rect.y + rect.height },
      { x: rect.x, y: rect.y + rect.height },
    ];
  }

  static rectIntersectsPolygon(rect: Rect, polygon: Point[]): boolean {
    const corners = this.getRectCorners(rect);
    
    for (const corner of corners) {
      if (this.pointInPolygon(corner, polygon)) {
        return true;
      }
    }

    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      if (this.lineIntersectsPolygon(corners[i], corners[j], polygon).length > 0) {
        return true;
      }
    }

    for (let i = 0; i < polygon.length; i++) {
      if (this.pointInRect(polygon[i], rect)) {
        return true;
      }
    }

    return false;
  }

  static pointInRect(point: Point, rect: Rect): boolean {
    return point.x >= rect.x &&
           point.x <= rect.x + rect.width &&
           point.y >= rect.y &&
           point.y <= rect.y + rect.height;
  }

  static getCollisionDirection(
    rect: Rect,
    polygon: Point[]
  ): CollisionResult {
    if (!this.rectIntersectsPolygon(rect, polygon)) {
      return { collided: false };
    }

    const centerX = rect.x + rect.width / 2;
    const centerY = rect.y + rect.height / 2;

    let minDist = Infinity;
    let direction: 'top' | 'bottom' | 'left' | 'right' = 'top';
    let overlap = 0;

    const polyCenter = this.getPolygonCenter(polygon);
    const dx = centerX - polyCenter.x;
    const dy = centerY - polyCenter.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      direction = dx > 0 ? 'right' : 'left';
      if (direction === 'right') {
        overlap = (rect.x + rect.width) - this.getPolygonLeftEdge(polygon);
      } else {
        overlap = this.getPolygonRightEdge(polygon) - rect.x;
      }
    } else {
      direction = dy > 0 ? 'bottom' : 'top';
      if (direction === 'bottom') {
        overlap = (rect.y + rect.height) - this.getPolygonTopEdge(polygon);
      } else {
        overlap = this.getPolygonBottomEdge(polygon) - rect.y;
      }
    }

    return {
      collided: true,
      direction,
      overlap: Math.abs(overlap),
      normal: this.getNormal(direction),
    };
  }

  static getPolygonCenter(polygon: Point[]): Point {
    let sumX = 0, sumY = 0;
    for (const p of polygon) {
      sumX += p.x;
      sumY += p.y;
    }
    return {
      x: sumX / polygon.length,
      y: sumY / polygon.length,
    };
  }

  static getPolygonLeftEdge(polygon: Point[]): number {
    return Math.min(...polygon.map(p => p.x));
  }

  static getPolygonRightEdge(polygon: Point[]): number {
    return Math.max(...polygon.map(p => p.x));
  }

  static getPolygonTopEdge(polygon: Point[]): number {
    return Math.min(...polygon.map(p => p.y));
  }

  static getPolygonBottomEdge(polygon: Point[]): number {
    return Math.max(...polygon.map(p => p.y));
  }

  static getNormal(direction: 'top' | 'bottom' | 'left' | 'right'): Point {
    switch (direction) {
      case 'top': return { x: 0, y: -1 };
      case 'bottom': return { x: 0, y: 1 };
      case 'left': return { x: -1, y: 0 };
      case 'right': return { x: 1, y: 0 };
    }
  }

  static sweepTest(
    startRect: Rect,
    endRect: Rect,
    polygons: CollisionPolygon[]
  ): { hit: boolean; hitTime: number; hitPolygon?: CollisionPolygon } {
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const currentRect: Rect = {
        x: startRect.x + (endRect.x - startRect.x) * t,
        y: startRect.y + (endRect.y - startRect.y) * t,
        width: startRect.width,
        height: startRect.height,
      };

      for (const polygon of polygons) {
        if (this.rectIntersectsPolygon(currentRect, polygon.vertices)) {
          return {
            hit: true,
            hitTime: t,
            hitPolygon: polygon,
          };
        }
      }
    }
    return { hit: false, hitTime: 1 };
  }

  static checkMultipleCollisions(
    rect: Rect,
    polygons: CollisionPolygon[]
  ): CollisionResult[] {
    const results: CollisionResult[] = [];
    for (const polygon of polygons) {
      const result = this.getCollisionDirection(rect, polygon.vertices);
      if (result.collided) {
        results.push(result);
      }
    }
    return results;
  }

  static distance(p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  static closestPointOnPolygon(point: Point, polygon: Point[]): { point: Point; distance: number } {
    let closest = polygon[0];
    let minDist = this.distance(point, polygon[0]);

    for (let i = 0; i < polygon.length; i++) {
      const j = (i + 1) % polygon.length;
      const proj = this.closestPointOnSegment(point, polygon[i], polygon[j]);
      const dist = this.distance(point, proj);
      if (dist < minDist) {
        minDist = dist;
        closest = proj;
      }
    }

    return { point: closest, distance: minDist };
  }

  static closestPointOnSegment(p: Point, a: Point, b: Point): Point {
    const ab = { x: b.x - a.x, y: b.y - a.y };
    const ap = { x: p.x - a.x, y: p.y - a.y };
    const t = Math.max(0, Math.min(1, (ap.x * ab.x + ap.y * ab.y) / (ab.x * ab.x + ab.y * ab.y)));
    return {
      x: a.x + t * ab.x,
      y: a.y + t * ab.y,
    };
  }
}
