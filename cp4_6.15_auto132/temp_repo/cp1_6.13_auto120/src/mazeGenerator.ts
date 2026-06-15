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
  elapsedMs: number;
}

export type WallSide = 'top' | 'right' | 'bottom' | 'left';

export const WALL_OFFSETS_RANGE = 2.0;

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

function pointKey(x: number, y: number): string {
  return `${x},${y}`;
}

const SEARCH_DIRS: Array<{
  side: WallSide;
  dx: number;
  dy: number;
}> = [
  { side: 'top', dx: 0, dy: -1 },
  { side: 'right', dx: 1, dy: 0 },
  { side: 'bottom', dx: 0, dy: 1 },
  { side: 'left', dx: -1, dy: 0 }
];

function neighborsOf(
  maze: MazeState,
  x: number,
  y: number
): Array<{ x: number; y: number }> {
  const result: Array<{ x: number; y: number }> = [];
  const cell = maze.grid[y]?.[x];
  if (!cell) return result;
  for (const sd of SEARCH_DIRS) {
    if (cell.walls[sd.side]) continue;
    const nx = x + sd.dx;
    const ny = y + sd.dy;
    if (nx < 0 || nx >= maze.width || ny < 0 || ny >= maze.height) continue;
    result.push({ x: nx, y: ny });
  }
  return result;
}

export function solveMaze(
  maze: MazeState,
  previousPath?: Array<{ x: number; y: number }>
): SolveResult {
  const t0 = performance.now();

  if (previousPath && previousPath.length >= 2) {
    const stillValid = isPathStillValid(maze, previousPath);
    if (stillValid) {
      const explored = reconstructExploredFromPath(maze, previousPath);
      return {
        path: previousPath,
        explored,
        found: true,
        elapsedMs: performance.now() - t0
      };
    }
  }

  return bidirectionalBFS(maze, t0);
}

function isPathStillValid(
  maze: MazeState,
  path: Array<{ x: number; y: number }>
): boolean {
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    let side: WallSide | null = null;
    if (dx === 0 && dy === -1) side = 'top';
    else if (dx === 1 && dy === 0) side = 'right';
    else if (dx === 0 && dy === 1) side = 'bottom';
    else if (dx === -1 && dy === 0) side = 'left';
    if (!side) return false;
    const cell = maze.grid[a.y]?.[a.x];
    if (!cell || cell.walls[side]) return false;
  }
  return true;
}

function reconstructExploredFromPath(
  maze: MazeState,
  path: Array<{ x: number; y: number }>
): Array<{ x: number; y: number }> {
  const visited = new Set<string>();
  const explored: Array<{ x: number; y: number }> = [];
  const q: Array<{ x: number; y: number }> = [maze.start];
  visited.add(pointKey(maze.start.x, maze.start.y));
  const pathSet = new Set(path.map((p) => pointKey(p.x, p.y)));
  const cutoff = Math.min(path.length * 3, maze.width * maze.height);
  while (q.length > 0 && explored.length < cutoff) {
    const cur = q.shift()!;
    explored.push(cur);
    if (cur.x === maze.end.x && cur.y === maze.end.y) break;
    for (const nb of neighborsOf(maze, cur.x, cur.y)) {
      const k = pointKey(nb.x, nb.y);
      if (visited.has(k)) continue;
      visited.add(k);
      if (pathSet.has(k) || explored.length < cutoff / 2) {
        q.push(nb);
      }
    }
  }
  return explored;
}

function bidirectionalBFS(maze: MazeState, t0: number): SolveResult {
  const { start, end, width, height, grid } = maze;
  const explored: Array<{ x: number; y: number }> = [];

  const startKey = pointKey(start.x, start.y);
  const endKey = pointKey(end.x, end.y);

  if (
    start.x < 0 || start.x >= width || start.y < 0 || start.y >= height ||
    end.x < 0 || end.x >= width || end.y < 0 || end.y >= height
  ) {
    return { path: [], explored: [], found: false, elapsedMs: performance.now() - t0 };
  }

  if (startKey === endKey) {
    return {
      path: [{ x: start.x, y: start.y }],
      explored: [{ x: start.x, y: start.y }],
      found: true,
      elapsedMs: performance.now() - t0
    };
  }

  const forwardQ: Array<{ x: number; y: number }> = [{ ...start }];
  const backwardQ: Array<{ x: number; y: number }> = [{ ...end }];
  const forwardVisited = new Map<string, string | null>();
  const backwardVisited = new Map<string, string | null>();
  forwardVisited.set(startKey, null);
  backwardVisited.set(endKey, null);

  let meetingKey: string | null = null;

  while (forwardQ.length > 0 && backwardQ.length > 0) {
    if (forwardQ.length <= backwardQ.length) {
      const sz = forwardQ.length;
      for (let i = 0; i < sz; i++) {
        const cur = forwardQ.shift()!;
        const ck = pointKey(cur.x, cur.y);
        explored.push(cur);
        if (backwardVisited.has(ck)) {
          meetingKey = ck;
          break;
        }
        const cell = grid[cur.y]?.[cur.x];
        if (!cell) continue;
        for (const sd of SEARCH_DIRS) {
          if (cell.walls[sd.side]) continue;
          const nx = cur.x + sd.dx;
          const ny = cur.y + sd.dy;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          const nk = pointKey(nx, ny);
          if (forwardVisited.has(nk)) continue;
          forwardVisited.set(nk, ck);
          forwardQ.push({ x: nx, y: ny });
        }
      }
    } else {
      const sz = backwardQ.length;
      for (let i = 0; i < sz; i++) {
        const cur = backwardQ.shift()!;
        const ck = pointKey(cur.x, cur.y);
        explored.push(cur);
        if (forwardVisited.has(ck)) {
          meetingKey = ck;
          break;
        }
        const cell = grid[cur.y]?.[cur.x];
        if (!cell) continue;
        for (const sd of SEARCH_DIRS) {
          if (cell.walls[sd.side]) continue;
          const nx = cur.x + sd.dx;
          const ny = cur.y + sd.dy;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          const nk = pointKey(nx, ny);
          if (backwardVisited.has(nk)) continue;
          backwardVisited.set(nk, ck);
          backwardQ.push({ x: nx, y: ny });
        }
      }
    }
    if (meetingKey) break;
  }

  let path: Array<{ x: number; y: number }> = [];
  if (meetingKey) {
    const forwardPath: string[] = [];
    let cur: string | null | undefined = meetingKey;
    while (cur) {
      forwardPath.push(cur);
      cur = forwardVisited.get(cur) ?? null;
    }
    forwardPath.reverse();

    const backwardPath: string[] = [];
    cur = backwardVisited.get(meetingKey) ?? null;
    while (cur) {
      backwardPath.push(cur);
      cur = backwardVisited.get(cur) ?? null;
    }

    const allKeys = [...forwardPath, ...backwardPath];
    for (const k of allKeys) {
      const [xs, ys] = k.split(',');
      path.push({ x: parseInt(xs, 10), y: parseInt(ys, 10) });
    }
  }

  return {
    path,
    explored,
    found: meetingKey !== null,
    elapsedMs: performance.now() - t0
  };
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

  const newGrid = maze.grid.map((row) =>
    row.map((c) => ({ ...c, walls: { ...c.walls }, wallOffsets: { ...c.wallOffsets } }))
  );
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

  const hitDist = Math.max(wallThickness + 2, cellSize * 0.18);

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
