export interface Cell {
  x: number;
  y: number;
  walls: { top: boolean; right: boolean; bottom: boolean; left: boolean };
  wallOffsets: { top: number; right: number; bottom: number; left: number };
}

export interface MazeState {
  grid: Cell[][];
  width: number;
  height: number;
  start: { x: number; y: number };
  end: { x: number; y: number };
}

export interface SolveResult {
  path: Array<{ x: number; y: number }>;
  explored: Array<{ x: number; y: number }>;
  found: boolean;
}

export type WallSide = 'top' | 'right' | 'bottom' | 'left';

const WALL_OFFSETS_RANGE = 1.5;

function randomOffset(): number {
  return (Math.random() - 0.5) * 2 * WALL_OFFSETS_RANGE;
}

function createCell(x: number, y: number): Cell {
  return {
    x,
    y,
    walls: { top: true, right: true, bottom: true, left: true },
    wallOffsets: {
      top: randomOffset(),
      right: randomOffset(),
      bottom: randomOffset(),
      left: randomOffset()
    }
  };
}

export function generateMaze(width: number, height: number): MazeState {
  const grid: Cell[][] = [];
  for (let y = 0; y < height; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < width; x++) {
      row.push(createCell(x, y));
    }
    grid.push(row);
  }

  const visited = new Set<string>();
  const key = (x: number, y: number) => `${x},${y}`;
  const stack: Array<{ x: number; y: number }> = [];

  const startX = 0;
  const startY = 0;
  stack.push({ x: startX, y: startY });
  visited.add(key(startX, startY));

  const directions: Array<{
    dx: number;
    dy: number;
    from: WallSide;
    to: WallSide;
  }> = [
    { dx: 0, dy: -1, from: 'top', to: 'bottom' },
    { dx: 1, dy: 0, from: 'right', to: 'left' },
    { dx: 0, dy: 1, from: 'bottom', to: 'top' },
    { dx: -1, dy: 0, from: 'left', to: 'right' }
  ];

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors: Array<{
      nx: number;
      ny: number;
      from: WallSide;
      to: WallSide;
    }> = [];

    for (const dir of directions) {
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;
      if (
        nx >= 0 &&
        nx < width &&
        ny >= 0 &&
        ny < height &&
        !visited.has(key(nx, ny))
      ) {
        neighbors.push({ nx, ny, from: dir.from, to: dir.to });
      }
    }

    if (neighbors.length > 0) {
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      grid[current.y][current.x].walls[next.from] = false;
      grid[next.ny][next.nx].walls[next.to] = false;

      visited.add(key(next.nx, next.ny));
      stack.push({ x: next.nx, y: next.ny });
    } else {
      stack.pop();
    }
  }

  return {
    grid,
    width,
    height,
    start: { x: 0, y: 0 },
    end: { x: width - 1, y: height - 1 }
  };
}

function canPass(
  maze: MazeState,
  x: number,
  y: number,
  dir: WallSide
): boolean {
  const cell = maze.grid[y]?.[x];
  if (!cell) return false;
  return !cell.walls[dir];
}

function pointKey(x: number, y: number): string {
  return `${x},${y}`;
}

export function solveMaze(maze: MazeState): SolveResult {
  const { start, end, width, height, grid } = maze;
  const explored: Array<{ x: number; y: number }> = [];
  const cameFrom = new Map<string, string>();
  const visited = new Set<string>();

  if (
    start.x < 0 ||
    start.x >= width ||
    start.y < 0 ||
    start.y >= height ||
    end.x < 0 ||
    end.x >= width ||
    end.y < 0 ||
    end.y >= height
  ) {
    return { path: [], explored: [], found: false };
  }

  const queue: Array<{ x: number; y: number }> = [];
  const startKey = pointKey(start.x, start.y);
  queue.push({ ...start });
  visited.add(startKey);
  const endKey = pointKey(end.x, end.y);

  const searchDirs: Array<{
    side: WallSide;
    dx: number;
    dy: number;
  }> = [
    { side: 'top', dx: 0, dy: -1 },
    { side: 'right', dx: 1, dy: 0 },
    { side: 'bottom', dx: 0, dy: 1 },
    { side: 'left', dx: -1, dy: 0 }
  ];

  let found = false;

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentKey = pointKey(current.x, current.y);
    explored.push(current);

    if (currentKey === endKey) {
      found = true;
      break;
    }

    const cell = grid[current.y][current.x];
    if (!cell) continue;

    for (const sd of searchDirs) {
      if (cell.walls[sd.side]) continue;
      const nx = current.x + sd.dx;
      const ny = current.y + sd.dy;
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      const nk = pointKey(nx, ny);
      if (visited.has(nk)) continue;
      visited.add(nk);
      cameFrom.set(nk, currentKey);
      queue.push({ x: nx, y: ny });
    }
  }

  const path: Array<{ x: number; y: number }> = [];
  if (found) {
    let cur: string | undefined = endKey;
    const pathKeys: string[] = [];
    while (cur) {
      pathKeys.push(cur);
      cur = cameFrom.get(cur);
    }
    pathKeys.reverse();
    for (const k of pathKeys) {
      const [xs, ys] = k.split(',');
      path.push({ x: parseInt(xs, 10), y: parseInt(ys, 10) });
    }
  }

  return { path, explored, found };
}

export function toggleWall(
  maze: MazeState,
  cellX: number,
  cellY: number,
  side: WallSide,
  addWall: boolean
): MazeState {
  if (
    cellX < 0 ||
    cellX >= maze.width ||
    cellY < 0 ||
    cellY >= maze.height
  ) {
    return maze;
  }

  const newGrid = maze.grid.map((row) => row.map((c) => ({ ...c, walls: { ...c.walls } })));
  newGrid[cellY][cellX].walls[side] = addWall;

  const opposites: Record<WallSide, WallSide> = {
    top: 'bottom',
    right: 'left',
    bottom: 'top',
    left: 'right'
  };
  const deltas: Record<WallSide, { dx: number; dy: number }> = {
    top: { dx: 0, dy: -1 },
    right: { dx: 1, dy: 0 },
    bottom: { dx: 0, dy: 1 },
    left: { dx: -1, dy: 0 }
  };
  const d = deltas[side];
  const nx = cellX + d.dx;
  const ny = cellY + d.dy;
  if (nx >= 0 && nx < maze.width && ny >= 0 && ny < maze.height) {
    newGrid[ny][nx].walls[opposites[side]] = addWall;
  }

  return { ...maze, grid: newGrid };
}

export function findWallAtPosition(
  maze: MazeState,
  clickX: number,
  clickY: number,
  cellSize: number,
  offsetX: number,
  offsetY: number,
  wallThickness: number = 3
): { cellX: number; cellY: number; side: WallSide } | null {
  const relX = clickX - offsetX;
  const relY = clickY - offsetY;

  const cellX = Math.floor(relX / cellSize);
  const cellY = Math.floor(relY / cellSize);

  if (cellX < 0 || cellX >= maze.width || cellY < 0 || cellY >= maze.height) {
    return null;
  }

  const localX = relX - cellX * cellSize;
  const localY = relY - cellY * cellSize;

  const hitDist = wallThickness + 2;

  const distTop = localY;
  const distBottom = cellSize - localY;
  const distLeft = localX;
  const distRight = cellSize - localX;

  let minDist = Infinity;
  let bestSide: WallSide | null = null;

  if (distTop < hitDist && distTop < minDist) {
    minDist = distTop;
    bestSide = 'top';
  }
  if (distBottom < hitDist && distBottom < minDist) {
    minDist = distBottom;
    bestSide = 'bottom';
  }
  if (distLeft < hitDist && distLeft < minDist) {
    minDist = distLeft;
    bestSide = 'left';
  }
  if (distRight < hitDist && distRight < minDist) {
    minDist = distRight;
    bestSide = 'right';
  }

  if (bestSide) {
    return { cellX, cellY, side: bestSide };
  }
  return null;
}
