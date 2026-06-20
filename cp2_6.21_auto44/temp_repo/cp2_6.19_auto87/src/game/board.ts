import { Card, Suit } from './deck';
import { PlayerId, PlayerManager } from './player';

export interface CellPosition {
  row: number;
  col: number;
}

export interface Cell {
  card: Card | null;
  owner: PlayerId | null;
  glowSuit?: Suit;
}

export interface PlacementResult {
  success: boolean;
  lineCells: CellPosition[];
  card?: Card;
  position?: CellPosition;
  player?: PlayerId;
}

export interface LineInfo {
  cells: CellPosition[];
  type: 'suit-sequence' | 'same-rank';
}

const BOARD_SIZE = 8;
const MIN_LINE_LENGTH = 3;

const DIRECTIONS = [
  { dr: 0, dc: 1 },
  { dr: 1, dc: 0 },
  { dr: 1, dc: 1 },
  { dr: 1, dc: -1 }
];

export class Board {
  private cells: Cell[][];
  private playerManager: PlayerManager;
  private scores: Record<PlayerId, number>;

  constructor(playerManager: PlayerManager) {
    this.playerManager = playerManager;
    this.cells = this.createEmptyBoard();
    this.scores = { red: 0, blue: 0 };
  }

  private createEmptyBoard(): Cell[][] {
    const board: Cell[][] = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
      const rowCells: Cell[] = [];
      for (let col = 0; col < BOARD_SIZE; col++) {
        rowCells.push({
          card: null,
          owner: null
        });
      }
      board.push(rowCells);
    }
    return board;
  }

  getSize(): number {
    return BOARD_SIZE;
  }

  getCell(row: number, col: number): Cell {
    return this.cells[row][col];
  }

  getCells(): Cell[][] {
    return this.cells.map(row => row.map(cell => ({ ...cell })));
  }

  getScore(playerId: PlayerId): number {
    return this.scores[playerId];
  }

  getScores(): Record<PlayerId, number> {
    return { ...this.scores };
  }

  isValidPosition(row: number, col: number): boolean {
    return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
  }

  isCellEmpty(row: number, col: number): boolean {
    if (!this.isValidPosition(row, col)) return false;
    return this.cells[row][col].card === null;
  }

  placeCard(row: number, col: number, cardId: string): PlacementResult {
    const currentPlayer = this.playerManager.getCurrentPlayer();
    const playerId = this.playerManager.getCurrentPlayerId();

    if (!this.isValidPosition(row, col)) {
      return { success: false, lineCells: [] };
    }

    if (!this.isCellEmpty(row, col)) {
      return { success: false, lineCells: [] };
    }

    if (!currentPlayer.hasCard(cardId)) {
      return { success: false, lineCells: [] };
    }

    const card = currentPlayer.removeCard(cardId);
    if (!card) {
      return { success: false, lineCells: [] };
    }

    this.cells[row][col].card = card;
    this.cells[row][col].owner = playerId;
    this.cells[row][col].glowSuit = card.suit;

    this.scores[playerId]++;

    const lines = this.detectLines(row, col);
    const lineCells = this.collectLineCells(lines);

    this.captureCells(lineCells, playerId);

    currentPlayer.drawCard();

    return {
      success: true,
      lineCells,
      card,
      position: { row, col },
      player: playerId
    };
  }

  private captureCells(cells: CellPosition[], playerId: PlayerId): void {
    for (const pos of cells) {
      const cell = this.cells[pos.row][pos.col];
      if (cell.owner !== playerId) {
        if (cell.owner) {
          this.scores[cell.owner] = Math.max(0, this.scores[cell.owner] - 1);
        }
        cell.owner = playerId;
        this.scores[playerId]++;
      }
    }
  }

  private collectLineCells(lines: LineInfo[]): CellPosition[] {
    const seen = new Set<string>();
    const result: CellPosition[] = [];
    for (const line of lines) {
      for (const cell of line.cells) {
        const key = `${cell.row},${cell.col}`;
        if (!seen.has(key)) {
          seen.add(key);
          result.push(cell);
        }
      }
    }
    return result;
  }

  detectLines(row: number, col: number): LineInfo[] {
    if (!this.cells[row][col].card) return [];

    const lines: LineInfo[] = [];

    for (const dir of DIRECTIONS) {
      const suitSeqLine = this.checkSuitSequence(row, col, dir.dr, dir.dc);
      if (suitSeqLine.length >= MIN_LINE_LENGTH) {
        lines.push({ cells: suitSeqLine, type: 'suit-sequence' });
      }

      const sameRankLine = this.checkSameRank(row, col, dir.dr, dir.dc);
      if (sameRankLine.length >= MIN_LINE_LENGTH) {
        lines.push({ cells: sameRankLine, type: 'same-rank' });
      }
    }

    return lines;
  }

  private checkSuitSequence(row: number, col: number, dr: number, dc: number): CellPosition[] {
    const card = this.cells[row][col].card;
    if (!card) return [];

    const suit = card.suit;
    const rank = card.rank;

    const line: CellPosition[] = [{ row, col }];

    let r = row + dr;
    let c = col + dc;
    let expectedRank = rank + 1;
    while (this.isValidPosition(r, c) && this.cells[r][c].card?.suit === suit && this.cells[r][c].card?.rank === expectedRank) {
      line.push({ row: r, col: c });
      r += dr;
      c += dc;
      expectedRank++;
    }

    r = row - dr;
    c = col - dc;
    expectedRank = rank - 1;
    while (this.isValidPosition(r, c) && this.cells[r][c].card?.suit === suit && this.cells[r][c].card?.rank === expectedRank) {
      line.unshift({ row: r, col: c });
      r -= dr;
      c -= dc;
      expectedRank--;
    }

    return line;
  }

  private checkSameRank(row: number, col: number, dr: number, dc: number): CellPosition[] {
    const card = this.cells[row][col].card;
    if (!card) return [];

    const rank = card.rank;

    const line: CellPosition[] = [{ row, col }];

    let r = row + dr;
    let c = col + dc;
    while (this.isValidPosition(r, c) && this.cells[r][c].card?.rank === rank) {
      line.push({ row: r, col: c });
      r += dr;
      c += dc;
    }

    r = row - dr;
    c = col - dc;
    while (this.isValidPosition(r, c) && this.cells[r][c].card?.rank === rank) {
      line.unshift({ row: r, col: c });
      r -= dr;
      c -= dc;
    }

    const seenSuits = new Set<Suit>();
    const uniqueLine: CellPosition[] = [];
    for (const pos of line) {
      const cellCard = this.cells[pos.row][pos.col].card;
      if (cellCard && !seenSuits.has(cellCard.suit)) {
        seenSuits.add(cellCard.suit);
        uniqueLine.push(pos);
      }
    }

    return uniqueLine;
  }

  getConsecutiveSuitCells(playerId: PlayerId): CellPosition[] {
    const result: CellPosition[] = [];
    const visited = new Set<string>();

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const cell = this.cells[row][col];
        if (cell.card && cell.owner === playerId) {
          let hasAdjacentSameSuit = false;
          for (const dir of DIRECTIONS) {
            const nr = row + dir.dr;
            const nc = col + dir.dc;
            if (this.isValidPosition(nr, nc)) {
              const neighbor = this.cells[nr][nc];
              if (neighbor.card && neighbor.owner === playerId && neighbor.card.suit === cell.card.suit) {
                hasAdjacentSameSuit = true;
                break;
              }
            }
          }
          if (hasAdjacentSameSuit) {
            const key = `${row},${col}`;
            if (!visited.has(key)) {
              visited.add(key);
              result.push({ row, col });
            }
          }
        }
      }
    }

    return result;
  }
}
