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
    let maze: MazeGrid;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      this.grid = this.createFullWalls();
      this.recursiveBacktrack(1, 1);
      this.grid[1][0] = 0;
      this.grid[this.height - 2][this.width - 1] = 0;
      maze = JSON.parse(JSON.stringify(this.grid));
      attempts++;
    } while (
      attempts < maxAttempts &&
      (!this.validatePathExists(maze) ||