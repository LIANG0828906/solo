import { GemType, Position } from './types';
import { Board } from './Board';

export class RuleEngine {
  private board: Board;

  constructor(board: Board) {
    this.board = board;
  }

  findMatches(): Position[] {
    const matches: Set<string> = new Set();
    
    for (let row = 0; row < this.board.getBoardSize(); row++) {
      for (let col = 0; col < this.board.getBoardSize(); col++) {
        const gem = this.board.getCell(row, col);
        if (!gem) continue;

        const horizontal = this.findHorizontalMatch(row, col, gem);
        const vertical = this.findVerticalMatch(row, col, gem);
        
        for (const pos of horizontal) {
          matches.add(`${pos.row},${pos.col}`);
        }
        for (const pos of vertical) {
          matches.add(`${pos.row},${pos.col}`);
        }
      }
    }

    return Array.from(matches).map(key => {
      const [row, col] = key.split(',').map(Number);
      return { row, col };
    });
  }

  private findHorizontalMatch(row: number, col: number, gem: GemType): Position[] {
    const matches: Position[] = [{ row, col }];
    
    for (let c = col + 1; c < this.board.getBoardSize(); c++) {
      if (this.board.getCell(row, c) === gem) {
        matches.push({ row, col: c });
      } else {
        break;
      }
    }
    
    return matches.length >= 3 ? matches : [];
  }

  private findVerticalMatch(row: number, col: number, gem: GemType): Position[] {
    const matches: Position[] = [{ row, col }];
    
    for (let r = row + 1; r < this.board.getBoardSize(); r++) {
      if (this.board.getCell(r, col) === gem) {
        matches.push({ row: r, col });
      } else {
        break;
      }
    }
    
    return matches.length >= 3 ? matches : [];
  }

  canSwap(pos1: Position, pos2: Position): boolean {
    if (!this.board.isAdjacent(pos1, pos2)) {
      return false;
    }

    this.board.swapGems(pos1, pos2);
    const matches = this.findMatches();
    this.board.swapGems(pos1, pos2);

    return matches.length > 0;
  }

  processMatches(maxChains: number = 5): { totalMatches: number; chainCount: number } {
    let totalMatches = 0;
    let chainCount = 0;

    while (chainCount < maxChains) {
      const matches = this.findMatches();
      
      if (matches.length === 0) {
        break;
      }

      chainCount++;
      totalMatches += matches.length;
      this.board.removeGems(matches);
      this.board.dropGems();
    }

    return { totalMatches, chainCount };
  }

  calculateScore(matchCount: number, chainNumber: number): number {
    const baseScore = matchCount * 10;
    const multiplier = Math.pow(1.5, chainNumber - 1);
    return Math.floor(baseScore * multiplier);
  }
}
