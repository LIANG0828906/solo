import type { Position, SlotConfig, ShapeType } from '@/store/gameStore';

export interface SnapResult {
  snapped: boolean;
  slotId: string | null;
  slotPosition: Position | null;
}

export function checkSnap(
  shapeCenter: Position,
  shapeType: ShapeType,
  slots: SlotConfig[],
  threshold: number = 25
): SnapResult {
  let closestSlot: SlotConfig | null = null;
  let closestDist = Infinity;

  for (const slot of slots) {
    if (slot.isOccupied) continue;
    if (slot.shapeType !== shapeType) continue;
    const dx = shapeCenter.x - slot.position.x;
    const dy = shapeCenter.y - slot.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < closestDist) {
      closestDist = dist;
      closestSlot = slot;
    }
  }

  if (closestSlot && closestDist <= threshold) {
    return {
      snapped: true,
      slotId: closestSlot.id,
      slotPosition: closestSlot.position,
    };
  }

  return { snapped: false, slotId: null, slotPosition: null };
}

export function findNearestSlotOfType(
  shapeCenter: Position,
  shapeType: ShapeType,
  slots: SlotConfig[]
): { slotId: string; dist: number } | null {
  let closestSlot: SlotConfig | null = null;
  let closestDist = Infinity;

  for (const slot of slots) {
    if (slot.isOccupied) continue;
    if (slot.shapeType !== shapeType) continue;
    const dx = shapeCenter.x - slot.position.x;
    const dy = shapeCenter.y - slot.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < closestDist) {
      closestDist = dist;
      closestSlot = slot;
    }
  }

  if (closestSlot) {
    return { slotId: closestSlot.id, dist: closestDist };
  }
  return null;
}
