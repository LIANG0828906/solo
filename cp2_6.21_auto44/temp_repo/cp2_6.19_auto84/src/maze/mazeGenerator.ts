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
  private static readonly SCALE = 2 ** 32;

  constructor(seed: number) {
    this.state = (seed >>> 0) || 1;
  }

  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / SeededRandom.SCALE;
  }

  nextInt(min: number, max: number): number {
    if (max < min) {
      const tmp = max;
      max = min;
      min = tmp;
    }
    const range = (max - min + 1) >>> 0;
    const limit = SeededRandom.SCALE - (SeededRandom.SCALE % range);
    let r: number;
    do {
      let t = (this.state += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      r = (t ^ (t >>> 14)) >>> 0;
    } while (r >= limit);
    return min + (r % range);
  }

  nextIndex(length: number): number {
    if (length <= 0) return 0;
    return this.nextInt(0, length - 1);
  }

  pick<T>(arr: readonly T[]): T {
    return arr[this.nextIndex(arr.length)];
  }

  weightedIndex(weights: readonly number[]): number {
    let sum = 0;
    for (let i = 0; i < weights.length; i++) sum += weights[i];
    if (sum <= 0) return 0;

    const scaled: number[] = [];
    const PRECISION = 10000;
    let acc = 0;
    for (let i = 0; i < weights.length; i++) {
      acc += weights[i] / sum;
      scaled[i] = Math.floor(acc * PRECISION);
    }

    const r = this.nextInt(0, PRECISION - 1);
    for (let i = 0; i < scaled.length; i++) {
      if (r < scaled[i]) return i;
    }
    return scaled.length - 1;
  }

  getSeed(): number {
    return this.state;
  }

  reset(seed: number): void {
    this.state = (seed >>> 0) || 1;
  }
}

export class MazeGenerator {
  private size: number;
  private seed: number;
  private rng: SeededRandom;
  private grid: MazeGrid;

  constructor(size = 10, seed = Date.now()) {
    this.size = size;
    this.seed = (seed >>> 0) || 1;
    this.rng = new SeededRandom(this.seed);
    this.grid = [];
  }

  setSeed(seed: number): void {
    this.seed = (seed >>> 0) || 1;
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

  private randomColor(): CellColor {
    const colors: CellColor[] = ['red', 'green', 'blue', 'yellow', 'purple'];
    const weights = [15, 25, 20, 20, 20];
    const idx = this.rng.weightedIndex(weights);
    return colors[idx];
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
