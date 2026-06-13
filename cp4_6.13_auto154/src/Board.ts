import { GemType, Position } from './types';

const BOARD_SIZE = 6;
const CELL_SIZE = 60;

export class Board {
  private grid: GemType[][];
  private selectedGem: Position | null = null;

  constructor() {
    this.grid = this.createInitialGrid();
  }

  private createInitialGrid(): GemType[][] {
    const grid: GemType[][] = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
      grid[row] = [];
      for (let col = 0; col < BOARD_SIZE; col++) {
        let gem: GemType;
        do {
          gem = this.getRandomGem();
        } while (this.wouldCreateMatch(row, col, gem));
        grid[row][col] = gem;
      }
    }
    return grid;
  }

  private getRandomGem(): GemType {
    const gems: GemType[] = ['fire', 'ice', 'lightning'];
    return gems[Math.floor(Math.random() * gems.length)];
  }

  private wouldCreateMatch(row: number, col: number, gem: GemType): boolean {
    if (!gem) return false;
    
    let horizontalCount = 1;
    for (let c = col - 1; c >= 0 && this.grid[row][c] === gem; c--) {
      horizontalCount++;
    }
    if (horizontalCount >= 3) return true;
    
    let verticalCount = 1;
    for (let r = row - 1; r >= 0 && this.grid[r][col] === gem; r--) {
      verticalCount++;
    }
    return verticalCount >= 3;
  }

  getGrid(): GemType[][] {
    return this.grid;
  }

  getCell(row: number, col: number): GemType {
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
      return null;
    }
    return this.grid[row][col];
  }

  setCell(row: number, col: number, gem: GemType): void {
    this.grid[row][col] = gem;
  }

  getSelectedGem(): Position | null {
    return this.selectedGem;
  }

  setSelectedGem(pos: Position | null): void {
    this.selectedGem = pos;
  }

  swapGems(pos1: Position, pos2: Position): void {
    const temp = this.grid[pos1.row][pos1.col];
    this.grid[pos1.row][pos1.col] = this.grid[pos2.row][pos2.col];
    this.grid[pos2.row][pos2.col] = temp;
  }

  isAdjacent(pos1: Position, pos2: Position): boolean {
    const rowDiff = Math.abs(pos1.row - pos2.row);
    const colDiff = Math.abs(pos1.col - pos2.col);
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  }

  removeGems(positions: Position[]): void {
    for (const pos of positions) {
      this.grid[pos.row][pos.col] = null;
    }
  }

  dropGems(): { moved: Position[]; filled: { row: number; col: number; gem: GemType }[] } {
    const moved: Position[] = [];
    const filled: { row: number; col: number; gem: GemType }[] = [];

    for (let col = 0; col < BOARD_SIZE; col++) {
      let emptyRow = BOARD_SIZE - 1;
      
      for (let row = BOARD_SIZE - 1; row >= 0; row--) {
        if (this.grid[row][col] !== null) {
          if (row !== emptyRow) {
            this.grid[emptyRow][col] = this.grid[row][col];
            this.grid[row][col] = null;
            moved.push({ row: emptyRow, col });
          }
          emptyRow--;
        }
      }

      for (let row = emptyRow; row >= 0; row--) {
        const gem = this.getRandomGem();
        this.grid[row][col] = gem;
        filled.push({ row, col, gem });
      }
    }

    return { moved, filled };
  }

  getBoardSize(): number {
    return BOARD_SIZE;
  }

  getCellSize(): number {
    return CELL_SIZE;
  }

  getGemAtPosition(x: number, y: number): Position | null {
    const col = Math.floor(x / CELL_SIZE);
    const row = Math.floor(y / CELL_SIZE);
    
    if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
      return { row, col };
    }
    return null;
  }
}
