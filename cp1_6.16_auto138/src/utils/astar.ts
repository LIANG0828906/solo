import type { Point2D, GridNode } from '../types';

export class AStarPathfinder {
  private gridWidth: number;
  private gridHeight: number;
  private cellSize: number;
  private obstacles: Set<string>;

  constructor(
    gridWidth: number,
    gridHeight: number,
    cellSize: number,
    obstacles: Set<string>
  ) {
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
    this.cellSize = cellSize;
    this.obstacles = obstacles;
  }

  public findPath(start: Point2D, end: Point2D): Point2D[] | null {
    const startGrid = this.worldToGrid(start);
    const endGrid = this.worldToGrid(end);

    if (!this.isWalkable(startGrid.x, startGrid.y) || !this.isWalkable(endGrid.x, endGrid.y)) {
      return null;
    }

    const openSet: GridNode[] = [];
    const closedSet = new Set<string>();
    const nodeMap = new Map<string, GridNode>();

    const startNode: GridNode = {
      x: startGrid.x,
      y: startGrid.y,
      walkable: true,
      g: 0,
      h: this.heuristic(startGrid, endGrid),
      f: this.heuristic(startGrid, endGrid),
      parent: null,
    };

    openSet.push(startNode);
    nodeMap.set(`${startGrid.x},${startGrid.y}`, startNode);

    while (openSet.length > 0) {
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift()!;
      const currentKey = `${current.x},${current.y}`;

      if (current.x === endGrid.x && current.y === endGrid.y) {
        return this.reconstructPath(current);
      }

      closedSet.add(currentKey);

      const neighbors = this.getNeighbors(current);
      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.x},${neighbor.y}`;

        if (closedSet.has(neighborKey)) {
          continue;
        }

        const tentativeG = current.g + this.distance(current, neighbor);
        const existingNode = nodeMap.get(neighborKey);

        if (!existingNode || tentativeG < existingNode.g) {
          const h = this.heuristic(neighbor, endGrid);
          const updatedNode: GridNode = {
            x: neighbor.x,
            y: neighbor.y,
            walkable: true,
            g: tentativeG,
            h,
            f: tentativeG + h,
            parent: current,
          };

          nodeMap.set(neighborKey, updatedNode);

          if (!existingNode) {
            openSet.push(updatedNode);
          }
        }
      }
    }

    return null;
  }

  private heuristic(a: { x: number; y: number }, b: { x: number; y: number }): number {
    const dx = Math.abs(a.x - b.x);
    const dy = Math.abs(a.y - b.y);
    return dx + dy;
  }

  private getNeighbors(node: GridNode): { x: number; y: number }[] {
    const neighbors: { x: number; y: number }[] = [];
    const directions = [
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
    ];

    for (const dir of directions) {
      const nx = node.x + dir.x;
      const ny = node.y + dir.y;

      if (this.isWalkable(nx, ny)) {
        neighbors.push({ x: nx, y: ny });
      }
    }

    return neighbors;
  }

  private reconstructPath(endNode: GridNode): Point2D[] {
    const path: Point2D[] = [];
    let current: GridNode | null = endNode;

    while (current) {
      path.unshift(this.gridToWorld({ x: current.x, y: current.y }));
      current = current.parent;
    }

    return path;
  }

  private isWalkable(x: number, y: number): boolean {
    if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) {
      return false;
    }
    const key = `${x},${y}`;
    return !this.obstacles.has(key);
  }

  private worldToGrid(point: Point2D): { x: number; y: number } {
    return {
      x: Math.floor(point.x / this.cellSize),
      y: Math.floor(point.y / this.cellSize),
    };
  }

  private gridToWorld(grid: { x: number; y: number }): Point2D {
    return {
      x: (grid.x + 0.5) * this.cellSize,
      y: (grid.y + 0.5) * this.cellSize,
    };
  }

  private distance(
    a: { x: number; y: number },
    b: { x: number; y: number }
  ): number {
    const dx = Math.abs(a.x - b.x);
    const dy = Math.abs(a.y - b.y);
    return dx + dy;
  }
}
