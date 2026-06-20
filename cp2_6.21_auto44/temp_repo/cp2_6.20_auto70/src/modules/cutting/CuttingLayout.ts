import { CuttingPieceData, LEATHER_BOUNDS, LayoutScheme } from '@/types';
import { calculateTotalUtilization } from '@/utils/collision';
import { generateThumbnail } from '@/utils/textureGenerator';

export class CuttingLayout {
  pieces: CuttingPieceData[];

  constructor(pieces: CuttingPieceData[] = []) {
    this.pieces = pieces;
  }

  addPiece(piece: CuttingPieceData): void {
    this.pieces.push(piece);
  }

  removePiece(id: string): void {
    this.pieces = this.pieces.filter((p) => p.id !== id);
  }

  updatePiece(id: string, updates: Partial<CuttingPieceData>): void {
    const idx = this.pieces.findIndex((p) => p.id === id);
    if (idx !== -1) {
      this.pieces[idx] = { ...this.pieces[idx], ...updates };
    }
  }

  getUtilization(defects: Array<{ position: { x: number; y: number }; radius: number }>): number {
    return calculateTotalUtilization(this.pieces, defects);
  }

  generateScheme(name: string, defects: Array<{ position: { x: number; y: number }; radius: number }>): LayoutScheme {
    return {
      id: `scheme-${Date.now()}`,
      name,
      pieces: this.pieces.map((p) => ({ ...p })),
      utilization: this.getUtilization(defects),
      thumbnail: generateThumbnail(this.pieces),
      createdAt: Date.now(),
    };
  }

  loadScheme(scheme: LayoutScheme): CuttingPieceData[] {
    this.pieces = scheme.pieces.map((p) => ({ ...p }));
    return this.pieces;
  }

  clear(): void {
    this.pieces = [];
  }

  snapToNearestValid(piece: CuttingPieceData, defects: Array<{ position: { x: number; y: number }; radius: number }>): CuttingPieceData {
    const hw = LEATHER_BOUNDS.width / 2;
    const hh = LEATHER_BOUNDS.height / 2;
    const pw = (piece.width * piece.scale) / 2;
    const ph = (piece.height * piece.scale) / 2;

    let x = Math.max(-hw + pw, Math.min(hw - pw, piece.position.x));
    let y = Math.max(-hh + ph, Math.min(hh - ph, piece.position.y));

    for (const defect of defects) {
      const dx = x - defect.position.x;
      const dy = y - defect.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = defect.radius + Math.max(pw, ph);
      if (dist < minDist && dist > 0) {
        x = defect.position.x + (dx / dist) * minDist;
        y = defect.position.y + (dy / dist) * minDist;
      }
    }

    x = Math.max(-hw + pw, Math.min(hw - pw, x));
    y = Math.max(-hh + ph, Math.min(hh - ph, y));

    return {
      ...piece,
      position: { x, y },
    };
  }
}
