export interface PathPoint {
  x: number;
  y: number;
}

interface Node {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  parent: Node | null;
}

function heuristic(a: PathPoint, b: PathPoint): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function findPath(
  grid: boolean[][],
  start: PathPoint,
  end: PathPoint
): PathPoint[] {
  const height = grid.length;
  if (height === 0) return [];
  const width = grid[0].length;

  if (
    start.x < 0 || start.x >= width || start.y < 0 || start.y >= height ||
    end.x < 0 || end.x >= width || end.y < 0 || end.y >= height
  ) {
    return [];
  }

  if (!grid[end.y][end.x]) {
    return [];
  }

  if (start.x === end.x && start.y === end.y) {
    return [{ x: start.x, y: start.y }];
  }

  const openList: Node[] = [];
  const closedSet = new Set<string>();

  const startNode: Node = {
    x: start.x,
    y: start.y,
    g: 0,
    h: heuristic(start, end),
    f: heuristic(start, end),
    parent: null,
  };

  openList.push(startNode);

  const neighbors = [
    { dx: 0, dy: -1 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
  ];

  while (openList.length > 0) {
    openList.sort((a, b) => a.f - b.f);
    const current = openList.shift()!;

    if (current.x === end.x && current.y === end.y) {
      const path: PathPoint[] = [];
      let node: Node | null = current;
      while (node) {
        path.unshift({ x: node.x, y: node.y });
        node = node.parent;
      }
      return path;
    }

    closedSet.add(`${current.x},${current.y}`);

    for (const { dx, dy } of neighbors) {
      const nx = current.x + dx;
      const ny = current.y + dy;

      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      if (!grid[ny][nx]) continue;
      if (closedSet.has(`${nx},${ny}`)) continue;

      const g = current.g + 1;
      const h = heuristic({ x: nx, y: ny }, end);
      const f = g + h;

      const existing = openList.find((n) => n.x === nx && n.y === ny);
      if (existing) {
        if (g < existing.g) {
          existing.g = g;
          existing.f = f;
          existing.parent = current;
        }
      } else {
        openList.push({ x: nx, y: ny, g, h, f, parent: current });
      }
    }
  }

  return [];
}

export function buildWalkableGrid(
  tiles: Array<{ tileId: string; x: number; y: number }>,
  collisions: Array<{ x: number; y: number; width: number; height: number }>,
  npcs: Array<{ x: number; y: number }>,
  tileDefs: Array<{ id: string; walkable: boolean }>,
  gridWidth: number,
  gridHeight: number
): boolean[][] {
  const grid: boolean[][] = [];
  for (let y = 0; y < gridHeight; y++) {
    grid.push(new Array(gridWidth).fill(true));
  }

  tiles.forEach((t) => {
    const def = tileDefs.find((d) => d.id === t.tileId);
    if (def && !def.walkable) {
      if (t.y >= 0 && t.y < gridHeight && t.x >= 0 && t.x < gridWidth) {
        grid[t.y][t.x] = false;
      }
    }
  });

  collisions.forEach((c) => {
    for (let y = c.y; y < c.y + c.height; y++) {
      for (let x = c.x; x < c.x + c.width; x++) {
        if (y >= 0 && y < gridHeight && x >= 0 && x < gridWidth) {
          grid[y][x] = false;
        }
      }
    }
  });

  npcs.forEach((n) => {
    if (n.y >= 0 && n.y < gridHeight && n.x >= 0 && n.x < gridWidth) {
      grid[n.y][n.x] = false;
    }
  });

  return grid;
}
