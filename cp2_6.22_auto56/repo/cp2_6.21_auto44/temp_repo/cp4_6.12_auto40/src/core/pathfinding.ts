import { Position, GRID_SIZE } from '../types';

interface PathNode {
  pos: Position;
  g: number;
  h: number;
  f: number;
  parent: PathNode | null;
}

function heuristic(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function posKey(pos: Position): string {
  return `${pos.x},${pos.y}`;
}

function getNeighbors(pos: Position): Position[] {
  const neighbors: Position[] = [];
  const dirs = [
    { x: 0, y: -1 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
  ];

  for (const dir of dirs) {
    const nx = pos.x + dir.x;
    const ny = pos.y + dir.y;
    if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
      neighbors.push({ x: nx, y: ny });
    }
  }

  return neighbors;
}

export function findPath(
  start: Position,
  goal: Position,
  isBlocked: (pos: Position) => boolean,
  canPassGate?: (pos: Position) => boolean
): Position[] | null {
  if (start.x === goal.x && start.y === goal.y) {
    return [];
  }

  const openSet: PathNode[] = [];
  const closedSet = new Set<string>();
  const openMap = new Map<string, PathNode>();

  const startNode: PathNode = {
    pos: start,
    g: 0,
    h: heuristic(start, goal),
    f: heuristic(start, goal),
    parent: null,
  };

  openSet.push(startNode);
  openMap.set(posKey(start), startNode);

  while (openSet.length > 0) {
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift()!;
    openMap.delete(posKey(current.pos));
    closedSet.add(posKey(current.pos));

    if (current.pos.x === goal.x && current.pos.y === goal.y) {
      const path: Position[] = [];
      let node: PathNode | null = current;
      while (node) {
        path.unshift(node.pos);
        node = node.parent;
      }
      return path.slice(1);
    }

    for (const neighbor of getNeighbors(current.pos)) {
      const key = posKey(neighbor);
      if (closedSet.has(key)) continue;

      const blocked = isBlocked(neighbor);
      const isGoal = neighbor.x === goal.x && neighbor.y === goal.y;
      
      if (blocked && !isGoal) {
        if (!canPassGate || !canPassGate(neighbor)) {
          continue;
        }
      }

      const tentativeG = current.g + 1;
      const existing = openMap.get(key);

      if (!existing || tentativeG < existing.g) {
        const h = heuristic(neighbor, goal);
        const node: PathNode = {
          pos: neighbor,
          g: tentativeG,
          h,
          f: tentativeG + h,
          parent: current,
        };

        if (!existing) {
          openSet.push(node);
          openMap.set(key, node);
        } else {
          existing.g = tentativeG;
          existing.f = tentativeG + h;
          existing.parent = current;
        }
      }
    }
  }

  return null;
}

export function getDistance(a: Position, b: Position): number {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

export function getManhattanDistance(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function positionsEqual(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}
