import { v4 as uuidv4 } from 'uuid';

export interface Cell {
  id: string;
  row: number;
  col: number;
  isMine: boolean;
  isRevealed: boolean;
  isMarked: boolean;
  isSuspected: boolean;
  adjacentMines: number;
  animationDelay?: number;
  isBurning?: boolean;
  isRippling?: boolean;
}

export interface RevealResult {
  hitMine: boolean;
  cellsRevealed: Cell[];
}

export class SweeperGame {
  private grid: Cell[][];
  private rows: number;
  private cols: number;
  private mineCount: number;
  private minesGenerated: boolean = false;
  private firstClick: boolean = true;

  constructor(rows: number = 16, cols: number = 16, mineCount: number = 40) {
    this.rows = rows;
    this.cols = cols;
    this.mineCount = mineCount;
    this.grid = this.createEmptyGrid();
  }

  private createEmptyGrid(): Cell[][] {
    const grid: Cell[][] = [];
    for (let row = 0; row < this.rows; row++) {
      grid[row] = [];
      for (let col = 0; col < this.cols; col++) {
        grid[row][col] = {
          id: uuidv4(),
          row,
          col,
          isMine: false,
          isRevealed: false,
          isMarked: false,
          isSuspected: false,
          adjacentMines: 0,
        };
      }
    }
    return grid;
  }

  generateMines(excludeRow: number, excludeCol: number): void {
    if (this.minesGenerated) return;

    const excludeSet = new Set<string>();
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const r = excludeRow + dr;
        const c = excludeCol + dc;
        if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
          excludeSet.add(`${r},${c}`);
        }
      }
    }

    let minesPlaced = 0;
    while (minesPlaced < this.mineCount) {
      const row = Math.floor(Math.random() * this.rows);
      const col = Math.floor(Math.random() * this.cols);
      const key = `${row},${col}`;

      if (!this.grid[row][col].isMine && !excludeSet.has(key)) {
        this.grid[row][col].isMine = true;
        minesPlaced++;
      }
    }

    this.calculateAdjacentMines();
    this.minesGenerated = true;
  }

  private calculateAdjacentMines(): void {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (!this.grid[row][col].isMine) {
          this.grid[row][col].adjacentMines = this.countAdjacentMines(row, col);
        }
      }
    }
  }

  private countAdjacentMines(row: number, col: number): number {
    let count = 0;
    const neighbors = this.getNeighbors(row, col);
    for (const neighbor of neighbors) {
      if (neighbor.isMine) count++;
    }
    return count;
  }

  getNeighbors(row: number, col: number): Cell[] {
    const neighbors: Cell[] = [];
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],          [0, 1],
      [1, -1], [1, 0], [1, 1]
    ];

    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      if (newRow >= 0 && newRow < this.rows && newCol >= 0 && newCol < this.cols) {
        neighbors.push(this.grid[newRow][newCol]);
      }
    }
    return neighbors;
  }

  revealCell(row: number, col: number): RevealResult {
    if (this.firstClick) {
      this.generateMines(row, col);
      this.firstClick = false;
    }

    const cell = this.grid[row][col];
    const result: RevealResult = {
      hitMine: false,
      cellsRevealed: []
    };

    if (cell.isRevealed || cell.isMarked) {
      return result;
    }

    if (cell.isMine) {
      cell.isRevealed = true;
      result.hitMine = true;
      result.cellsRevealed.push(cell);
      this.revealAllMines();
      return result;
    }

    this.revealCellRecursive(row, col, result.cellsRevealed);
    return result;
  }

  private revealCellRecursive(row: number, col: number, revealed: Cell[]): void {
    const cell = this.grid[row][col];

    if (cell.isRevealed || cell.isMarked || cell.isMine) {
      return;
    }

    cell.isRevealed = true;
    revealed.push(cell);

    if (cell.adjacentMines === 0) {
      const neighbors = this.getNeighbors(row, col);
      for (const neighbor of neighbors) {
        this.revealCellRecursive(neighbor.row, neighbor.col, revealed);
      }
    }
  }

  revealArea(centerRow: number, centerCol: number, size: number = 3): Cell[] {
    if (this.firstClick) {
      this.generateMines(centerRow, centerCol);
      this.firstClick = false;
    }

    const revealed: Cell[] = [];
    const halfSize = Math.floor(size / 2);

    for (let dr = -halfSize; dr <= halfSize; dr++) {
      for (let dc = -halfSize; dc <= halfSize; dc++) {
        const row = centerRow + dr;
        const col = centerCol + dc;
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
          const cell = this.grid[row][col];
          if (!cell.isRevealed && !cell.isMarked) {
            cell.isRevealed = true;
            revealed.push(cell);
          }
        }
      }
    }

    return revealed;
  }

  markCell(row: number, col: number): boolean {
    const cell = this.grid[row][col];
    if (cell.isRevealed) return false;
    cell.isMarked = !cell.isMarked;
    return true;
  }

  suspectCell(row: number, col: number): { success: boolean; isCorrect: boolean } {
    const cell = this.grid[row][col];
    if (cell.isRevealed) return { success: false, isCorrect: false };

    cell.isSuspected = !cell.isSuspected;
    return {
      success: true,
      isCorrect: cell.isSuspected ? cell.isMine : true
    };
  }

  private revealAllMines(): void {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.grid[row][col].isMine) {
          this.grid[row][col].isRevealed = true;
        }
      }
    }
  }

  checkWin(): boolean {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const cell = this.grid[row][col];
        if (!cell.isMine && !cell.isRevealed) {
          return false;
        }
      }
    }
    return true;
  }

  checkLose(): boolean {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const cell = this.grid[row][col];
        if (cell.isMine && cell.isRevealed) {
          return true;
        }
      }
    }
    return false;
  }

  getRevealedCount(): number {
    let count = 0;
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.grid[row][col].isRevealed && !this.grid[row][col].isMine) {
          count++;
        }
      }
    }
    return count;
  }

  getTotalSafeCells(): number {
    return this.rows * this.cols - this.mineCount;
  }

  getGrid(): Cell[][] {
    return this.grid;
  }

  getCell(row: number, col: number): Cell | null {
    if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
      return this.grid[row][col];
    }
    return null;
  }

  setCellAnimationDelay(row: number, col: number, delay: number): void {
    if (this.grid[row] && this.grid[row][col]) {
      this.grid[row][col].animationDelay = delay;
    }
  }

  setCellBurning(row: number, col: number, burning: boolean): void {
    if (this.grid[row] && this.grid[row][col]) {
      this.grid[row][col].isBurning = burning;
    }
  }

  setCellRippling(row: number, col: number, rippling: boolean): void {
    if (this.grid[row] && this.grid[row][col]) {
      this.grid[row][col].isRippling = rippling;
    }
  }

  reset(): void {
    this.grid = this.createEmptyGrid();
    this.minesGenerated = false;
    this.firstClick = true;
  }

  getRows(): number { return this.rows; }
  getCols(): number { return this.cols; }
  getMineCount(): number { return this.mineCount; }
}
