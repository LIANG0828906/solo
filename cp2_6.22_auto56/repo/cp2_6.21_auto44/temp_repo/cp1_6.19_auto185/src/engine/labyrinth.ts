import type { Cell, Position } from '@/types/game';

export const MAZE_WIDTH = 10;
export const MAZE_HEIGHT = 10;

export function generateMaze(width: number, height: number): Cell[][] {
  const grid: Cell[][] = [];

  for (let y = 0; y < height; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < width; x++) {
      row.push({ type: 'wall', x, y });
    }
    grid.push(row);
  }

  const stack: Position[] = [];
  const startX = 0;
  const startY = height - 1;

  grid[startY][startX].type = 'floor';
  stack.push({ x: startX, y: startY });

  const directions = [
    { dx: 0, dy: -2 },
    { dx: 2, dy: 0 },
    { dx: 0, dy: 2 },
    { dx: -2, dy: 0 },
  ];

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors: { x: number; y: number; wallX: number; wallY: number }[] = [];

    for (const dir of directions) {
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;
      const wallX = current.x + dir.dx / 2;
      const wallY = current.y + dir.dy / 2;

      if (nx >= 0 && nx < width && ny >= 0 && ny < height && grid[ny][nx].type === 'wall') {
        neighbors.push({ x: nx, y: ny, wallX, wallY });
      }
    }

    if (neighbors.length > 0) {
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      grid[next.wallY][next.wallX].type = 'floor';
      grid[next.y][next.x].type = 'floor';
      stack.push({ x: next.x, y: next.y });
    } else {
      stack.pop();
    }
  }

  grid[0][width - 1].type = 'floor';

  if (width > 1 && grid[0][width - 2].type === 'wall') {
    grid[0][width - 2].type = 'floor';
  }
  if (height > 1 && grid[1][width - 1].type === 'wall') {
    grid[1][width - 1].type = 'floor';
  }

  return grid;
}

export function isWalkable(grid: Cell[][], x: number, y: number): boolean {
  if (x < 0 || x >= grid[0].length || y < 0 || y >= grid.length) {
    return false;
  }
  return grid[y][x].type === 'floor';
}

export function getWalkableCells(grid: Cell[][]): Position[] {
  const cells: Position[] = [];
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      if (grid[y][x].type === 'floor') {
        cells.push({ x, y });
      }
    }
  }
  return cells;
}

export function manhattanDistance(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function areAdjacent(a: Position, b: Position): boolean {
  return manhattanDistance(a, b) === 1;
}
