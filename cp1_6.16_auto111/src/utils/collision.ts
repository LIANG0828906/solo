import type { Shape } from '@/types';
import { SHAPE_GAP } from '@/types';

export function getShapeRadius(shape: Shape): number {
  return shape.size / 2 + SHAPE_GAP;
}

export function checkCollision(shape1: Shape, shape2: Shape): boolean {
  const dx = shape1.x - shape2.x;
  const dy = shape1.y - shape2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const r1 = getShapeRadius(shape1);
  const r2 = getShapeRadius(shape2);
  return distance < r1 + r2;
}

export function checkCollisionsWithAll(
  newShape: Shape,
  shapes: Shape[],
  excludeId?: string
): boolean {
  for (const shape of shapes) {
    if (excludeId && shape.id === excludeId) continue;
    if (checkCollision(newShape, shape)) {
      return true;
    }
  }
  return false;
}

export function isInCanvas(
  shape: Shape,
  canvasWidth: number,
  canvasHeight: number
): boolean {
  const r = shape.size / 2;
  return (
    shape.x - r >= 0 &&
    shape.x + r <= canvasWidth &&
    shape.y - r >= 0 &&
    shape.y + r <= canvasHeight
  );
}

export function clampShapeToCanvas(
  shape: Shape,
  canvasWidth: number,
  canvasHeight: number
): Shape {
  const r = shape.size / 2;
  return {
    ...shape,
    x: Math.max(r, Math.min(canvasWidth - r, shape.x)),
    y: Math.max(r, Math.min(canvasHeight - r, shape.y)),
  };
}
