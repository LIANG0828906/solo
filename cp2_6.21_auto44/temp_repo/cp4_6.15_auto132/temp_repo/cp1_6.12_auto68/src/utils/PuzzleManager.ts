export type PuzzleShape = 'semicircle' | 'triangle' | 'zigzag' | 'diamond' | 'star' | 'heart';
export type PuzzleColor = 'red' | 'blue' | 'yellow' | 'green' | 'purple' | 'orange';

export interface PuzzlePiece {
  id: number;
  shape: PuzzleShape;
  color: PuzzleColor;
  correctSlot: number;
  collected: boolean;
  placed: boolean;
  currentSlot: number | null;
}

export const PUZZLE_COLORS_HEX: Record<PuzzleColor, number> = {
  red: 0xe74c3c,
  blue: 0x3498db,
  yellow: 0xf1c40f,
  green: 0x2ecc71,
  purple: 0x9b59b6,
  orange: 0xe67e22
};

export const PUZZLE_COLORS_CSS: Record<PuzzleColor, string> = {
  red: '#e74c3c',
  blue: '#3498db',
  yellow: '#f1c40f',
  green: '#2ecc71',
  purple: '#9b59b6',
  orange: '#e67e22'
};

export const PUZZLE_SHAPES: PuzzleShape[] = ['semicircle', 'triangle', 'zigzag', 'diamond', 'star', 'heart'];
export const PUZZLE_COLORS: PuzzleColor[] = ['red', 'blue', 'yellow', 'green', 'purple', 'orange'];

export class PuzzleManager {
  pieces: PuzzlePiece[] = [];
  readonly totalPieces = 6;
  readonly gridCols = 3;
  readonly gridRows = 2;

  constructor() {
    this.initializePieces();
  }

  initializePieces(): void {
    const shapes = [...PUZZLE_SHAPES];
    const colors = [...PUZZLE_COLORS];
    Phaser.Utils.Array.Shuffle(shapes);
    Phaser.Utils.Array.Shuffle(colors);

    this.pieces = [];
    for (let i = 0; i < this.totalPieces; i++) {
      this.pieces.push({
        id: i,
        shape: shapes[i],
        color: colors[i],
        correctSlot: i,
        collected: false,
        placed: false,
        currentSlot: null
      });
    }
  }

  collectPiece(pieceId: number): boolean {
    const piece = this.pieces.find(p => p.id === pieceId);
    if (piece && !piece.collected) {
      piece.collected = true;
      return true;
    }
    return false;
  }

  tryPlacePiece(pieceId: number, slotIndex: number): boolean {
    const piece = this.pieces.find(p => p.id === pieceId);
    if (!piece || !piece.collected) return false;

    if (piece.correctSlot === slotIndex) {
      piece.placed = true;
      piece.currentSlot = slotIndex;
      return true;
    }
    return false;
  }

  resetPiece(pieceId: number): void {
    const piece = this.pieces.find(p => p.id === pieceId);
    if (piece) {
      piece.placed = false;
      piece.currentSlot = null;
    }
  }

  isComplete(): boolean {
    return this.pieces.every(p => p.placed);
  }

  getCollectedCount(): number {
    return this.pieces.filter(p => p.collected).length;
  }

  getPlacedCount(): number {
    return this.pieces.filter(p => p.placed).length;
  }

  getPieceById(id: number): PuzzlePiece | undefined {
    return this.pieces.find(p => p.id === id);
  }

  getAvailablePieces(): PuzzlePiece[] {
    return this.pieces.filter(p => p.collected && !p.placed);
  }

  slotToCoords(slotIndex: number): { col: number; row: number } {
    return {
      col: slotIndex % this.gridCols,
      row: Math.floor(slotIndex / this.gridCols)
    };
  }
}
