export interface GridNode {
  x: number;
  y: number;
  walkable: boolean;
}

interface PathNode extends GridNode {
  g: number;
  h: number;
  f: number;
  parent: PathNode | null;
}

const createPathNode = (
  x: number,
  y: number,
  walkable: boolean,
  g: number,
  h: number,
  parent: PathNode | null = null
): PathNode => ({
  x,
  y,
  walkable,
  g,
  h,
  f: g + h,
  parent
});

const manhattanDistance = (x1: number, y1: number, x2: number, y2: number): number =>
  Math.abs(x1 - x2) + Math.abs(y1 - y2);

const findInSet = (set: PathNode[], x: number, y: number): PathNode | undefined =>
  set.find((n) => n.x === x && n.y === y);

const reconstructPath = (end: PathNode): GridNode[] => {
  const path: GridNode[] = [];
  let current: PathNode | null = end;
  while (current !== null) {
    path.unshift({ x: current.x, y: current.y, walkable: current.walkable });
    current = current.parent;
  }
  return path;
};

export const findPath = (
  start: { x: number; y: number },
  end: { x: number; y: number },
  grid: GridNode[][]
): GridNode[] => {
  if (grid.length === 0 || grid[0].length === 0) return [];

  const rows = grid.length;
  const cols = grid[0].length;

  if (
    start.x < 0 ||
    start.x >= cols ||
    start.y < 0 ||
    start.y >= rows ||
    end.x < 0 ||
    end.x >= cols ||
    end.y < 0 ||
    end.y >= rows
  ) {
    return [];
  }

  if (!grid[end.y][end.x].walkable) return [];

  const openSet: PathNode[] = [];
  const closedSet: PathNode[] = [];

  const startH = manhattanDistance(start.x, start.y, end.x, end.y);
  openSet.push(createPathNode(start.x, start.y, grid[start.y][start.x].walkable, 0, startH));

  const directions = [
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 }
  ];

  while (openSet.length > 0) {
    let lowestIndex = 0;
    for (let i = 1; i < openSet.length; i++) {
      if (openSet[i].f < openSet[lowestIndex].f) {
        lowestIndex = i;
      }
    }

    const current = openSet[lowestIndex];

    if (current.x === end.x && current.y === end.y) {
      return reconstructPath(current);
    }

    openSet.splice(lowestIndex, 1);
    closedSet.push(current);

    for (const dir of directions) {
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;

      if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;

      const neighbor = grid[ny][nx];
      if (!neighbor.walkable) continue;

      if (findInSet(closedSet, nx, ny)) continue;

      const tentativeG = current.g + 1;
      const existingOpen = findInSet(openSet, nx, ny);

      if (!existingOpen) {
        const h = manhattanDistance(nx, ny, end.x, end.y);
        openSet.push(createPathNode(nx, ny, neighbor.walkable, tentativeG, h, current));
      } else if (tentativeG < existingOpen.g) {
        existingOpen.g = tentativeG;
        existingOpen.f = tentativeG + existingOpen.h;
        existingOpen.parent = current;
      }
    }
  }

  return [];
};
