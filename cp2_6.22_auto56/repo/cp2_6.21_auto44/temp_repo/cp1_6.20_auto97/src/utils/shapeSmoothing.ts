import { Point, Shape, PenShape, RectangleShape, DiamondShape } from '../types';

export function douglasPeucker(points: Point[], epsilon: number): Point[] {
  if (points.length <= 2) return points;

  let maxDist = 0;
  let maxIndex = 0;
  const start = points[0];
  const end = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], start, end);
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }

  if (maxDist > epsilon) {
    const left = douglasPeucker(points.slice(0, maxIndex + 1), epsilon);
    const right = douglasPeucker(points.slice(maxIndex), epsilon);
    return [...left.slice(0, -1), ...right];
  }

  return [start, end];
}

function perpendicularDistance(point: Point, start: Point, end: Point): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return Math.sqrt((point.x - start.x) ** 2 + (point.y - start.y) ** 2);
  
  const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / (len * len)));
  const projX = start.x + t * dx;
  const projY = start.y + t * dy;
  
  return Math.sqrt((point.x - projX) ** 2 + (point.y - projY) ** 2);
}

export function getShapeBounds(points: Point[]): { x: number; y: number; width: number; height: number } {
  if (points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export function isApproximatelyRectangle(points: Point[], tolerance: number = 0.15): boolean {
  if (points.length < 4) return false;
  
  const bounds = getShapeBounds(points);
  const perimeter = 2 * (bounds.width + bounds.height);
  let pathLength = 0;
  
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    pathLength += Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
  }
  
  const ratio = Math.abs(pathLength - perimeter) / perimeter;
  return ratio < tolerance;
}

export function isApproximatelyDiamond(points: Point[], tolerance: number = 0.2): boolean {
  if (points.length < 4) return false;
  
  const bounds = getShapeBounds(points);
  const cx = bounds.x + bounds.width / 2;
  const cy = bounds.y + bounds.height / 2;
  
  const corners = [
    { x: cx, y: bounds.y },
    { x: bounds.x + bounds.width, y: cy },
    { x: cx, y: bounds.y + bounds.height },
    { x: bounds.x, y: cy }
  ];
  
  let cornerMatches = 0;
  for (const corner of corners) {
    let minDist = Infinity;
    for (const p of points) {
      const dist = Math.sqrt((p.x - corner.x) ** 2 + (p.y - corner.y) ** 2);
      minDist = Math.min(minDist, dist);
    }
    const avgSide = (bounds.width + bounds.height) / 2;
    if (minDist < avgSide * tolerance) {
      cornerMatches++;
    }
  }
  
  return cornerMatches >= 3;
}

export function smoothAndShapeShape(shape: PenShape): Shape {
  if (shape.points.length < 3) return shape;
  
  const simplified = douglasPeucker(shape.points, 2);
  
  if (simplified.length >= 4 && isApproximatelyRectangle(simplified)) {
    const bounds = getShapeBounds(simplified);
    return {
      ...shape,
      type: 'rectangle',
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      points: undefined
    } as RectangleShape;
  }
  
  if (simplified.length >= 4 && isApproximatelyDiamond(simplified)) {
    const bounds = getShapeBounds(simplified);
    return {
      ...shape,
      type: 'diamond',
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      points: undefined
    } as DiamondShape;
  }
  
  return {
    ...shape,
    points: simplified
  };
}

export function hitTest(shape: Shape, x: number, y: number): boolean {
  const padding = 10;
  
  switch (shape.type) {
    case 'pen': {
      if (!shape.points) return false;
      for (let i = 0; i < shape.points.length - 1; i++) {
        const p1 = shape.points[i];
        const p2 = shape.points[i + 1];
        const dist = pointToLineDistance(x, y, p1.x, p1.y, p2.x, p2.y);
        if (dist < padding + shape.strokeWidth / 2) return true;
      }
      return false;
    }
    case 'rectangle':
    case 'diamond':
    case 'text':
      return x >= shape.x - padding && x <= shape.x + shape.width + padding &&
             y >= shape.y - padding && y <= shape.y + shape.height + padding;
    case 'arrow': {
      const dist = pointToLineDistance(x, y, shape.startX, shape.startY, shape.endX, shape.endY);
      return dist < padding + shape.strokeWidth / 2;
    }
    default:
      return false;
  }
}

function pointToLineDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
  
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (len * len)));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  
  return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
}

export function getResizeHandles(shape: Shape): { id: string; x: number; y: number; cursor: string }[] {
  const { x, y, width, height } = shape;
  const size = 8;
  
  return [
    { id: 'nw', x: x - size / 2, y: y - size / 2, cursor: 'nw-resize' },
    { id: 'n', x: x + width / 2 - size / 2, y: y - size / 2, cursor: 'n-resize' },
    { id: 'ne', x: x + width - size / 2, y: y - size / 2, cursor: 'ne-resize' },
    { id: 'e', x: x + width - size / 2, y: y + height / 2 - size / 2, cursor: 'e-resize' },
    { id: 'se', x: x + width - size / 2, y: y + height - size / 2, cursor: 'se-resize' },
    { id: 's', x: x + width / 2 - size / 2, y: y + height - size / 2, cursor: 's-resize' },
    { id: 'sw', x: x - size / 2, y: y + height - size / 2, cursor: 'sw-resize' },
    { id: 'w', x: x - size / 2, y: y + height / 2 - size / 2, cursor: 'w-resize' }
  ];
}
