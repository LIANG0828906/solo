export interface ShapeItem {
  shapeType: number;
  gridIndex: number;
}

const SHAPE_COUNT = 6;
const GRID_SIZE = 25;

export class GameSync {
  generateSequence(length: number): ShapeItem[] {
    const sequence: ShapeItem[] = [];
    const usedPositions = new Set<number>();

    for (let i = 0; i < length; i++) {
      if (usedPositions.size >= GRID_SIZE) {
        usedPositions.clear();
      }
      let gridIndex: number;
      do {
        gridIndex = Math.floor(Math.random() * GRID_SIZE);
      } while (usedPositions.has(gridIndex));
      usedPositions.add(gridIndex);

      sequence.push({
        shapeType: Math.floor(Math.random() * SHAPE_COUNT),
        gridIndex,
      });
    }

    return sequence;
  }

  validateInput(
    sequence: ShapeItem[],
    playerGridIndex: number,
    expectedIndex: number
  ): boolean {
    if (expectedIndex >= sequence.length) return false;
    return sequence[expectedIndex].gridIndex === playerGridIndex;
  }
}
