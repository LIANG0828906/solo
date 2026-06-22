import { Position, TerrainType, Cell } from './PlantData';
import { v4 as uuidv4 } from 'uuid';

export const BOARD_SIZE = 8;

export function isInBounds(pos: Position): boolean {
  return pos.row >= 0 && pos.row < BOARD_SIZE && pos.col >= 0 && pos.col < BOARD_SIZE;
}

export function getAdjacentPositions(pos: Position): Position[] {
  const directions = [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },
  ];
  return directions
    .map((d) => ({ row: pos.row + d.row, col: pos.col + d.col }))
    .filter(isInBounds);
}

export function getManhattanDistance(a: Position, b: Position): number {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

export function isPositionEqual(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col;
}

export function getLinePositions(start: Position, direction: Position, range: number): Position[] {
  const result: Position[] = [];
  for (let i = 1; i <= range; i++) {
    const pos = {
      row: start.row + direction.row * i,
      col: start.col + direction.col * i,
    };
    if (!isInBounds(pos)) break;
    result.push(pos);
  }
  return result;
}

export function getAttackTargets(
  attackerPos: Position,
  range: number,
  targetPositions: Position[]
): Position[] {
  const directions = [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },
  ];

  const hits: Position[] = [];

  for (const dir of directions) {
    const line = getLinePositions(attackerPos, dir, range);
    for (const pos of line) {
      if (targetPositions.some((t) => isPositionEqual(t, pos))) {
        hits.push(pos);
        break;
      }
    }
  }

  return hits;
}

export function get2x2Area(center: Position): Position[] {
  const positions: Position[] = [];
  for (let dr = 0; dr <= 1; dr++) {
    for (let dc = 0; dc <= 1; dc++) {
      const pos = { row: center.row + dr, col: center.col + dc };
      if (isInBounds(pos)) {
        positions.push(pos);
      }
    }
  }
  return positions;
}

export function initializeBoard(): Cell[][] {
  const board: Cell[][] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    const rowArr: Cell[] = [];
    for (let col = 0; col < BOARD_SIZE; col++) {
      rowArr.push({
        position: { row, col },
        terrain: 'normal' as TerrainType,
        terrainTimer: 0,
      });
    }
    board.push(rowArr);
  }
  return board;
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export interface TerrainChange {
  position: Position;
  newTerrain: TerrainType;
}

export function generateTerrainChanges(board: Cell[][]): TerrainChange[] {
  const changes: TerrainChange[] = [];
  const count = randomInt(3, 5);
  const availablePositions: Position[] = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col].terrain === 'normal') {
        availablePositions.push({ row, col });
      }
    }
  }

  for (let i = 0; i < count && availablePositions.length > 0; i++) {
    const idx = randomInt(0, availablePositions.length - 1);
    const pos = availablePositions.splice(idx, 1)[0];
    const terrain: TerrainType = Math.random() < 0.5 ? 'water' : 'rock';
    changes.push({ position: pos, newTerrain: terrain });
  }

  return changes;
}

export function createNotification(text: string, position: Position) {
  return {
    id: uuidv4(),
    text,
    position,
    createdAt: Date.now(),
  };
}
