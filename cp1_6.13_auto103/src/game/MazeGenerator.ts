import type { MazeGrid, CellType } from './types';

export class MazeGenerator {
  private width: number;
  private height: number;
  private grid: MazeGrid;

  constructor(width = 15, height = 15) {
    this.width = width;
    this.height = height;
    this.grid = this.createFullWalls();
  }

  private createFullWalls(): MazeGrid {
    const grid: MazeGrid = [];
    for (let y = 0; y < this.height; y++) {
      const row: CellType[] = [];
      for (let x = 0; x < this.width; x++) {
        row.push(1);
      }
      grid.push(row);
    }
    return grid;
  }

  public generate(): MazeGrid {
    this.grid = this.createFullWalls();
    this.recursiveBacktrack(1, 1);
    this.grid[1][0] = 0;
    this.grid[this.height - 2][this.width - 1] = 0;
    return this.grid;
  }

  private recursiveBacktrack(x: number, y: number): void {
    this.grid[y][x] = 0;

    const directions = this.shuffle([
      { dx: 0, dy: -2 },
      { dx: 2, dy: 0 },
      { dx: 0, dy: 2 },
      { dx: -2, dy: 0 },
    ]);

    for (const { dx, dy } of directions) {
      const nx = x + dx;
      const ny = y + dy;

      if (
        nx > 0 &&
        nx < this.width - 1 &&
        ny > 0 &&
        ny < this.height - 1 &&
        this.grid[ny][nx] === 1
      ) {
        this.grid[y + dy / 2][x + dx / 2] = 0;
        this.recursiveBacktrack(nx, ny);
      }
    }
  }

  private shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  public isWalkable(maze: MazeGrid, x: number, y: number): boolean {
    return (
      y >= 0 &&
      y < maze.length &&
      x >= 0 &&
      x < maze[0].length &&
      maze[y][x] === 0
    );
  }

  public getEntrance(): { x: number; y: number } {
    return { x: 1, y: 1 };
  }

  public getTreasure(): { x: number; y: number } {
    return { x: this.width - 2, y: this.height - 2 };
  }
}

export const MAZE_WIDTH = 15;
export const MAZE_HEIGHT = 15;
