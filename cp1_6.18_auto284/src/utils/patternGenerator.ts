export const GRID_SIZE = 6;
export const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;
export const MIN_TARGETS = 1;
export const MAX_TARGETS = 4;

export function generatePattern(): number[] {
  const count =
    Math.floor(Math.random() * (MAX_TARGETS - MIN_TARGETS + 1)) + MIN_TARGETS;
  const indices: number[] = [];
  const available = new Set<number>(
    Array.from({ length: TOTAL_CELLS }, (_, i) => i)
  );

  for (let i = 0; i < count; i++) {
    const arr = Array.from(available);
    const randomIndex = Math.floor(Math.random() * arr.length);
    const pick = arr[randomIndex];
    indices.push(pick);
    available.delete(pick);
  }

  return indices;
}
