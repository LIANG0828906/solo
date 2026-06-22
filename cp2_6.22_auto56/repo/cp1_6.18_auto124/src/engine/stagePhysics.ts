import type { PropElement } from '@/types';

export const STAGE_WIDTH = 1200;
export const STAGE_HEIGHT = 800;
export const MAX_OVERLAP = 5;

export function getBoundingBox(prop: PropElement): { x: number; y: number; width: number; height: number } {
  return {
    x: prop.x,
    y: prop.y,
    width: prop.width,
    height: prop.height,
  };
}

export function clampToStage(
  x: number,
  y: number,
  width: number,
  height: number
): { x: number; y: number } {
  const clampedX = Math.max(0, Math.min(x, STAGE_WIDTH - width));
  const clampedY = Math.max(0, Math.min(y, STAGE_HEIGHT - height));
  return { x: clampedX, y: clampedY };
}

export function checkOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
): number {
  const overlapX = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const overlapY = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return overlapX * overlapY;
}

export function checkCollision(
  element: PropElement,
  others: PropElement[]
): { collides: boolean; overlaps: PropElement[] } {
  const overlaps: PropElement[] = [];
  const elementBox = getBoundingBox(element);

  for (const other of others) {
    if (other.id === element.id) continue;
    const otherBox = getBoundingBox(other);
    const overlap = checkOverlap(elementBox, otherBox);
    if (overlap > MAX_OVERLAP) {
      overlaps.push(other);
    }
  }

  return { collides: overlaps.length > 0, overlaps };
}

export function getValidPosition(
  element: PropElement,
  targetX: number,
  targetY: number,
  others: PropElement[]
): { x: number; y: number } {
  let { x, y } = clampToStage(targetX, targetY, element.width, element.height);
  const testElement: PropElement = { ...element, x, y };
  const othersWithoutSelf = others.filter((o) => o.id !== element.id);

  for (const other of othersWithoutSelf) {
    const testBox = getBoundingBox(testElement);
    const otherBox = getBoundingBox(other);
    const overlap = checkOverlap(testBox, otherBox);

    if (overlap > MAX_OVERLAP) {
      const overlapLeft = testBox.x + testBox.width - otherBox.x;
      const overlapRight = otherBox.x + otherBox.width - testBox.x;
      const overlapTop = testBox.y + testBox.height - otherBox.y;
      const overlapBottom = otherBox.y + otherBox.height - testBox.y;

      const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

      if (minOverlap === overlapLeft) {
        x = otherBox.x - testElement.width;
      } else if (minOverlap === overlapRight) {
        x = otherBox.x + otherBox.width;
      } else if (minOverlap === overlapTop) {
        y = otherBox.y - testElement.height;
      } else if (minOverlap === overlapBottom) {
        y = otherBox.y + otherBox.height;
      }

      const clamped = clampToStage(x, y, element.width, element.height);
      x = clamped.x;
      y = clamped.y;
      testElement.x = x;
      testElement.y = y;
    }
  }

  return { x, y };
}
