import type { MazeGrid, Point } from './types';

const SHUFFLE_COUNT = 4;

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function getNeighbors(x: number, y: number, width: number, height: number): Point[] {
  const neighbors: Point[] = [];
  if (x > 1) neighbors.push({ x: x - 2, y });
  if (x < width - 2) neighbors.push({ x: x + 2, y });
  if (y > 1) neighbors.push({ x, y: y - 2 });
  if (y < height - 2) neighbors.push({ x, y: y + 2 });
  return neighbors;
}

function ensureConnectivity(grid: MazeGrid, start: Point, end: Point): void {
  const width = grid[0].length;
  const height = grid.length;
  const visited = new Set<string>();
  const queue: Point[] = [start];
  visited.add(`${start.x},${start.y}`);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const { x, y } = current;

    if (x === end.x && y === end.y) return;

    const directions = shuffle([
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 },
    ]);

    for (const { dx, dy } of directions) {
      const nx = x + dx;
      const ny = y + dy;
      const key = `${nx},${ny}`;

      if (nx >= 0 && nx < width && ny >= 0 && ny < height && !visited.has(key)) {
        visited.add(key);
        if (grid[ny][nx] === 'wall') {
          grid[ny][nx] = 'path';
        }
        queue.push({ x: nx, y: ny });
      }
    }
  }
}

export function generateMaze(width: number, height: number): MazeGrid {
  const startTime = performance.now();

  const grid: MazeGrid = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => 'wall' as const)
  );

  const startX = 0;
  const startY = 0;
  grid[startY][startX] = 'path';

  const frontier: Point[] = [];
  const initialNeighbors = getNeighbors(startX, startY, width, height);
  frontier.push(...initialNeighbors);

  while (frontier.length > 0) {
    const randomIndex = Math.floor(Math.random() * frontier.length);
    const current = frontier.splice(randomIndex, 1)[0];
    const { x, y } = current;

    if (grid[y][x] === 'path') continue;

    grid[y][x] = 'path';

    const neighbors = getNeighbors(x, y, width, height);
    const pathNeighbors = neighbors.filter((n) => grid[n.y][n.x] === 'path');

    if (pathNeighbors.length > 0) {
      const connectTo = pathNeighbors[Math.floor(Math.random() * pathNeighbors.length)];
      const wallX = (x + connectTo.x) / 2;
      const wallY = (y + connectTo.y) / 2;
      grid[wallY][wallX] = 'path';
    }

    for (const n of neighbors) {
      if (grid[n.y][n.x] === 'wall') {
        frontier.push(n);
      }
    }
  }

  grid[height - 1][width - 1] = 'path';
  if (height > 1 && grid[height - 1][width - 2] === 'wall') {
    grid[height - 1][width - 2] = 'path';
  }
  if (width > 1 && grid[height - 2][width - 1] === 'wall') {
    grid[height - 2][width - 1] = 'path';
  }

  ensureConnectivity(grid, { x: 0, y: 0 }, { x: width - 1, y: height - 1 });

  let pathCount = 0;
  const totalCells = width * height;
  const targetPathCount = Math.floor(totalCells * 0.5);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y][x] === 'path') pathCount++;
    }
  }

  if (pathCount < targetPathCount) {
    const wallPositions: Point[] = [];
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (grid[y][x] === 'wall') {
          wallPositions.push({ x, y });
        }
      }
    }

    const shuffledWalls = shuffle(wallPositions);
    const toConvert = Math.min(targetPathCount - pathCount, shuffledWalls.length);

    for (let i = 0; i < toConvert; i++) {
      const pos = shuffledWalls[i];
      grid[pos.y][pos.x] = 'path';
    }
  }

  for (let i = 0; i < SHUFFLE_COUNT; i++) {
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (grid[y][x] === 'wall' && Math.random() < 0.15) {
          grid[y][x] = 'path';
        }
      }
    }
  }

  const endTime = performance.now();
  const duration = endTime - startTime;

  if (duration > 50) {
    console.warn(`迷宫生成超时: ${duration.toFixed(2)}ms，建议缩小迷宫尺寸`);
  }

  return grid;
}

export function measurePerformance<T>(fn: () => T, threshold: number = 50): T {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  if (duration > threshold) {
    console.warn(`计算超时: ${duration.toFixed(2)}ms，建议缩小迷宫尺寸`);
  }
  return result;
}
