import { Position, Tile, Route, MAP_WIDTH, MAP_HEIGHT } from '@/types';

interface AStarNode {
  pos: Position;
  g: number;
  h: number;
  f: number;
  parent: AStarNode | null;
}

function heuristic(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function getTileCost(tile: Tile): number {
  if (tile.inSandstorm) return 3;
  if (tile.type === 'oasis_edge') return 0.5;
  return 1;
}

function posKey(p: Position): string {
  return `${p.x},${p.y}`;
}

export function findRoute(
  map: Tile[][],
  start: Position,
  end: Position
): Route | null {
  if (
    start.x < 0 || start.x >= MAP_WIDTH || start.y < 0 || start.y >= MAP_HEIGHT ||
    end.x < 0 || end.x >= MAP_WIDTH || end.y < 0 || end.y >= MAP_HEIGHT
  ) {
    return null;
  }

  const openSet: AStarNode[] = [];
  const closedSet = new Set<string>();
  const openMap = new Map<string, AStarNode>();

  const startNode: AStarNode = {
    pos: start,
    g: 0,
    h: heuristic(start, end),
    f: heuristic(start, end),
    parent: null,
  };
  openSet.push(startNode);
  openMap.set(posKey(start), startNode);

  const dirs = [
    { x: 1, y: 0 }, { x: -1, y: 0 },
    { x: 0, y: 1 }, { x: 0, y: -1 },
  ];

  let iterations = 0;
  const maxIter = MAP_WIDTH * MAP_HEIGHT * 2;

  while (openSet.length > 0 && iterations < maxIter) {
    iterations++;
    let minIdx = 0;
    for (let i = 1; i < openSet.length; i++) {
      if (openSet[i].f < openSet[minIdx].f) minIdx = i;
    }
    const current = openSet.splice(minIdx, 1)[0];
    openMap.delete(posKey(current.pos));
    closedSet.add(posKey(current.pos));

    if (current.pos.x === end.x && current.pos.y === end.y) {
      const path: Position[] = [];
      let node: AStarNode | null = current;
      while (node) {
        path.unshift(node.pos);
        node = node.parent;
      }
      let dangerLevel = 0;
      for (const p of path) {
        if (map[p.y][p.x].inSandstorm) dangerLevel++;
      }
      return {
        path,
        totalDays: path.length - 1,
        dangerLevel,
      };
    }

    for (const d of dirs) {
      const nx = current.pos.x + d.x;
      const ny = current.pos.y + d.y;
      if (nx < 0 || nx >= MAP_WIDTH || ny < 0 || ny >= MAP_HEIGHT) continue;
      const nPos = { x: nx, y: ny };
      const key = posKey(nPos);
      if (closedSet.has(key)) continue;

      const cost = getTileCost(map[ny][nx]);
      const g = current.g + cost;
      const h = heuristic(nPos, end);
      const f = g + h;

      const existing = openMap.get(key);
      if (existing) {
        if (g < existing.g) {
          existing.g = g;
          existing.f = f;
          existing.parent = current;
        }
      } else {
        const newNode: AStarNode = {
          pos: nPos,
          g,
          h,
          f,
          parent: current,
        };
        openSet.push(newNode);
        openMap.set(key, newNode);
      }
    }
  }

  return null;
}
