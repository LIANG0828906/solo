import { Block, Position, GravityDirection, BLOCK_SHAPES } from '../types';

function rotatePosition(pos: Position, rotation: number): Position {
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

export function getBlockCells(block: Block): Position[] {
  const shape = BLOCK_SHAPES[block.type];
  return shape.map((relPos) => {
    const rotated = rotatePosition(relPos, block.rotation);
    return {
      x: block.position.x + rotated.x,
      y: block.position.y + rotated.y,
    };
  });
}

function isInBounds(pos: Position, gridSize: number): boolean {
  const xOk = pos.x >= 0 && pos.x < gridSize;
  const yOk = pos.y >= 0 && pos.y < gridSize;
  return xOk && yOk;
}

function posKey(pos: Position): string {
  return `${pos.x},${pos.y}`;
}

function getGravityVector(direction: GravityDirection): Position {
  switch (direction) {
    case 'down':
      return { x: 0, y: 1 };
    case 'up':
      return { x: 0, y: -1 };
    case 'left':
      return { x: -1, y: 0 };
    case 'right':
      return { x: 1, y: 0 };
  }
}

function getAllOccupiedPositions(
  blocks: Block[],
  gridSize: number
): Set<string> {
  const occupied = new Set<string>();
  blocks.forEach((block) => {
    getBlockCells(block).forEach((cell) => {
      if (isInBounds(cell, gridSize)) {
        occupied.add(posKey(cell));
      }
    });
  });
  return occupied;
}

export function canPlaceBlock(
  block: Block,
  occupiedPositions: Set<string>,
  obstacles: Set<string>,
  gridSize: number,
  excludeBlockId?: string,
  allBlocks?: Block[]
): boolean {
  const cells = getBlockCells(block);

  for (const cell of cells) {
    if (!isInBounds(cell, gridSize)) {
      return false;
    }
    const key = posKey(cell);
    if (obstacles.has(key)) {
      return false;
    }
    if (excludeBlockId && allBlocks) {
      for (const other of allBlocks) {
        if (other.id !== excludeBlockId) {
          const otherCells = getBlockCells(other);
          if (otherCells.some((c) => posKey(c) === key)) {
            return false;
          }
        }
      }
    } else if (occupiedPositions.has(key)) {
      return false;
    }
  }
  return true;
}

export function applyGravity(
  blocks: Block[],
  obstacles: Position[],
  gridSize: number,
  direction: GravityDirection
): { blocks: Block[]; moved: boolean } {
  const gravity = getGravityVector(direction);
  const obstacleSet = new Set(obstacles.map(posKey));

  let moved = false;
  const newBlocks = blocks.map((b) => ({ ...b, position: { ...b.position } }));

  function tryMoveBlock(block: Block, allBlocks: Block[]): boolean {
    const testBlock: Block = {
      ...block,
      position: {
        x: block.position.x + gravity.x,
        y: block.position.y + gravity.y,
      },
    };

    const otherBlocks = allBlocks.filter((b) => b.id !== block.id);
    const otherOccupied = new Set<string>();
    otherBlocks.forEach((b) => {
      getBlockCells(b).forEach((cell) => {
        if (isInBounds(cell, gridSize)) {
          otherOccupied.add(posKey(cell));
        }
      });
    });

    if (canPlaceBlock(testBlock, otherOccupied, obstacleSet, gridSize)) {
      block.position.x = testBlock.position.x;
      block.position.y = testBlock.position.y;
      return true;
    }
    return false;
  }

  let keepMoving = true;
  while (keepMoving) {
    keepMoving = false;

    const sortedBlocks = [...newBlocks].sort((a, b) => {
      if (direction === 'down') return b.position.y - a.position.y;
      if (direction === 'up') return a.position.y - b.position.y;
      if (direction === 'left') return a.position.x - b.position.x;
      if (direction === 'right') return b.position.x - a.position.x;
      return 0;
    });

    for (const block of sortedBlocks) {
      const actualBlock = newBlocks.find((b) => b.id === block.id)!;
      if (tryMoveBlock(actualBlock, newBlocks)) {
        moved = true;
        keepMoving = true;
      }
    }
  }

  newBlocks.forEach((block) => {
    const cells = getBlockCells(block);
    for (const cell of cells) {
      if (cell.x < 0) {
        block.position.x += Math.abs(cell.x);
      }
      if (cell.y < 0) {
        block.position.y += Math.abs(cell.y);
      }
      if (cell.x >= gridSize) {
        block.position.x -= cell.x - gridSize + 1;
      }
      if (cell.y >= gridSize) {
        block.position.y -= cell.y - gridSize + 1;
      }
    }
  });

  return { blocks: newBlocks, moved };
}

export function applyGravityAfterRotation(
  blocks: Block[],
  obstacles: Position[],
  gridSize: number,
  direction: GravityDirection
): { blocks: Block[]; moved: boolean } {
  return applyGravity(blocks, obstacles, gridSize, direction);
}

export function checkComplete(
  blocks: Block[],
  targetArea: { x: number; y: number; width: number; height: number }
): boolean {
  for (const block of blocks) {
    const cells = getBlockCells(block);
    for (const cell of cells) {
      if (
        cell.x < targetArea.x ||
        cell.x >= targetArea.x + targetArea.width ||
        cell.y < targetArea.y ||
        cell.y >= targetArea.y + targetArea.height
      ) {
        return false;
      }
    }
  }
  return true;
}

export function rotateBlockShape(
  block: Block,
  allBlocks: Block[],
  obstacles: Position[],
  gridSize: number
): Block | null {
  if (block.type === 'SQUARE') {
    return null;
  }

  const rotatedBlock: Block = {
    ...block,
    rotation: (block.rotation + 90) % 360,
  };

  const obstacleSet = new Set(obstacles.map(posKey));
  const occupied = getAllOccupiedPositions(
    allBlocks.filter((b) => b.id !== block.id),
    gridSize
  );

  if (canPlaceBlock(rotatedBlock, occupied, obstacleSet, gridSize)) {
    return rotatedBlock;
  }

  const kicks = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
    { x: 1, y: 1 },
    { x: -1, y: -1 },
  ];

  for (const kick of kicks) {
    const kicked: Block = {
      ...rotatedBlock,
      position: {
        x: rotatedBlock.position.x + kick.x,
        y: rotatedBlock.position.y + kick.y,
      },
    };
    if (canPlaceBlock(kicked, occupied, obstacleSet, gridSize)) {
      return kicked;
    }
  }

  return null;
}
