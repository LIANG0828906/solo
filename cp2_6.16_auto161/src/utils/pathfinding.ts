import { Position } from '../types';

const GRID_SIZE = 40;

interface Node {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  parent: Node | null;
}

function heuristic(a: Node, b: Node): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function getNeighbors(node: Node, gridWidth: number, gridHeight: number): Node[] {
  const neighbors: Node[] = [];
  const dirs = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
    { x: 1, y: 1 },
    { x: -1, y: 1 },
    { x: 1, y: -1 },
    { x: -1, y: -1 },
  ];

  for (const dir of dirs) {
    const nx = node.x + dir.x;
    const ny = node.y + dir.y;
    if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight) {
      neighbors.push({ x: nx, y: ny, g: 0, h: 0, f: 0, parent: null });
    }
  }

  return neighbors;
}

export function findPath(
  start: Position,
  end: Position,
  mapWidth: number,
  mapHeight: number,
  obstacles: Position[] = []
): Position[] {
  const gridWidth = Math.ceil(mapWidth / GRID_SIZE);
  const gridHeight = Math.ceil(mapHeight / GRID_SIZE);

  const startNode: Node = {
    x: Math.floor(start.x / GRID_SIZE),
    y: Math.floor(start.y / GRID_SIZE),
    g: 0,
    h: 0,
    f: 0,
    parent: null,
  };

  const endNode: Node = {
    x: Math.floor(end.x / GRID_SIZE),
    y: Math.floor(end.y / GRID_SIZE),
    g: 0,
    h: 0,
    f: 0,
    parent: null,
  };

  if (startNode.x === endNode.x && startNode.y === endNode.y) {
    return [end];
  }

  const openSet: Node[] = [startNode];
  const closedSet: Set<string> = new Set();
  const obstacleSet: Set<string> = new Set(
    obstacles.map((o) => `${Math.floor(o.x / GRID_SIZE)},${Math.floor(o.y / GRID_SIZE)}`)
  );

  startNode.h = heuristic(startNode, endNode);
  startNode.f = startNode.h;

  while (openSet.length > 0) {
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift()!;

    if (current.x === endNode.x && current.y === endNode.y) {
      const path: Position[] = [];
      let node: Node | null = current;
      while (node) {
        path.unshift({
          x: node.x * GRID_SIZE + GRID_SIZE / 2,
          y: node.y * GRID_SIZE + GRID_SIZE / 2,
        });
        node = node.parent;
      }
      path[0] = start;
      path[path.length - 1] = end;
      return path;
    }

    closedSet.add(`${current.x},${current.y}`);

    const neighbors = getNeighbors(current, gridWidth, gridHeight);
    for (const neighbor of neighbors) {
      const key = `${neighbor.x},${neighbor.y}`;
      if (closedSet.has(key) || obstacleSet.has(key)) continue;

      const isDiagonal = neighbor.x !== current.x && neighbor.y !== current.y;
      const moveCost = isDiagonal ? 1.4 : 1;
      const g = current.g + moveCost;

      const existingNode = openSet.find((n) => n.x === neighbor.x && n.y === neighbor.y);
      if (!existingNode) {
        neighbor.g = g;
        neighbor.h = heuristic(neighbor, endNode);
        neighbor.f = neighbor.g + neighbor.h;
        neighbor.parent = current;
        openSet.push(neighbor);
      } else if (g < existingNode.g) {
        existingNode.g = g;
        existingNode.f = existingNode.g + existingNode.h;
        existingNode.parent = current;
      }
    }
  }

  return [end];
}
