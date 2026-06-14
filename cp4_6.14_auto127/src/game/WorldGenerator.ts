import { Cell, CellType } from '../store/gameStore';

export class WorldGenerator {
  private seed: number;
  private gridSize: number;

  constructor(seed?: number) {
    this.seed = seed ?? Math.floor(Math.random() * 1000000);
    this.gridSize = 10;
  }

  private seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  private getRandom(index: number): number {
    return this.seededRandom(this.seed + index);
  }

  generate(): Cell[][] {
    const grid: Cell[][] = [];
    let index = 0;

    for (let y = 0; y < this.gridSize; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < this.gridSize; x++) {
        let type: CellType;

        if (x === 0 || x === this.gridSize - 1 || y === 0 || y === this.gridSize - 1) {
          type = 'rock';
        } else if (x === 1 && y === 1) {
          type = 'empty';
        } else if (x === this.gridSize - 2 && y === this.gridSize - 2) {
          type = 'exit';
        } else {
          const rand = this.getRandom(index);
          if (rand < 0.5) {
            type = 'rock';
          } else if (rand < 0.65) {
            type = 'iron';
          } else if (rand < 0.75) {
            type = 'gold';
          } else if (rand < 0.80) {
            type = 'diamond';
          } else {
            type = 'empty';
          }
        }

        row.push({ type, x, y });
        index++;
      }
      grid.push(row);
    }

    this.ensurePath(grid);

    return grid;
  }

  private ensurePath(grid: Cell[][]): void {
    const startX = 1;
    const startY = 1;
    const endX = this.gridSize - 2;
    const endY = this.gridSize - 2;

    let x = startX;
    let y = startY;

    while (x < endX || y < endY) {
      if (x < endX && y < endY) {
        if (Math.random() > 0.5) {
          x++;
        } else {
          y++;
        }
      } else if (x < endX) {
        x++;
      } else {
        y++;
      }

      if (grid[y][x].type === 'rock') {
        grid[y][x].type = 'empty';
      }
    }
  }

  isDiggable(cell: Cell): boolean {
    return cell.type === 'rock' || cell.type === 'iron' || cell.type === 'gold' || cell.type === 'diamond';
  }

  isWalkable(cell: Cell): boolean {
    return cell.type === 'empty' || cell.type === 'exit';
  }
}
