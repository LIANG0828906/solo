import type { Player, Piece } from '@/types/game';

export class CollisionIndex {
  private index: Map<number, Piece[]> = new Map();

  rebuild(players: Player[]): void {
    this.index.clear();
    for (const player of players) {
      for (const piece of player.pieces) {
        if (piece.position >= 0 && !piece.isFinished) {
          const existing = this.index.get(piece.position);
          if (existing) {
            existing.push(piece);
          } else {
            this.index.set(piece.position, [piece]);
          }
        }
      }
    }
  }

  getPiecesAt(position: number): Piece[] {
    return this.index.get(position) ?? [];
  }

  getOpponentPiecesAt(position: number, currentPlayerId: string): Piece[] {
    return this.getPiecesAt(position).filter(
      (piece) => piece.playerId !== currentPlayerId
    );
  }

  getAlliedPiecesAt(position: number, currentPlayerId: string): Piece[] {
    return this.getPiecesAt(position).filter(
      (piece) => piece.playerId === currentPlayerId
    );
  }
}
