import { Point, GRID_OBSTACLE } from './GameState';

interface Node {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  parent?: Node;
}

class LRUCache<K, V> {
  private map: Map<K, V>;
  private maxSize: number;

  constructor(maxSize: number = 200) {
    this.map = new Map();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.map.get(key);
    if (value !== undefined) {
      this.map.delete(key);
      this.map.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.maxSize) {
      const firstKey = this.map.keys().next().value;
      if (firstKey !== undefined) {
        this.map.delete(firstKey);
      }
    }
    this.map.set(key, value);
  }

  has(key: K): boolean {
    return this.map.has(key);
  }
}

export class PathFinder {
  private grid: number[][];
  private width: number;
  private height: number;
  private cache: LRUCache<string, Point[]>;

  constructor(grid: number[][]) {
    this.grid = grid;
    this.height = grid.length;
    this.width = grid[0]?.length || 0;
    this.cache = new LRUCache(300);
  }

  updateGrid(grid: number[][]): void {
    this.grid = grid;
    this.height = grid.length;
    this.width = grid[0]?.length || 0;
    this.cache = new LRUCache(300);
  }

  private heuristic(x1: number, y1: number, x2: number, y2: number): number {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
  }

  private isWalkable(x: number, y: number): boolean {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
    return this.grid[y][x] !== GRID_OBSTACLE;
  }

  findPath(startX: number, startY: number, endX: number, endY: number): Point[] {
    const startTime = performance.now();

    if (!this.isWalkable(endX, endY)) {
      return [];
    }

    const cacheKey = `${startX},${startY}-${endX},${endY}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached.map((p) => ({ ...p }));
    }

    if (startX === endX && startY === endY) {
      return [{ x: startX, y: startY }];
    }

    const openList: Node[] = [];
    const closedSet = new Set<string>();
    const openMap = new Map<string, Node>();

    const startNode: Node = {
      x: startX,
      y: startY,
      g: 0,
      h: this.heuristic(startX, startY, endX, endY),
      f: 0,
    };
    startNode.f = startNode.g + startNode.h;
    openList.push(startNode);
    openMap.set(`${startX},${startY}`, startNode);

    const neighbors = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
      { dx: -1, dy: -1 },
      { dx: 1, dy: -1 },
      { dx: -1, dy: 1 },
      { dx: 1, dy: 1 },
    ];

    let iterations = 0;
    const maxIterations = this.width * this.height * 2;

    while (openList.length > 0 && iterations < maxIterations) {
      iterations++;

      openList.sort((a, b) => a.f - b.f);
      const current = openList.shift()!;
      openMap.delete(`${current.x},${current.y}`);
      closedSet.add(`${current.x},${current.y}`);

      if (current.x === endX && current.y === endY) {
        const path: Point[] = [];
        let node: Node | undefined = current;
        while (node) {
          path.unshift({ x: node.x, y: node.y });
          node = node.parent;
        }

        const smoothed = this.smoothPath(path);

        if (performance.now() - startTime < 5) {
          this.cache.set(cacheKey, smoothed.map((p) => ({ ...p })));
        }
        return smoothed;
      }

      for (const { dx, dy } of neighbors) {
        const nx = current.x + dx;
        const ny = current.y + dy;
        const key = `${nx},${ny}`;

        if (closedSet.has(key)) continue;
        if (!this.isWalkable(nx, ny)) continue;

        if (dx !== 0 && dy !== 0) {
          if (!this.isWalkable(current.x + dx, current.y) || !this.isWalkable(current.x, current.y + dy)) {
            continue;
          }
        }

        const moveCost = dx !== 0 && dy !== 0 ? 1.414 : 1;
        const g = current.g + moveCost;

        const existing = openMap.get(key);
        if (existing && existing.g <= g) continue;

        const neighbor: Node = {
          x: nx,
          y: ny,
          g,
          h: this.heuristic(nx, ny, endX, endY),
          f: 0,
          parent: current,
        };
        neighbor.f = neighbor.g + neighbor.h;

        if (existing) {
          const idx = openList.indexOf(existing);
          if (idx >= 0) openList.splice(idx, 1);
        }
        openList.push(neighbor);
        openMap.set(key, neighbor);
      }
    }

    return [];
  }

  private smoothPath(path: Point[]): Point[] {
    if (path.length <= 2) return path;

    const result: Point[] = [path[0]];
    let i = 0;

    while (i < path.length - 1) {
      let j = path.length - 1;
      while (j > i + 1) {
        if (this.hasLineOfSight(path[i], path[j])) {
          break;
        }
        j--;
      }
      result.push(path[j]);
      i = j;
    }

    return result;
  }

  private hasLineOfSight(p1: Point, p2: Point): boolean {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    if (steps === 0) return true;

    const stepX = dx / steps;
    const stepY = dy / steps;

    for (let i = 1; i <= steps; i++) {
      const x = Math.round(p1.x + stepX * i);
      const y = Math.round(p1.y + stepY * i);
      if (!this.isWalkable(x, y)) return false;
    }
    return true;
  }
}
