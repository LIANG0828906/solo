export type CellType = 'path' | 'obstacle' | 'empty';

export interface Cell {
  x: number;
  y: number;
  type: CellType;
}

export const GRID_SIZE = 12;
export const START_POINT = { x: 0, y: 6 };
export const END_POINT = { x: 11, y: 6 };

export interface MapData {
  grid: Cell[][];
  path: { x: number; y: number }[];
}

export class MapGenerator {
  static generate(): MapData {
    const grid: Cell[][] = this.createEmptyGrid();
    const path = this.generatePath();
    
    path.forEach(({ x, y }) => {
      grid[y][x].type = 'path';
    });
    
    this.placeObstacles(grid, path);
    
    return { grid, path };
  }

  private static createEmptyGrid(): Cell[][] {
    const grid: Cell[][] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      grid[y] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        grid[y][x] = { x, y, type: 'empty' };
      }
    }
    return grid;
  }

  private static generatePath(): { x: number; y: number }[] {
    const path: { x: number; y: number }[] = [];
    let current = { ...START_POINT };
    path.push({ ...current });

    while (current.x < END_POINT.x) {
      const moves = this.getValidMoves(current, path);
      if (moves.length === 0) break;

      const nextMove = moves[Math.floor(Math.random() * moves.length)];
      current = nextMove;
      path.push({ ...current });
    }

    if (current.x !== END_POINT.x || current.y !== END_POINT.y) {
      path.push({ ...END_POINT });
    }

    return this.smoothPath(path);
  }

  private static getValidMoves(
    current: { x: number; y: number },
    path: { x: number; y: number }[]
  ): { x: number; y: number }[] {
    const moves: { x: number; y: number }[] = [];
    const directions = [
      { dx: 1, dy: 0 },
      { dx: 1, dy: -1 },
      { dx: 1, dy: 1 },
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
    ];

    for (const dir of directions) {
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;

      if (
        nx >= 0 && nx < GRID_SIZE &&
        ny >= 0 && ny < GRID_SIZE &&
        !path.some(p => p.x === nx && p.y === ny)
      ) {
        const distToEnd = Math.abs(nx - END_POINT.x) + Math.abs(ny - END_POINT.y);
        if (distToEnd <= Math.abs(current.x - END_POINT.x) + Math.abs(current.y - END_POINT.y) + 1) {
          moves.push({ x: nx, y: ny });
        }
      }
    }

    return moves;
  }

  private static smoothPath(path: { x: number; y: number }[]): { x: number; y: number }[] {
    const smoothed: { x: number; y: number }[] = [];
    for (let i = 0; i < path.length; i++) {
      if (i === 0 || i === path.length - 1) {
        smoothed.push(path[i]);
      } else {
        const prev = path[i - 1];
        const curr = path[i];
        const next = path[i + 1];
        if (!(prev.x === curr.x && curr.x === next.x) && !(prev.y === curr.y && curr.y === next.y)) {
          smoothed.push(curr);
        }
      }
    }
    return smoothed.length >= 2 ? smoothed : path;
  }

  private static placeObstacles(grid: Cell[][], path: { x: number; y: number }[]): void {
    const totalCells = GRID_SIZE * GRID_SIZE;
    const minObstacles = Math.floor(totalCells * 0.15);
    const maxObstacles = Math.floor(totalCells * 0.25);
    const targetObstacles = Math.floor(Math.random() * (maxObstacles - minObstacles + 1)) + minObstacles;

    const emptyCells: { x: number; y: number }[] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (grid[y][x].type === 'empty') {
          emptyCells.push({ x, y });
        }
      }
    }

    this.shuffleArray(emptyCells);

    let placed = 0;
    for (const cell of emptyCells) {
      if (placed >= targetObstacles) break;

      const isAdjacentToPath = this.isAdjacentTo(cell, path);
      if (!isAdjacentToPath) {
        grid[cell.y][cell.x].type = 'obstacle';
        placed++;
      }
    }
  }

  private static isAdjacentTo(cell: { x: number; y: number }, path: { x: number; y: number }[]): boolean {
    for (const p of path) {
      const dx = Math.abs(cell.x - p.x);
      const dy = Math.abs(cell.y - p.y);
      if (dx <= 1 && dy <= 1 && (dx + dy) <= 2) {
        return true;
      }
    }
    return false;
  }

  private static shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}
