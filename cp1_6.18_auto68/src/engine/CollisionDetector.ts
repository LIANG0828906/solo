import { CellType } from '@/store';

export interface CollisionResult {
  collided: boolean;
  col: number;
  row: number;
  direction: 'horizontal' | 'vertical' | 'boundary' | '';
}

export class CollisionDetector {
  private grid: CellType[][] = [];
  private cols = 0;
  private rows = 0;

  updateGrid(grid: CellType[][]): void {
    this.grid = grid;
    this.rows = grid.length;
    this.cols = grid[0]?.length ?? 0;
  }

  private isBlocked(col: number, row: number): boolean {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return true;
    return this.grid[row][col] !== 'empty';
  }

  isWalkable(col: number, row: number): boolean {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return false;
    return this.grid[row][col] === 'empty';
  }

  checkPlayerCollision(
    x: number,
    y: number,
    radius: number
  ): CollisionResult {
    if (
      x - radius < 0 ||
      x + radius > this.cols ||
      y - radius < 0 ||
      y + radius > this.rows
    ) {
      return { collided: true, col: -1, row: -1, direction: 'boundary' };
    }

    const minCol = Math.floor(x - radius);
    const maxCol = Math.floor(x + radius);
    const minRow = Math.floor(y - radius);
    const maxRow = Math.floor(y + radius);

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        if (this.isBlocked(col, row)) {
          const cellX = col;
          const cellY = row;
          const closestX = Math.max(cellX, Math.min(x, cellX + 1));
          const closestY = Math.max(cellY, Math.min(y, cellY + 1));
          const dx = x - closestX;
          const dy = y - closestY;

          if (dx * dx + dy * dy < radius * radius) {
            const direction: 'horizontal' | 'vertical' =
              Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
            return { collided: true, col, row, direction };
          }
        }
      }
    }

    return { collided: false, col: -1, row: -1, direction: '' };
  }

  findEmptyCell(): { col: number; row: number } | null {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.grid[row][col] === 'empty') return { col, row };
      }
    }
    return null;
  }
}
