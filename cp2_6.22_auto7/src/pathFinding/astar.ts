import { Tile } from '../mapGen/mapGenerator';

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

export class AStar {
  private tiles: Tile[][];
  private width: number;
  private height: number;

  constructor(tiles: Tile[][]) {
    this.tiles = tiles;
    this.height = tiles.length;
    this.width = tiles[0].length;
  }

  public findPath(start: PathPoint, end: PathPoint): PathPoint[] {
    if (
      start.x < 0 || start.x >= this.width || start.y < 0 || start.y >= this.height ||
      end.x < 0 || end.x >= this.width || end.y < 0 || end.y >= this.height
    ) {
      return [];
    }

    if (!this.tiles[end.y][end.x].walkable) {
      return [];
    }

    const openSet: Node[] = [];
    const closedSet = new Set<string>();

    const startNode: Node = {
      x: start.x,
      y: start.y,
      g: 0,
      h: this.heuristic(start, end),
      f: this.heuristic(start, end),
      parent: null
    };

    openSet.push(startNode);

    while (openSet.length > 0) {
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift()!;

      if (current.x === end.x && current.y === end.y) {
        return this.reconstructPath(current);
      }

      closedSet.add(`${current.x},${current.y}`);

      const neighbors = this.getNeighbors(current);

      for (const neighbor of neighbors) {
        const key = `${neighbor.x},${neighbor.y}`;
        if (closedSet.has(key)) continue;

        const tentativeG = current.g + 1;

        const existingNode = openSet.find(n => n.x === neighbor.x && n.y === neighbor.y);

        if (!existingNode) {
          const h = this.heuristic(neighbor, end);
          openSet.push({
            x: neighbor.x,
            y: neighbor.y,
            g: tentativeG,
            h,
            f: tentativeG + h,
            parent: current
          });
        } else if (tentativeG < existingNode.g) {
          existingNode.g = tentativeG;
          existingNode.f = tentativeG + existingNode.h;
          existingNode.parent = current;
        }
      }
    }

    return [];
  }

  private heuristic(a: PathPoint, b: PathPoint): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  private getNeighbors(node: Node): PathPoint[] {
    const neighbors: PathPoint[] = [];
    const directions = [
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 }
    ];

    for (const dir of directions) {
      const nx = node.x + dir.x;
      const ny = node.y + dir.y;

      if (
        nx >= 0 && nx < this.width &&
        ny >= 0 && ny < this.height &&
        this.tiles[ny][nx].walkable
      ) {
        neighbors.push({ x: nx, y: ny });
      }
    }

    return neighbors;
  }

  private reconstructPath(endNode: Node): PathPoint[] {
    const path: PathPoint[] = [];
    let current: Node | null = endNode;

    while (current) {
      path.unshift({ x: current.x, y: current.y });
      current = current.parent;
    }

    return path;
  }

  public updateMap(tiles: Tile[][]): void {
    this.tiles = tiles;
    this.height = tiles.length;
    this.width = tiles[0].length;
  }
}
