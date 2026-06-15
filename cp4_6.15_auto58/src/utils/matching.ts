import { v4 as uuidv4 } from 'uuid';
import type { ThemeTile } from '@/data/themes';

export interface Tile {
  id: string;
  tileId: string;
  tileIndex: number;
  row: number;
  col: number;
  matched: boolean;
  tileData: ThemeTile;
}

export interface Point {
  row: number;
  col: number;
}

export interface PathResult {
  matched: boolean;
  path: Point[];
}

export type Difficulty = 'easy' | 'normal';

export interface DifficultyConfig {
  gridSize: number;
  tileTypes: number;
  label: string;
}

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: { gridSize: 10, tileTypes: 3, label: '简易' },
  normal: { gridSize: 12, tileTypes: 6, label: '普通' },
};

export function generateBoard(tiles: ThemeTile[], difficulty: Difficulty): Tile[] {
  const config = DIFFICULTY_CONFIG[difficulty];
  const { gridSize, tileTypes: typeCount } = config;
  const totalTiles = gridSize * gridSize;

  const selectedTiles = tiles.slice(0, Math.min(typeCount, tiles.length));
  const pairsNeeded = totalTiles / 2;
  const pairsPerType = Math.floor(pairsNeeded / selectedTiles.length);
  const extraPairs = pairsNeeded % selectedTiles.length;

  const tilePool: { tileData: ThemeTile; tileIndex: number }[] = [];
  selectedTiles.forEach((tile, tileIndex) => {
    const count = pairsPerType + (tileIndex < extraPairs ? 1 : 0);
    for (let i = 0; i < count * 2; i++) {
      tilePool.push({ tileData: tile, tileIndex });
    }
  });

  shuffleArray(tilePool);

  const board: Tile[] = [];
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const index = row * gridSize + col;
      const { tileData, tileIndex } = tilePool[index];
      board.push({
        id: uuidv4(),
        tileId: tileData.id,
        tileIndex,
        row,
        col,
        matched: false,
        tileData,
      });
    }
  }

  return board;
}

function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

export function canMatch(
  tile1: Tile,
  tile2: Tile,
  board: Tile[],
  gridSize: number
): PathResult {
  if (tile1.id === tile2.id || tile1.tileId !== tile2.tileId) {
    return { matched: false, path: [] };
  }

  const grid = createGrid(board, gridSize);

  const p1: Point = { row: tile1.row + 1, col: tile1.col + 1 };
  const p2: Point = { row: tile2.row + 1, col: tile2.col + 1 };

  if (isStraightLine(p1, p2, grid)) {
    return { matched: true, path: [p1, p2] };
  }

  const oneCorner = checkOneCorner(p1, p2, grid);
  if (oneCorner) {
    return { matched: true, path: [p1, oneCorner, p2] };
  }

  const twoCorners = checkTwoCorners(p1, p2, grid);
  if (twoCorners) {
    return { matched: true, path: [p1, twoCorners[0], twoCorners[1], p2] };
  }

  return { matched: false, path: [] };
}

function createGrid(board: Tile[], gridSize: number): boolean[][] {
  const grid: boolean[][] = [];
  const paddedSize = gridSize + 2;

  for (let row = 0; row < paddedSize; row++) {
    grid[row] = [];
    for (let col = 0; col < paddedSize; col++) {
      if (row === 0 || row === paddedSize - 1 || col === 0 || col === paddedSize - 1) {
        grid[row][col] = true;
      } else {
        const tile = board.find((t) => t.row === row - 1 && t.col === col - 1);
        grid[row][col] = !tile || tile.matched;
      }
    }
  }

  return grid;
}

function isStraightLine(p1: Point, p2: Point, grid: boolean[][]): boolean {
  if (p1.row === p2.row) {
    const minCol = Math.min(p1.col, p2.col);
    const maxCol = Math.max(p1.col, p2.col);
    for (let col = minCol + 1; col < maxCol; col++) {
      if (!grid[p1.row][col]) return false;
    }
    return true;
  }
  if (p1.col === p2.col) {
    const minRow = Math.min(p1.row, p2.row);
    const maxRow = Math.max(p1.row, p2.row);
    for (let row = minRow + 1; row < maxRow; row++) {
      if (!grid[row][p1.col]) return false;
    }
    return true;
  }
  return false;
}

function checkOneCorner(p1: Point, p2: Point, grid: boolean[][]): Point | null {
  const corner1: Point = { row: p1.row, col: p2.col };
  if (grid[corner1.row][corner1.col] && isStraightLine(p1, corner1, grid) && isStraightLine(corner1, p2, grid)) {
    return corner1;
  }

  const corner2: Point = { row: p2.row, col: p1.col };
  if (grid[corner2.row][corner2.col] && isStraightLine(p1, corner2, grid) && isStraightLine(corner2, p2, grid)) {
    return corner2;
  }

  return null;
}

function checkTwoCorners(p1: Point, p2: Point, grid: boolean[][]): [Point, Point] | null {
  const rows = grid.length;
  const cols = grid[0].length;

  for (let col = 0; col < cols; col++) {
    const c1: Point = { row: p1.row, col };
    const c2: Point = { row: p2.row, col };
    if (
      grid[c1.row][c1.col] &&
      grid[c2.row][c2.col] &&
      isStraightLine(p1, c1, grid) &&
      isStraightLine(c1, c2, grid) &&
      isStraightLine(c2, p2, grid)
    ) {
      return [c1, c2];
    }
  }

  for (let row = 0; row < rows; row++) {
    const c1: Point = { row, col: p1.col };
    const c2: Point = { row, col: p2.col };
    if (
      grid[c1.row][c1.col] &&
      grid[c2.row][c2.col] &&
      isStraightLine(p1, c1, grid) &&
      isStraightLine(c1, c2, grid) &&
      isStraightLine(c2, p2, grid)
    ) {
      return [c1, c2];
    }
  }

  return null;
}

export function hasAnyValidMove(board: Tile[], gridSize: number): boolean {
  const unmatchedTiles = board.filter((t) => !t.matched);

  for (let i = 0; i < unmatchedTiles.length; i++) {
    for (let j = i + 1; j < unmatchedTiles.length; j++) {
      if (unmatchedTiles[i].tileId === unmatchedTiles[j].tileId) {
        const result = canMatch(unmatchedTiles[i], unmatchedTiles[j], board, gridSize);
        if (result.matched) return true;
      }
    }
  }

  return false;
}
