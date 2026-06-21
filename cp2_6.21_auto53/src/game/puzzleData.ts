import { LevelData, BlockType, BLOCK_SHAPES, Position } from '../types';

function rotatePositionForValidation(pos: Position, rotation: number): Position {
  const r = ((rotation % 360) + 360) % 360;
  switch (r) {
    case 90:
      return { x: -pos.y, y: pos.x };
    case 180:
      return { x: -pos.x, y: -pos.y };
    case 270:
      return { x: pos.y, y: -pos.x };
    default:
      return { x: pos.x, y: pos.y };
  }
}

function getBlockCellsForValidation(
  type: BlockType,
  position: Position,
  rotation: number
): Position[] {
  const shape = BLOCK_SHAPES[type];
  return shape.map((relPos) => {
    const rotated = rotatePositionForValidation(relPos, rotation);
    return {
      x: position.x + rotated.x,
      y: position.y + rotated.y,
    };
  });
}

function validateLevel(level: LevelData, levelIndex: number): void {
  const obstacleSet = new Set(level.obstacles.map((o) => `${o.x},${o.y}`));
  const allBlockCells: string[] = [];

  level.blocks.forEach((block, blockIndex) => {
    const cells = getBlockCellsForValidation(block.type, block.position, block.rotation);
    cells.forEach((cell) => {
      if (cell.x < 0 || cell.x >= level.gridSize || cell.y < 0 || cell.y >= level.gridSize) {
        throw new Error(
          `第${levelIndex + 1}关第${blockIndex + 1}个方块超出网格边界: (${cell.x}, ${cell.y})`
        );
      }
      const key = `${cell.x},${cell.y}`;
      if (obstacleSet.has(key)) {
        throw new Error(
          `第${levelIndex + 1}关第${blockIndex + 1}个方块与障碍物重叠: (${cell.x}, ${cell.y})`
        );
      }
      allBlockCells.push(key);
    });
  });

  const cellCounts = new Map<string, number>();
  allBlockCells.forEach((key) => {
    cellCounts.set(key, (cellCounts.get(key) || 0) + 1);
  });

  cellCounts.forEach((count, key) => {
    if (count > 1) {
      throw new Error(`第${levelIndex + 1}关方块之间重叠: ${key}`);
    }
  });

  if (level.targetArea === undefined || level.targetArea === null) {
    throw new Error(`第${levelIndex + 1}关targetArea为undefined`);
  }
  if (
    level.targetArea.x === undefined ||
    level.targetArea.y === undefined ||
    level.targetArea.width === undefined ||
    level.targetArea.height === undefined
  ) {
    throw new Error(`第${levelIndex + 1}关targetArea字段不完整`);
  }
}

const rawLevels: LevelData[] = [
  {
    gridSize: 8,
    obstacles: [],
    blocks: [
      { type: 'I3', position: { x: 2, y: 2 }, rotation: 0 },
    ],
    targetArea: { x: 2, y: 5, width: 3, height: 3 },
  },
  {
    gridSize: 8,
    obstacles: [],
    blocks: [
      { type: 'SQUARE', position: { x: 3, y: 1 }, rotation: 0 },
    ],
    targetArea: { x: 3, y: 5, width: 2, height: 3 },
  },
  {
    gridSize: 8,
    obstacles: [
      { x: 4, y: 7 },
      { x: 5, y: 7 },
    ],
    blocks: [
      { type: 'L3', position: { x: 2, y: 1 }, rotation: 0 },
    ],
    targetArea: { x: 5, y: 5, width: 3, height: 3 },
  },
  {
    gridSize: 8,
    obstacles: [
      { x: 3, y: 5 },
      { x: 3, y: 6 },
    ],
    blocks: [
      { type: 'I4', position: { x: 1, y: 1 }, rotation: 0 },
    ],
    targetArea: { x: 4, y: 4, width: 4, height: 4 },
  },
  {
    gridSize: 8,
    obstacles: [],
    blocks: [
      { type: 'I3', position: { x: 1, y: 2 }, rotation: 0 },
      { type: 'L3', position: { x: 5, y: 1 }, rotation: 0 },
    ],
    targetArea: { x: 2, y: 5, width: 4, height: 3 },
  },
  {
    gridSize: 8,
    obstacles: [
      { x: 4, y: 4 },
    ],
    blocks: [
      { type: 'T4', position: { x: 2, y: 1 }, rotation: 0 },
    ],
    targetArea: { x: 3, y: 5, width: 4, height: 3 },
  },
  {
    gridSize: 8,
    obstacles: [
      { x: 2, y: 6 },
      { x: 3, y: 6 },
      { x: 5, y: 6 },
      { x: 6, y: 6 },
    ],
    blocks: [
      { type: 'Z4', position: { x: 2, y: 1 }, rotation: 0 },
    ],
    targetArea: { x: 3, y: 4, width: 3, height: 2 },
  },
  {
    gridSize: 8,
    obstacles: [
      { x: 0, y: 7 },
      { x: 1, y: 7 },
      { x: 6, y: 7 },
      { x: 7, y: 7 },
    ],
    blocks: [
      { type: 'L4', position: { x: 1, y: 1 }, rotation: 0 },
    ],
    targetArea: { x: 2, y: 5, width: 4, height: 3 },
  },
  {
    gridSize: 8,
    obstacles: [
      { x: 3, y: 3 },
      { x: 4, y: 3 },
    ],
    blocks: [
      { type: 'SQUARE', position: { x: 1, y: 1 }, rotation: 0 },
      { type: 'I3', position: { x: 5, y: 1 }, rotation: 90 },
    ],
    targetArea: { x: 2, y: 5, width: 4, height: 3 },
  },
  {
    gridSize: 8,
    obstacles: [
      { x: 2, y: 5 },
      { x: 5, y: 5 },
    ],
    blocks: [
      { type: 'I4', position: { x: 0, y: 1 }, rotation: 0 },
      { type: 'T4', position: { x: 4, y: 1 }, rotation: 0 },
    ],
    targetArea: { x: 1, y: 6, width: 6, height: 2 },
  },
  {
    gridSize: 8,
    obstacles: [
      { x: 3, y: 4 },
      { x: 3, y: 5 },
      { x: 4, y: 4 },
      { x: 4, y: 5 },
    ],
    blocks: [
      { type: 'L4', position: { x: 1, y: 1 }, rotation: 0 },
      { type: 'L3', position: { x: 5, y: 1 }, rotation: 90 },
    ],
    targetArea: { x: 1, y: 6, width: 6, height: 2 },
  },
  {
    gridSize: 8,
    obstacles: [
      { x: 2, y: 3 },
      { x: 5, y: 3 },
      { x: 2, y: 6 },
      { x: 5, y: 6 },
    ],
    blocks: [
      { type: 'Z4', position: { x: 0, y: 1 }, rotation: 0 },
      { type: 'I3', position: { x: 5, y: 1 }, rotation: 0 },
    ],
    targetArea: { x: 3, y: 4, width: 2, height: 2 },
  },
  {
    gridSize: 8,
    obstacles: [
      { x: 0, y: 4 },
      { x: 7, y: 4 },
      { x: 1, y: 4 },
      { x: 6, y: 4 },
    ],
    blocks: [
      { type: 'T4', position: { x: 2, y: 0 }, rotation: 0 },
      { type: 'SQUARE', position: { x: 4, y: 1 }, rotation: 0 },
      { type: 'L3', position: { x: 1, y: 6 }, rotation: 180 },
    ],
    targetArea: { x: 2, y: 5, width: 4, height: 3 },
  },
  {
    gridSize: 8,
    obstacles: [
      { x: 3, y: 2 },
      { x: 4, y: 2 },
      { x: 3, y: 5 },
      { x: 4, y: 5 },
    ],
    blocks: [
      { type: 'I4', position: { x: 0, y: 0 }, rotation: 0 },
      { type: 'I4', position: { x: 5, y: 0 }, rotation: 90 },
      { type: 'Z4', position: { x: 0, y: 6 }, rotation: 0 },
    ],
    targetArea: { x: 2, y: 3, width: 4, height: 2 },
  },
  {
    gridSize: 8,
    obstacles: [
      { x: 1, y: 1 },
      { x: 6, y: 1 },
      { x: 1, y: 6 },
      { x: 6, y: 6 },
      { x: 3, y: 3 },
      { x: 4, y: 3 },
      { x: 3, y: 4 },
      { x: 4, y: 4 },
    ],
    blocks: [
      { type: 'L4', position: { x: 2, y: 0 }, rotation: 0 },
      { type: 'T4', position: { x: 4, y: 0 }, rotation: 0 },
      { type: 'SQUARE', position: { x: 0, y: 3 }, rotation: 0 },
      { type: 'I3', position: { x: 6, y: 3 }, rotation: 90 },
    ],
    targetArea: { x: 2, y: 6, width: 4, height: 2 },
  },
];

rawLevels.forEach((level, index) => {
  validateLevel(level, index);
});

export const puzzleLevels: LevelData[] = rawLevels;
