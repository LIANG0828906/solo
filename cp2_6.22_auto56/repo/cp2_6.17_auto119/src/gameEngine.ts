import { v4 as uuidv4 } from 'uuid';

export const COLORS = ['#FF4757', '#2ED573', '#3742FA', '#FFA502', '#A29BFE'] as const;
export const COLOR_NAMES = ['red', 'green', 'blue', 'yellow', 'purple'] as const;
export const ROWS = 8;
export const COLS = 8;

export type ColorValue = (typeof COLORS)[number];
export type ColorName = (typeof COLOR_NAMES)[number];

export interface Cell {
  id: string;
  color: ColorValue | null;
}

export interface ColorTarget {
  color: ColorValue;
  name: ColorName;
  target: number;
}

export interface ExplosionResult {
  explodedCells: { row: number; col: number; color: ColorValue }[];
  newGrid: Cell[][];
  scoreGained: number;
  colorCounts: Record<string, number>;
}

export function createGrid(rows: number = ROWS, cols: number = COLS): Cell[][] {
  const grid: Cell[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        id: uuidv4(),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      });
    }
    grid.push(row);
  }
  return grid;
}

export function triggerExplosion(
  grid: Cell[][],
  row: number,
  col: number
): ExplosionResult {
  const targetColor = grid[row][col].color;
  if (!targetColor) {
    return { explodedCells: [], newGrid: grid, scoreGained: 0, colorCounts: {} };
  }

  const visited = new Set<string>();
  const queue: [number, number][] = [[row, col]];
  const exploded: { row: number; col: number; color: ColorValue }[] = [];
  visited.add(`${row},${col}`);

  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    const cell = grid[r][c];
    if (cell.color !== targetColor) continue;

    exploded.push({ row: r, col: c, color: cell.color });

    const directions: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dr, dc] of directions) {
      const nr = r + dr;
      const nc = c + dc;
      const key = `${nr},${nc}`;
      if (
        nr >= 0 && nr < grid.length &&
        nc >= 0 && nc < grid[0].length &&
        !visited.has(key) &&
        grid[nr][nc].color === targetColor
      ) {
        visited.add(key);
        queue.push([nr, nc]);
      }
    }
  }

  if (exploded.length < 2) {
    return { explodedCells: [], newGrid: grid, scoreGained: 0, colorCounts: {} };
  }

  const newGrid = grid.map(r => r.map(c => ({ ...c })));
  const colorCounts: Record<string, number> = {};

  for (const { row: er, col: ec, color } of exploded) {
    newGrid[er][ec] = { id: uuidv4(), color: null };
    colorCounts[color] = (colorCounts[color] || 0) + 1;
  }

  const gridWithGravity = applyGravity(newGrid);
  const scoreGained = calculateScore(exploded.length);

  return {
    explodedCells: exploded,
    newGrid: gridWithGravity,
    scoreGained,
    colorCounts,
  };
}

export function applyGravity(grid: Cell[][]): Cell[][] {
  const newGrid = grid.map(r => r.map(c => ({ ...c })));
  const rows = newGrid.length;
  const cols = newGrid[0].length;

  for (let c = 0; c < cols; c++) {
    const column: Cell[] = [];
    for (let r = 0; r < rows; r++) {
      if (newGrid[r][c].color !== null) {
        column.push(newGrid[r][c]);
      }
    }
    for (let r = rows - 1; r >= 0; r--) {
      const idx = r - (rows - column.length);
      if (idx >= 0) {
        newGrid[r][c] = column[idx];
      } else {
        newGrid[r][c] = { id: uuidv4(), color: null };
      }
    }
  }

  return newGrid;
}

export function calculateScore(explodedCount: number): number {
  if (explodedCount < 2) return 0;
  return explodedCount * (explodedCount + 3) * 5 / 2;
}

export function checkWin(
  targets: ColorTarget[],
  progress: Record<string, number>
): boolean {
  return targets.every(t => (progress[t.color] || 0) >= t.target);
}

export function generateLevel(level: number): ColorTarget[] {
  const numTargets = Math.min(2 + Math.floor(level / 2), COLORS.length);
  const shuffled = [...COLORS].sort(() => Math.random() - 0.5);
  const targets: ColorTarget[] = [];

  for (let i = 0; i < numTargets; i++) {
    const color = shuffled[i];
    const name = COLOR_NAMES[COLORS.indexOf(color as ColorValue)];
    const baseTarget = 3 + level * 2;
    const target = baseTarget + Math.floor(Math.random() * 3);
    targets.push({ color: color as ColorValue, name: name as ColorName, target });
  }

  return targets;
}

export function hasValidMoves(grid: Cell[][]): boolean {
  const rows = grid.length;
  const cols = grid[0].length;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const color = grid[r][c].color;
      if (!color) continue;
      const directions: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (const [dr, dc] of directions) {
        const nr = r + dr;
        const nc = c + dc;
        if (
          nr >= 0 && nr < rows &&
          nc >= 0 && nc < cols &&
          grid[nr][nc].color === color
        ) {
          return true;
        }
      }
    }
  }
  return false;
}
