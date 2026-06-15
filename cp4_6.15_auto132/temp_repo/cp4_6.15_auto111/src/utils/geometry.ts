import type { Bounds, CanvasElement } from '@/types';

export const GRID_SIZE = 40;

export function snapToGrid(value: number, gridSize: number = GRID_SIZE): number {
  return Math.round(value / gridSize) * gridSize;
}

export function snapPointToGrid(
  x: number,
  y: number,
  gridSize: number = GRID_SIZE
): { x: number; y: number } {
  return {
    x: snapToGrid(x, gridSize),
    y: snapToGrid(y, gridSize),
  };
}

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function getElementBounds(el: CanvasElement): Bounds {
  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;
  const halfW = el.width / 2;
  const halfH = el.height / 2;

  const rad = degToRad(el.rotation);
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));

  const rotatedHalfW = halfW * cos + halfH * sin;
  const rotatedHalfH = halfW * sin + halfH * cos;

  return {
    left: cx - rotatedHalfW,
    right: cx + rotatedHalfW,
    top: cy - rotatedHalfH,
    bottom: cy + rotatedHalfH,
    centerX: cx,
    centerY: cy,
  };
}

export function easeCubicOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function alignCenterElements(
  elements: CanvasElement[]
): Map<string, { x: number; y: number }> {
  if (elements.length === 0) return new Map();

  let minLeft = Infinity,
    maxRight = -Infinity,
    minTop = Infinity,
    maxBottom = -Infinity;

  const boundsMap = new Map<string, Bounds>();
  elements.forEach((el) => {
    const b = getElementBounds(el);
    boundsMap.set(el.id, b);
    minLeft = Math.min(minLeft, b.left);
    maxRight = Math.max(maxRight, b.right);
    minTop = Math.min(minTop, b.top);
    maxBottom = Math.max(maxBottom, b.bottom);
  });

  const groupCenterX = (minLeft + maxRight) / 2;
  const groupCenterY = (minTop + maxBottom) / 2;

  const result = new Map<string, { x: number; y: number }>();
  elements.forEach((el) => {
    const b = boundsMap.get(el.id)!;
    const offsetX = groupCenterX - b.centerX;
    const offsetY = groupCenterY - b.centerY;
    result.set(el.id, { x: el.x + offsetX, y: el.y + offsetY });
  });

  return result;
}

export function distributeHorizontal(
  elements: CanvasElement[]
): Map<string, { x: number; y: number }> {
  if (elements.length < 3) return new Map();

  const sorted = [...elements].sort(
    (a, b) => getElementBounds(a).left - getElementBounds(b).left
  );
  const boundsList = sorted.map(getElementBounds);

  const firstLeft = boundsList[0].left;
  const lastRight = boundsList[boundsList.length - 1].right;
  const totalWidth = lastRight - firstLeft;

  const elementWidths = boundsList.map((b) => b.right - b.left);
  const elementsWidth = elementWidths.reduce((a, b) => a + b, 0);
  const gap = elements.length > 1 ? (totalWidth - elementsWidth) / (elements.length - 1) : 0;

  const result = new Map<string, { x: number; y: number }>();
  let currentLeft = firstLeft;

  sorted.forEach((el, i) => {
    const b = boundsList[i];
    const elWidth = b.right - b.left;
    const targetLeft = currentLeft;
    const offsetX = targetLeft - b.left;
    result.set(el.id, { x: el.x + offsetX, y: el.y });
    currentLeft += elWidth + gap;
  });

  return result;
}

export function distributeVertical(
  elements: CanvasElement[]
): Map<string, { x: number; y: number }> {
  if (elements.length < 3) return new Map();

  const sorted = [...elements].sort(
    (a, b) => getElementBounds(a).top - getElementBounds(b).top
  );
  const boundsList = sorted.map(getElementBounds);

  const firstTop = boundsList[0].top;
  const lastBottom = boundsList[boundsList.length - 1].bottom;
  const totalHeight = lastBottom - firstTop;

  const elementHeights = boundsList.map((b) => b.bottom - b.top);
  const elementsHeight = elementHeights.reduce((a, b) => a + b, 0);
  const gap = elements.length > 1 ? (totalHeight - elementsHeight) / (elements.length - 1) : 0;

  const result = new Map<string, { x: number; y: number }>();
  let currentTop = firstTop;

  sorted.forEach((el, i) => {
    const b = boundsList[i];
    const elHeight = b.bottom - b.top;
    const targetTop = currentTop;
    const offsetY = targetTop - b.top;
    result.set(el.id, { x: el.x, y: el.y + offsetY });
    currentTop += elHeight + gap;
  });

  return result;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
