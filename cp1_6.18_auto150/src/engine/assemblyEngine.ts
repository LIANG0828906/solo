import { v4 as uuidv4 } from 'uuid';
import {
  GRID_SIZE,
  MAX_PARTS,
  COLLISION_THRESHOLD,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
} from '../types';
import type { PlacedPart, PartTemplate } from '../types';
import { getTemplateById } from '../data/partData';

export function snapToGrid(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

export function snapPointToGrid(x: number, y: number): { x: number; y: number } {
  return { x: snapToGrid(x), y: snapToGrid(y) };
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function partToRect(part: PlacedPart): Rect | null {
  const tpl = getTemplateById(part.templateId);
  if (!tpl) return null;
  return { x: part.x, y: part.y, width: tpl.width, height: tpl.height };
}

export function templateToRect(
  templateId: string,
  x: number,
  y: number
): Rect | null {
  const tpl = getTemplateById(templateId);
  if (!tpl) return null;
  return { x, y, width: tpl.width, height: tpl.height };
}

export function rectArea(r: Rect): number {
  return r.width * r.height;
}

export function intersectionRect(a: Rect, b: Rect): Rect | null {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y2 = Math.min(a.y + a.height, b.y + b.height);
  if (x1 >= x2 || y1 >= y2) return null;
  return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
}

export function overlapPercentage(a: Rect, b: Rect): number {
  const inter = intersectionRect(a, b);
  if (!inter) return 0;
  const interArea = rectArea(inter);
  const minArea = Math.min(rectArea(a), rectArea(b));
  return minArea > 0 ? interArea / minArea : 0;
}

export function isAdjacent(a: Rect, b: Rect, tolerance = 2): boolean {
  const ax2 = a.x + a.width;
  const ay2 = a.y + a.height;
  const bx2 = b.x + b.width;
  const by2 = b.y + b.height;

  const horizontallyClose =
    Math.abs(ax2 - b.x) <= tolerance || Math.abs(bx2 - a.x) <= tolerance;
  const verticallyClose =
    Math.abs(ay2 - b.y) <= tolerance || Math.abs(by2 - a.y) <= tolerance;

  const yOverlap = !(a.y + a.height <= b.y || b.y + b.height <= a.y);
  const xOverlap = !(a.x + a.width <= b.x || b.x + b.width <= a.x);

  return (horizontallyClose && yOverlap) || (verticallyClose && xOverlap);
}

export interface PlacementResult {
  success: boolean;
  placedPart?: PlacedPart;
  collision: boolean;
  highlightUpdates: { instanceId: string; isHighlighted: boolean }[];
}

export function placePart(
  templateId: string,
  rawX: number,
  rawY: number,
  existingParts: PlacedPart[],
  existingInstanceId?: string
): PlacementResult {
  if (existingParts.length >= MAX_PARTS && !existingInstanceId) {
    return { success: false, collision: false, highlightUpdates: [] };
  }

  const tpl = getTemplateById(templateId);
  if (!tpl) return { success: false, collision: false, highlightUpdates: [] };

  const snapped = snapPointToGrid(rawX - tpl.width / 2, rawY - tpl.height / 2);

  const clampedX = Math.max(
    0,
    Math.min(CANVAS_WIDTH - tpl.width, snapped.x)
  );
  const clampedY = Math.max(
    0,
    Math.min(CANVAS_HEIGHT - tpl.height, snapped.y)
  );

  const newRect: Rect = {
    x: clampedX,
    y: clampedY,
    width: tpl.width,
    height: tpl.height,
  };

  let collision = false;
  for (const p of existingParts) {
    if (existingInstanceId && p.instanceId === existingInstanceId) continue;
    const r = partToRect(p);
    if (!r) continue;
    const overlap = overlapPercentage(newRect, r);
    if (overlap > COLLISION_THRESHOLD) {
      collision = true;
      break;
    }
  }

  if (collision) {
    return { success: false, collision: true, highlightUpdates: [] };
  }

  const instanceId = existingInstanceId || uuidv4();
  const highlightUpdates: { instanceId: string; isHighlighted: boolean }[] = [];

  for (const p of existingParts) {
    if (p.instanceId === instanceId) continue;
    const r = partToRect(p);
    if (!r) continue;
    const adj = isAdjacent(newRect, r);
    if (adj !== p.isHighlighted) {
      highlightUpdates.push({ instanceId: p.instanceId, isHighlighted: adj });
    }
  }

  let newPartHighlighted = false;
  for (const p of existingParts) {
    if (p.instanceId === instanceId) continue;
    const r = partToRect(p);
    if (!r) continue;
    if (isAdjacent(newRect, r)) {
      newPartHighlighted = true;
      break;
    }
  }

  const placedPart: PlacedPart = {
    instanceId,
    templateId,
    x: clampedX,
    y: clampedY,
    rotation: 0,
    isHighlighted: newPartHighlighted,
  };

  return { success: true, placedPart, collision: false, highlightUpdates };
}

export function recomputeHighlights(
  parts: PlacedPart[]
): { instanceId: string; isHighlighted: boolean }[] {
  const updates: { instanceId: string; isHighlighted: boolean }[] = [];
  for (let i = 0; i < parts.length; i++) {
    const a = parts[i];
    const ra = partToRect(a);
    if (!ra) continue;
    let highlighted = false;
    for (let j = 0; j < parts.length; j++) {
      if (i === j) continue;
      const rb = partToRect(parts[j]);
      if (!rb) continue;
      if (isAdjacent(ra, rb)) {
        highlighted = true;
        break;
      }
    }
    if (highlighted !== a.isHighlighted) {
      updates.push({ instanceId: a.instanceId, isHighlighted: highlighted });
    }
  }
  return updates;
}
