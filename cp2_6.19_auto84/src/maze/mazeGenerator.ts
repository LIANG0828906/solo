export type CellColor = 'red' | 'green' | 'blue' | 'yellow' | 'purple' | 'gold' | 'entrance';

export interface Cell {
  x: number;
  y: number;
  color: CellColor;
  visited: boolean;
  isExit: boolean;
  isEntrance: boolean;
}

export type MazeGrid = Cell[][];

export class MazeGenerator {
  private size: number;
  private seed: number;
  private grid: MazeGrid;

  constructor(size = 10, seed = Date.now()) {
    this.size = size;
    this.seed = seed;
    this.grid = [];
  }

  private random(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  private randomColor(): CellColor {
    const colors: CellColor[] = ['red', 'green', 'blue', 'yellow', 'purple'];
    const weights = [0.15, 0.25, 0.2, 0.2, 0.2];
    const r = this.random();
    let cumulative = 0;
    for (let i = 0; i < colors.length; i++) {
      cumulative += weights[i];
      if (r <= cumulative) return colors[i];
    }
    return 'green';
  }

  generate(): MazeGrid {
    this.grid = [];

    for (let y = 0; y < this.size; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < this.size; x++) {
        let color: CellColor;
        let isExit = false;
        let isEntrance = false;

        if (x === 0 && y === 0) {
          color = 'entrance';
          isEntrance = true;
        } else if (x === this.size - 1 && y === this.size - 1) {
          color = 'gold';
          isExit = true;
        } else {
          color = this.randomColor();
        }

        row.push({
          x,
          y,
          color,
          visited: x === 0 && y === 0,
          isExit,
          isEntrance
        });
      }
      this.grid.push(row);
    }

    return this.grid;
  }

  getGrid(): MazeGrid {
    return this.grid;
  }

  getSize(): number {
    return this.size;
  }

  getCell(x: number, y: number): Cell | null {
    if (x < 0 || x >= this.size || y < 0 || y >= this.size) return null;
    return this.grid[y][x];
  }

  isWalkable(x: number, y: number): boolean {
    return x >= 0 && x < this.size && y >= 0 && y < this.size;
  }

  setVisited(x: number, y: number): void {
    const cell = this.getCell(x, y);
    if (cell) cell.visited = true;
  }
}
