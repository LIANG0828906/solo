import type { Point2D } from '../types';

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function distance(p1: Point2D, p2: Point2D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function rotatePoint(point: Point2D, center: Point2D, angleDeg: number): Point2D {
  const rad = degToRad(angleDeg);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

export function getRectCorners(
  center: Point2D,
  width: number,
  depth: number,
  rotation: number
): Point2D[] {
  const halfWidth = width / 2;
  const halfDepth = depth / 2;
  const corners: Point2D[] = [
    { x: center.x - halfWidth, y: center.y - halfDepth },
    { x: center.x + halfWidth, y: center.y - halfDepth },
    { x: center.x + halfWidth, y: center.y + halfDepth },
    { x: center.x - halfWidth, y: center.y + halfDepth },
  ];
  return corners.map((corner) => rotatePoint(corner, center, rotation));
}

export function pointInRect(
  point: Point2D,
  rectCenter: Point2D,
  rectWidth: number,
  rectDepth: number,
  rotation: number
): boolean {
  const rotatedPoint = rotatePoint(point, rectCenter, -rotation);
  const halfWidth = rectWidth / 2;
  const halfDepth = rectDepth / 2;
  return (
    rotatedPoint.x >= rectCenter.x - halfWidth &&
    rotatedPoint.x <= rectCenter.x + halfWidth &&
    rotatedPoint.y >= rectCenter.y - halfDepth &&
    rotatedPoint.y <= rectCenter.y + halfDepth
  );
}

function lineIntersectsLine(p1: Point2D, p2: Point2D, p3: Point2D, p4: Point2D): boolean {
  const d1 = { x: p2.x - p1.x, y: p2.y - p1.y };
  const d2 = { x: p4.x - p3.x, y: p4.y - p3.y };
  const denom = d1.x * d2.y - d1.y * d2.x;
  if (Math.abs(denom) < 1e-10) {
    return false;
  }
  const dx = p3.x - p1.x;
  const dy = p3.y - p1.y;
  const t = (dx * d2.y - dy * d2.x) / denom;
  const s = (dx * d1.y - dy * d1.x) / denom;
  return t >= 0 && t <= 1 && s >= 0 && s <= 1;
}

export function lineIntersectsRect(p1: Point2D, p2: Point2D, rectCorners: Point2D[]): boolean {
  for (let i = 0; i < rectCorners.length; i++) {
    const c1 = rectCorners[i];
    const c2 = rectCorners[(i + 1) % rectCorners.length];
    if (lineIntersectsLine(p1, p2, c1, c2)) {
      return true;
    }
  }
  const firstCorner = rectCorners[0];
  const secondCorner = rectCorners[1];
  const thirdCorner = rectCorners[2];
  if (
    pointInRect(
      p1,
      {
        x: (firstCorner.x + thirdCorner.x) / 2,
        y: (firstCorner.y + thirdCorner.y) / 2,
      },
      distance(firstCorner, secondCorner),
      distance(secondCorner, thirdCorner),
      0
    )
  ) {
    return true;
  }
  return false;
}

export function getNearestPointOnRect(
  point: Point2D,
  rectCorners: Point2D[]
): { point: Point2D; distance: number } {
  let nearest: Point2D = rectCorners[0];
  let minDist = Infinity;

  for (let i = 0; i < rectCorners.length; i++) {
    const c1 = rectCorners[i];
    const c2 = rectCorners[(i + 1) % rectCorners.length];

    const dx = c2.x - c1.x;
    const dy = c2.y - c1.y;
    const lenSq = dx * dx + dy * dy;

    if (lenSq === 0) {
      const dist = distance(point, c1);
      if (dist < minDist) {
        minDist = dist;
        nearest = c1;
      }
      continue;
    }

    let t = ((point.x - c1.x) * dx + (point.y - c1.y) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));

    const proj = {
      x: c1.x + t * dx,
      y: c1.y + t * dy,
    };

    const dist = distance(point, proj);
    if (dist < minDist) {
      minDist = dist;
      nearest = proj;
    }
  }

  return { point: nearest, distance: minDist };
}
