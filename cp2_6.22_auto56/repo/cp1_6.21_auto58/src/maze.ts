export type CellType = 'wall' | 'path';

export interface Position {
  x: number;
  y: number;
}

interface AStarNode {
  position: Position;
  g: number;
  h: number;
  f: number;
  parent: AStarNode | null;
}

export function generateMaze(size: number): CellType[][] {
  const maze: CellType[][] = [];
  for (let y = 0; y < size; y++) {
    maze[y] = [];
    for (let x = 0; x < size; x++) {
      maze[y][x] = 'wall';
    }
  }

  const stack: Position[] = [];
  const start: Position = { x: 0, y: 0 };
  maze[start.y][start.x] = 'path';
  stack.push(start);

  const directions = [
    { dx: 0, dy: -2 },
    { dx: 2, dy: 0 },
    { dx: 0, dy: 2 },
    { dx: -2, dy: 0 },
  ];

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors: { pos: Position; mid: Position }[] = [];

    for (const dir of directions) {
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;
      const mx = current.x + dir.dx / 2;
      const my = current.y + dir.dy / 2;

      if (nx >= 0 && nx < size && ny >= 0 && ny < size && maze[ny][nx] === 'wall') {
        neighbors.push({
          pos: { x: nx, y: ny },
          mid: { x: mx, y: my },
        });
      }
    }

    if (neighbors.length > 0) {
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      maze[next.mid.y][next.mid.x] = 'path';
      maze[next.pos.y][next.pos.x] = 'path';
      stack.push(next.pos);
    } else {
      stack.pop();
    }
  }

  for (let i = 0; i < size * 2; i++) {
    const x = Math.floor(Math.random() * (size - 2)) + 1;
    const y = Math.floor(Math.random() * (size - 2)) + 1;
    if (maze[y][x] === 'wall') {
      let pathCount = 0;
      if (y > 0 && maze[y - 1][x] === 'path') pathCount++;
      if (y < size - 1 && maze[y + 1][x] === 'path') pathCount++;
      if (x > 0 && maze[y][x - 1] === 'path') pathCount++;
      if (x < size - 1 && maze[y][x + 1] === 'path') pathCount++;
      if (pathCount >= 2) {
        maze[y][x] = 'path';
      }
    }
  }

  maze[0][0] = 'path';
  maze[size - 1][size - 1] = 'path';

  if (maze[0][1] === 'wall') maze[0][1] = 'path';
  if (maze[1][0] === 'wall') maze[1][0] = 'path';
  if (maze[size - 1][size - 2] === 'wall') maze[size - 1][size - 2] = 'path';
  if (maze[size - 2][size - 1] === 'wall') maze[size - 2][size - 1] = 'path';

  return maze;
}

function heuristic(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function positionEquals(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}

function getNeighbors(pos: Position, maze: CellType[][]): Position[] {
  const neighbors: Position[] = [];
  const directions = [
    { dx: 0, dy: -1 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
  ];

  for (const dir of directions) {
    const nx = pos.x + dir.dx;
    const ny = pos.y + dir.dy;
    if (
      nx >= 0 &&
      nx < maze[0].length &&
      ny >= 0 &&
      ny < maze.length &&
      maze[ny][nx] === 'path'
    ) {
      neighbors.push({ x: nx, y: ny });
    }
  }

  return neighbors;
}

export function findPath(
  maze: CellType[][],
  start: Position,
  end: Position
): Position[] | null {
  const openSet: AStarNode[] = [];
  const closedSet: Set<string> = new Set();

  const startNode: AStarNode = {
    position: start,
    g: 0,
    h: heuristic(start, end),
    f: heuristic(start, end),
    parent: null,
  };

  openSet.push(startNode);

  while (openSet.length > 0) {
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift()!;

    if (positionEquals(current.position, end)) {
      const path: Position[] = [];
      let node: AStarNode | null = current;
      while (node) {
        path.unshift(node.position);
        node = node.parent;
      }
      return path;
    }

    closedSet.add(`${current.position.x},${current.position.y}`);

    for (const neighbor of getNeighbors(current.position, maze)) {
      const key = `${neighbor.x},${neighbor.y}`;
      if (closedSet.has(key)) continue;

      const g = current.g + 1;
      const h = heuristic(neighbor, end);
      const f = g + h;

      const existingIndex = openSet.findIndex((n) =>
        positionEquals(n.position, neighbor)
      );

      if (existingIndex === -1) {
        openSet.push({
          position: neighbor,
          g,
          h,
          f,
          parent: current,
        });
      } else if (g < openSet[existingIndex].g) {
        openSet[existingIndex] = {
          position: neighbor,
          g,
          h,
          f,
          parent: current,
        };
      }
    }
  }

  return null;
}

export function isWalkable(maze: CellType[][], pos: Position): boolean {
  if (pos.x < 0 || pos.x >= maze[0].length || pos.y < 0 || pos.y >= maze.length) {
    return false;
  }
  return maze[pos.y][pos.x] === 'path';
}
