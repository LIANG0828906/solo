import { MazeData, CellType, CellPosition } from '../types';

export class MazeGenerator {
  private size: number;
  private grid: CellType[][];

  constructor(minSize: number = 8, maxSize: number = 12) {
    this.size = this.pickOddSize(minSize, maxSize);
    this.grid = this.createFullWalls(this.size);
  }

  private pickOddSize(min: number, max: number): number {
    const size = Math.floor(Math.random() * (max - min + 1)) + min;
    return size % 2 === 0 ? size + 1 : size;
  }

  private createFullWalls(size: number): CellType[][] {
    const grid: CellType[][] = [];
    for (let y = 0; y < size; y++) {
      const row: CellType[] = [];
      for (let x = 0; x < size; x++) {
        row.push(1);
      }
      grid.push(row);
    }
    return grid;
  }

  public generate(): MazeData {
    const start: CellPosition = { x: 1, y: 1 };
    this.recursiveBacktrack(start.x, start.y);

    const exit = this.findFarthestCell(start);

    return {
      grid: this.grid,
      size: this.size,
      start,
      exit,
    };
  }

  private recursiveBacktrack(cx: number, cy: number): void {
    this.grid[cy][cx] = 0;

    const directions = this.shuffle([
      { dx: 0, dy: -2 },
      { dx: 2, dy: 0 },
      { dx: 0, dy: 2 },
      { dx: -2, dy: 0 },
    ]);

    for (const { dx, dy } of directions) {
      const nx = cx + dx;
      const ny = cy + dy;

      if (this.isInBounds(nx, ny) && this.grid[ny][nx] === 1) {
        this.grid[cy + dy / 2][cx + dx / 2] = 0;
        this.recursiveBacktrack(nx, ny);
      }
    }
  }

  private isInBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.size && y >= 0 && y < this.size;
  }

  private shuffle<T>(arr: T[]): T[] {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  private findFarthestCell(start: CellPosition): CellPosition {
    const distances: number[][] = Array(this.size)
      .fill(null)
      .map(() => Array(this.size).fill(-1));

    const queue: CellPosition[] = [start];
    distances[start.y][start.x] = 0;

    let farthest: CellPosition = start;
    let maxDist = 0;

    while (queue.length > 0) {
      const current = queue.shift()!;
      const dist = distances[current.y][current.x];

      if (dist > maxDist) {
        maxDist = dist;
        farthest = current;
      }

      const neighbors = [
        { x: current.x + 1, y: current.y },
        { x: current.x - 1, y: current.y },
        { x: current.x, y: current.y + 1 },
        { x: current.x, y: current.y - 1 },
      ];

      for (const n of neighbors) {
        if (
          this.isInBounds(n.x, n.y) &&
          this.grid[n.y][n.x] === 0 &&
          distances[n.y][n.x] === -1
        ) {
          distances[n.y][n.x] = dist + 1;
          queue.push(n);
        }
      }
    }

    return farthest;
  }

  public getEmptyCells(): CellPosition[] {
    const empty: CellPosition[] = [];
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (this.grid[y][x] === 0) {
          empty.push({ x, y });
        }
      }
    }
    return empty;
  }
}
