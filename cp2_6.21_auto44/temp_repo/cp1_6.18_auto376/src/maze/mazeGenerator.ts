export interface Cell {
  x: number;
  y: number;
  walls: { top: boolean; right: boolean; bottom: boolean; left: boolean };
  isPath: boolean;
  isSolution: boolean;
}

export interface MazeData {
  width: number;
  height: number;
  grid: Cell[][];
  solutionPath: Array<{ x: number; y: number }>;
  seed: number;
}

class SeededRandom {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed >>> 0;
  }
  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
    return this.seed / 0xffffffff;
  }
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

function createFullGrid(width: number, height: number): Cell[][] {
  const grid: Cell[][] = [];
  for (let y = 0; y < height; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < width; x++) {
      row.push({
        x,
        y,
        walls: { top: true, right: true, bottom: true, left: true },
        isPath: false,
        isSolution: false,
      });
    }
    grid.push(row);
  }
  return grid;
}

function recursiveDivide(
  grid: Cell[][],
  x: number,
  y: number,
  w: number,
  h: number,
  rng: SeededRandom
): void {
  if (w <= 1 || h <= 1) return;

  const horizontal = w < h ? true : h < w ? false : rng.next() > 0.5;

  if (horizontal) {
    const wallY = y + rng.int(0, h - 2);
    const passageX = x + rng.int(0, w - 1);
    for (let i = x; i < x + w; i++) {
      if (i !== passageX) {
        grid[wallY][i].walls.bottom = true;
        if (wallY + 1 < grid.length) {
          grid[wallY + 1][i].walls.top = true;
        }
      } else {
        grid[wallY][i].walls.bottom = false;
        if (wallY + 1 < grid.length) {
          grid[wallY + 1][i].walls.top = false;
        }
      }
    }
    recursiveDivide(grid, x, y, w, wallY - y + 1, rng);
    recursiveDivide(grid, x, wallY + 1, w, y + h - (wallY + 1), rng);
  } else {
    const wallX = x + rng.int(0, w - 2);
    const passageY = y + rng.int(0, h - 1);
    for (let i = y; i < y + h; i++) {
      if (i !== passageY) {
        grid[i][wallX].walls.right = true;
        if (wallX + 1 < grid[0].length) {
          grid[i][wallX + 1].walls.left = true;
        }
      } else {
        grid[i][wallX].walls.right = false;
        if (wallX + 1 < grid[0].length) {
          grid[i][wallX + 1].walls.left = false;
        }
      }
    }
    recursiveDivide(grid, x, y, wallX - x + 1, h, rng);
    recursiveDivide(grid, wallX + 1, y, x + w - (wallX + 1), h, rng);
  }
}

function removeAllWalls(grid: Cell[][]): void {
  for (const row of grid) {
    for (const cell of row) {
      cell.walls = { top: false, right: false, bottom: false, left: false };
    }
  }
}

function markOuterWalls(grid: Cell[][], width: number, height: number): void {
  for (let x = 0; x < width; x++) {
    grid[0][x].walls.top = true;
    grid[height - 1][x].walls.bottom = true;
  }
  for (let y = 0; y < height; y++) {
    grid[y][0].walls.left = true;
    grid[y][width - 1].walls.right = true;
  }
}

function findSolutionPath(
  grid: Cell[][],
  start: { x: number; y: number },
  end: { x: number; y: number }
): Array<{ x: number; y: number }> {
  const queue: Array<{ x: number; y: number; path: Array<{ x: number; y: number }> }> = [
    { ...start, path: [start] },
  ];
  const visited = new Set<string>();
  visited.add(`${start.x},${start.y}`);

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.x === end.x && current.y === end.y) {
      return current.path;
    }
    const cell = grid[current.y][current.x];
    const dirs = [
      { dx: 0, dy: -1, wall: 'top' as const },
      { dx: 1, dy: 0, wall: 'right' as const },
      { dx: 0, dy: 1, wall: 'bottom' as const },
      { dx: -1, dy: 0, wall: 'left' as const },
    ];
    for (const d of dirs) {
      if (cell.walls[d.wall]) continue;
      const nx = current.x + d.dx;
      const ny = current.y + d.dy;
      const key = `${nx},${ny}`;
      if (visited.has(key)) continue;
      if (ny < 0 || ny >= grid.length || nx < 0 || nx >= grid[0].length) continue;
      visited.add(key);
      queue.push({ x: nx, y: ny, path: [...current.path, { x: nx, y: ny }] });
    }
  }
  return [];
}

export function generateMaze(width: number, height: number, seed?: number): MazeData {
  const finalSeed = seed ?? Math.floor(Math.random() * 1000000);
  const rng = new SeededRandom(finalSeed);

  const grid = createFullGrid(width, height);
  removeAllWalls(grid);
  recursiveDivide(grid, 0, 0, width, height, rng);
  markOuterWalls(grid, width, height);

  for (const row of grid) {
    for (const cell of row) {
      cell.isPath = true;
    }
  }

  const start = { x: 0, y: 0 };
  const end = { x: width - 1, y: height - 1 };
  const solutionPath = findSolutionPath(grid, start, end);

  for (const p of solutionPath) {
    grid[p.y][p.x].isSolution = true;
  }

  return { width, height, grid, solutionPath, seed: finalSeed };
}
