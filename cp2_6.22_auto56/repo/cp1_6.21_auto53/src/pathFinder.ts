import type { MazeGrid, Point } from './types';

interface PathNode {
  point: Point;
  g: number;
  h: number;
  f: number;
  parent: PathNode | null;
}

function heuristic(a: Point, b: Point): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function getKey(point: Point): string {
  return `${point.x},${point.y}`;
}

function getWalkableNeighbors(
  point: Point,
  grid: MazeGrid,
  blockedCells: Set<string>
): Point[] {
  const width = grid[0].length;
  const height = grid.length;
  const neighbors: Point[] = [];
  const directions = [
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
  ];

  for (const { dx, dy } of directions) {
    const nx = point.x + dx;
    const ny = point.y + dy;
    const key = `${nx},${ny}`;

    if (
      nx >= 0 &&
      nx < width &&
      ny >= 0 &&
      ny < height &&
      grid[ny][nx] === 'path' &&
      !blockedCells.has(key)
    ) {
      neighbors.push({ x: nx, y: ny });
    }
  }

  return neighbors;
}

function reconstructPath(endNode: PathNode): Point[] {
  const path: Point[] = [];
  let current: PathNode | null = endNode;

  while (current !== null) {
    path.unshift(current.point);
    current = current.parent;
  }

  return path;
}

class MinHeap {
  private nodes: PathNode[] = [];

  private swap(i: number, j: number): void {
    [this.nodes[i], this.nodes[j]] = [this.nodes[j], this.nodes[i]];
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.nodes[parentIndex].f <= this.nodes[index].f) break;
      this.swap(parentIndex, index);
      index = parentIndex;
    }
  }

  private bubbleDown(index: number): void {
    const length = this.nodes.length;
    while (true) {
      let smallest = index;
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;

      if (leftChild < length && this.nodes[leftChild].f < this.nodes[smallest].f) {
        smallest = leftChild;
      }
      if (rightChild < length && this.nodes[rightChild].f < this.nodes[smallest].f) {
        smallest = rightChild;
      }
      if (smallest === index) break;
      this.swap(index, smallest);
      index = smallest;
    }
  }

  push(node: PathNode): void {
    this.nodes.push(node);
    this.bubbleUp(this.nodes.length - 1);
  }

  pop(): PathNode | undefined {
    if (this.nodes.length === 0) return undefined;
    const min = this.nodes[0];
    const last = this.nodes.pop();
    if (this.nodes.length > 0 && last !== undefined) {
      this.nodes[0] = last;
      this.bubbleDown(0);
    }
    return min;
  }

  isEmpty(): boolean {
    return this.nodes.length === 0;
  }
}

export function findPath(
  grid: MazeGrid,
  start: Point,
  end: Point,
  blockedCells: Point[] = []
): Point[] {
  const startTime = performance.now();

  const blockedSet = new Set(blockedCells.map(getKey));
  const startKey = getKey(start);
  const endKey = getKey(end);

  if (blockedSet.has(startKey) || blockedSet.has(endKey)) {
    return [];
  }

  if (grid[start.y][start.x] !== 'path' || grid[end.y][end.x] !== 'path') {
    return [];
  }

  const openSet = new MinHeap();
  const closedSet = new Set<string>();
  const gScores = new Map<string, number>();

  const startNode: PathNode = {
    point: start,
    g: 0,
    h: heuristic(start, end),
    f: heuristic(start, end),
    parent: null,
  };

  openSet.push(startNode);
  gScores.set(startKey, 0);

  while (!openSet.isEmpty()) {
    const current = openSet.pop()!;
    const currentKey = getKey(current.point);

    if (currentKey === endKey) {
      const path = reconstructPath(current);
      const duration = performance.now() - startTime;
      if (duration > 50) {
        console.warn(`路径搜索超时: ${duration.toFixed(2)}ms，建议缩小迷宫尺寸`);
      }
      return path;
    }

    if (closedSet.has(currentKey)) continue;
    closedSet.add(currentKey);

    const neighbors = getWalkableNeighbors(current.point, grid, blockedSet);

    for (const neighbor of neighbors) {
      const neighborKey = getKey(neighbor);
      if (closedSet.has(neighborKey)) continue;

      const tentativeG = current.g + 1;
      const existingG = gScores.get(neighborKey);

      if (existingG === undefined || tentativeG < existingG) {
        gScores.set(neighborKey, tentativeG);
        const h = heuristic(neighbor, end);
        const neighborNode: PathNode = {
          point: neighbor,
          g: tentativeG,
          h,
          f: tentativeG + h,
          parent: current,
        };
        openSet.push(neighborNode);
      }
    }
  }

  const duration = performance.now() - startTime;
  if (duration > 50) {
    console.warn(`路径搜索超时: ${duration.toFixed(2)}ms，建议缩小迷宫尺寸`);
  }

  return [];
}
