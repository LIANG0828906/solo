export type Position = {
  x: number;
  y: number;
};

export type Grid = boolean[][];

export const GRID_SIZE = 8;

const DIRECTIONS = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
];

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function isInBounds(x: number, y: number): boolean {
  return x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE;
}

function isUnvisited(grid: Grid, x: number, y: number): boolean {
  return isInBounds(x, y) && !grid[y][x];
}

function getUnvisitedNeighbors(grid: Grid, x: number, y: number): Position[] {
  const neighbors: Position[] = [];
  for (const dir of DIRECTIONS) {
    const nx = x + dir.x;
    const ny = y + dir.y;
    if (isUnvisited(grid, nx, ny)) {
      neighbors.push({ x: nx, y: ny });
    }
  }
  return shuffle(neighbors);
}

function dfsGenerate(grid: Grid, x: number, y: number): void {
  grid[y][x] = true;
  const neighbors = getUnvisitedNeighbors(grid, x, y);
  for (const neighbor of neighbors) {
    if (!grid[neighbor.y][neighbor.x]) {
      dfsGenerate(grid, neighbor.x, neighbor.y);
    }
  }
}

export function generateConnectedGrid(): Grid {
  const grid: Grid = Array.from({ length: GRID_SIZE }, () =>
    Array(GRID_SIZE).fill(false)
  );
  dfsGenerate(grid, 0, 0);
  return grid;
}

export function generateGridWithTarget(target: Position): Grid {
  if (!isInBounds(target.x, target.y)) {
    throw new Error(`Target position out of bounds: (${target.x}, ${target.y})`);
  }
  const grid = generateConnectedGrid();
  return grid;
}

export function findPathBFS(
  grid: Grid,
  start: Position,
  end: Position
): Position[] | null {
  if (!isInBounds(start.x, start.y) || !isInBounds(end.x, end.y)) {
    return null;
  }
  if (!grid[start.y][start.x] || !grid[end.y][end.x]) {
    return null;
  }

  const queue: Position[] = [start];
  const visited = new Set<string>();
  const parent = new Map<string, Position | null>();
  const startKey = `${start.x},${start.y}`;
  visited.add(startKey);
  parent.set(startKey, null);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentKey = `${current.x},${current.y}`;

    if (current.x === end.x && current.y === end.y) {
      const path: Position[] = [];
      let node: Position | null = current;
      while (node !== null) {
        path.unshift(node);
        node = parent.get(`${node.x},${node.y}`) || null;
      }
      return path;
    }

    for (const dir of DIRECTIONS) {
      const nx = current.x + dir.x;
      const ny = current.y + dir.y;
      const neighborKey = `${nx},${ny}`;

      if (
        isInBounds(nx, ny) &&
        grid[ny][nx] &&
        !visited.has(neighborKey)
      ) {
        visited.add(neighborKey);
        parent.set(neighborKey, current);
        queue.push({ x: nx, y: ny });
      }
    }
  }

  return null;
}

export function findPathDFS(
  grid: Grid,
  start: Position,
  end: Position
): Position[] | null {
  if (!isInBounds(start.x, start.y) || !isInBounds(end.x, end.y)) {
    return null;
  }
  if (!grid[start.y][start.x] || !grid[end.y][end.x]) {
    return null;
  }

  const path: Position[] = [];
  const visited = new Set<string>();

  function dfs(x: number, y: number): boolean {
    const key = `${x},${y}`;
    if (visited.has(key)) return false;
    if (!isInBounds(x, y) || !grid[y][x]) return false;

    visited.add(key);
    path.push({ x, y });

    if (x === end.x && y === end.y) return true;

    const shuffledDirs = shuffle(DIRECTIONS);
    for (const dir of shuffledDirs) {
      if (dfs(x + dir.x, y + dir.y)) return true;
    }

    path.pop();
    return false;
  }

  if (dfs(start.x, start.y)) {
    return path;
  }
  return null;
}

export function generateRandomPath(
  target: Position
): { grid: Grid; path: Position[] } {
  const grid = generateGridWithTarget(target);
  const path = findPathBFS(grid, { x: 0, y: 0 }, target);
  if (!path) {
    return generateRandomPath(target);
  }
  return { grid, path };
}

export function isPositionReachable(
  grid: Grid,
  position: Position
): boolean {
  if (!isInBounds(position.x, position.y)) return false;
  if (!grid[position.y][position.x]) return false;
  const path = findPathBFS(grid, { x: 0, y: 0 }, position);
  return path !== null;
}

export function getRandomTarget(): Position {
  return {
    x: Math.floor(Math.random() * GRID_SIZE),
    y: Math.floor(Math.random() * GRID_SIZE),
  };
}
