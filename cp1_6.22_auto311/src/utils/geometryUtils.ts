import type { AlchemySlot } from '../types';

export const BOARD_SIZE = 400;
export const SLOT_SIZE = 60;
export const SLOT_RADIUS = SLOT_SIZE / 2;
export const BOARD_RADIUS = BOARD_SIZE / 2 - 50;

export function areSlotsAdjacent(a: number, b: number): boolean {
  return (a + 1) % 6 === b || (b + 1) % 6 === a;
}

export function findAdjacentFilledPairs(slots: AlchemySlot[]): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];
  for (let i = 0; i < 6; i++) {
    const j = (i + 1) % 6;
    if (slots[i].materialId && slots[j].materialId) {
      pairs.push([i, j]);
    }
  }
  return pairs;
}

export function markGlowingSlots(slots: AlchemySlot[]): AlchemySlot[] {
  const glowingIndexes = new Set<number>();
  const pairs = findAdjacentFilledPairs(slots);
  pairs.forEach(([a, b]) => {
    glowingIndexes.add(a);
    glowingIndexes.add(b);
  });
  return slots.map((s) => ({
    ...s,
    isGlowing: glowingIndexes.has(s.index),
  }));
}
