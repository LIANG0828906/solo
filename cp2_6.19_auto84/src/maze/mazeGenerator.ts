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

export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  next(): number {
    this.state = (this.state + 0x6D2B79F5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  getSeed(): number {
    return this.state;
  }
}

export class MazeGenerator {
  private size: number;
  private seed: number;
  private rng: SeededRandom;
  private grid: MazeGrid;

  constructor(size = 10, seed = Date.now()) {
    this.size = size;
    this.seed = seed >>> 0;
    this.rng = new SeededRandom(this.seed);
    this.grid = [];
  }

  setSeed(seed: number): void {
    this.seed = seed >>> 0;
    this.rng = new SeededRandom(this.seed);
  }

  getSeed(): number {
    return this.seed;
  }

  regenerate(newSeed?: number): MazeGrid {
    if (newSeed !== undefined) {
      this.setSeed(newSeed);
    } else {
      this.rng = new SeededRandom(this.seed);
    }
    return this.generate();
  }

  private random(): number {
    return this.rng.next();
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
