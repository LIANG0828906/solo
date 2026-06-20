import { CuttingPieceData, LEATHER_BOUNDS } from '@/types';

interface BBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function getPieceBBox(piece: CuttingPieceData): BBox {
  const hw = (piece.width * piece.scale) / 2;
  const hh = (piece.height * piece.scale) / 2;
  const cos = Math.cos(piece.rotation);
  const sin = Math.sin(piece.rotation);
  const rx = hw * Math.abs(cos) + hh * Math.abs(sin);
  const ry = hw * Math.abs(sin) + hh * Math.abs(cos);
  return {
    minX: piece.position.x - rx,
    minY: piece.position.y - ry,
    maxX: piece.position.x + rx,
    maxY: piece.position.y + ry,
  };
}

export function checkPieceCollision(a: CuttingPieceData, b: CuttingPieceData): boolean {
  const ba = getPieceBBox(a);
  const bb = getPieceBBox(b);
  return !(ba.maxX < bb.minX || ba.minX > bb.maxX || ba.maxY < bb.minY || ba.minY > bb.maxY);
}

export function checkBoundaryCollision(piece: CuttingPieceData): boolean {
  const hw = LEATHER_BOUNDS.width / 2;
  const hh = LEATHER_BOUNDS.height / 2;
  const bbox = getPieceBBox(piece);
  return bbox.minX < -hw || bbox.maxX > hw || bbox.minY < -hh || bbox.maxY > hh;
}

export function checkDefectCollision(
  piece: CuttingPieceData,
  defects: Array<{ position: { x: number; y: number }; radius: number }>
): boolean {
  const bbox = getPieceBBox(piece);
  for (const defect of defects) {
    const closestX = Math.max(bbox.minX, Math.min(defect.position.x, bbox.maxX));
    const closestY = Math.max(bbox.minY, Math.min(defect.position.y, bbox.maxY));
    const dx = defect.position.x - closestX;
    const dy = defect.position.y - closestY;
    if (dx * dx + dy * dy < defect.radius * defect.radius) {
      return true;
    }
  }
  return false;
}

export function findAllCollisions(
  piece: CuttingPieceData,
  allPieces: CuttingPieceData[],
  defects: Array<{ position: { x: number; y: number }; radius: number }>
): { pieceCollision: boolean; boundaryCollision: boolean; defectCollision: boolean } {
  const pieceCollision = allPieces.some((p) => p.id !== piece.id && checkPieceCollision(piece, p));
  const boundaryCollision = checkBoundaryCollision(piece);
  const defectCollision = checkDefectCollision(piece, defects);
  return { pieceCollision, boundaryCollision, defectCollision };
}

export function isAnyCollision(
  piece: CuttingPieceData,
  allPieces: CuttingPieceData[],
  defects: Array<{ position: { x: number; y: number }; radius: number }>
): boolean {
  const result = findAllCollisions(piece, allPieces, defects);
  return result.pieceCollision || result.boundaryCollision || result.defectCollision;
}

export function getPieceArea(piece: CuttingPieceData): number {
  const w = piece.width * piece.scale;
  const h = piece.height * piece.scale;
  switch (piece.shape) {
    case 'circle':
      return Math.PI * (w / 2) * (h / 2);
    case 'triangle':
      return (w * h) / 2;
    case 'hexagon':
    case 'pentagon':
      const r = Math.min(w, h) / 2;
      const sides = piece.shape === 'hexagon' ? 6 : 5;
      return (sides * r * r * Math.sin((2 * Math.PI) / sides)) / 2;
    case 'irregular':
      return w * h * 0.7;
    default:
      return w * h;
  }
}

export function calculateTotalUtilization(
  pieces: CuttingPieceData[],
  defects: Array<{ position: { x: number; y: number }; radius: number }>
): number {
  const leatherArea = LEATHER_BOUNDS.width * LEATHER_BOUNDS.height;
  const defectArea = defects.reduce((sum, d) => sum + Math.PI * d.radius * d.radius, 0);
  const usableArea = leatherArea - defectArea;
  if (usableArea <= 0) return 0;
  const totalPieceArea = pieces.reduce((sum, p) => sum + getPieceArea(p), 0);
  return Math.min(1, totalPieceArea / usableArea);
}
