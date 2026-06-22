export interface PuzzlePiece {
  id: number;
  row: number;
  col: number;
  currentX: number;
  currentY: number;
  rotation: number;
  isPlaced: boolean;
  isSelected: boolean;
  sourceX: number;
  sourceY: number;
}

export const PIECE_WIDTH = 160;
export const PIECE_HEIGHT = 120;
export const GRID_COLS = 4;
export const GRID_ROWS = 4;
export const SNAP_THRESHOLD = 20;
export const POSITION_TOLERANCE = 2;

export interface SnapResult {
  snapped: boolean;
  targetX: number;
  targetY: number;
  gridRow: number;
  gridCol: number;
}

export function getGridPosition(row: number, col: number): { x: number; y: number } {
  return {
    x: col * PIECE_WIDTH,
    y: row * PIECE_HEIGHT,
  };
}

export function getPieceCenter(piece: PuzzlePiece): { x: number; y: number } {
  return {
    x: piece.currentX + PIECE_WIDTH / 2,
    y: piece.currentY + PIECE_HEIGHT / 2,
  };
}

export function findNearestGrid(
  pieceX: number,
  pieceY: number
): { row: number; col: number; x: number; y: number; distance: number } {
  const centerX = pieceX + PIECE_WIDTH / 2;
  const centerY = pieceY + PIECE_HEIGHT / 2;

  let nearestRow = 0;
  let nearestCol = 0;
  let minDistance = Infinity;

  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const gridPos = getGridPosition(row, col);
      const gridCenterX = gridPos.x + PIECE_WIDTH / 2;
      const gridCenterY = gridPos.y + PIECE_HEIGHT / 2;
      const distance = Math.sqrt(
        Math.pow(centerX - gridCenterX, 2) + Math.pow(centerY - gridCenterY, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestRow = row;
        nearestCol = col;
      }
    }
  }

  const gridPos = getGridPosition(nearestRow, nearestCol);
  return {
    row: nearestRow,
    col: nearestCol,
    x: gridPos.x,
    y: gridPos.y,
    distance: minDistance,
  };
}

export function checkSnap(pieceX: number, pieceY: number): SnapResult {
  const nearest = findNearestGrid(pieceX, pieceY);

  if (nearest.distance <= SNAP_THRESHOLD) {
    return {
      snapped: true,
      targetX: nearest.x,
      targetY: nearest.y,
      gridRow: nearest.row,
      gridCol: nearest.col,
    };
  }

  return {
    snapped: false,
    targetX: pieceX,
    targetY: pieceY,
    gridRow: -1,
    gridCol: -1,
  };
}

export function checkPieceCorrect(piece: PuzzlePiece): boolean {
  const correctPos = getGridPosition(piece.row, piece.col);
  const xCorrect = Math.abs(piece.currentX - correctPos.x) <= POSITION_TOLERANCE;
  const yCorrect = Math.abs(piece.currentY - correctPos.y) <= POSITION_TOLERANCE;
  const rotationCorrect = piece.rotation % 360 === 0;
  return xCorrect && yCorrect && rotationCorrect;
}

export function checkAllComplete(pieces: PuzzlePiece[]): boolean {
  return pieces.every((p) => checkPieceCorrect(p));
}

export function rotatePiece(piece: PuzzlePiece): PuzzlePiece {
  return {
    ...piece,
    rotation: (piece.rotation + 90) % 360,
  };
}

export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function generateAbstractArt(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return canvas;
  }

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#1a1a2e');
  gradient.addColorStop(1, '#16213e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const colors = ['#E57373', '#4FC3F7', '#81C784', '#FFD54F', '#BA68C8'];

  for (let i = 0; i < 12; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const radius = 40 + Math.random() * 120;
    const color = colors[Math.floor(Math.random() * colors.length)];

    const blobGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    blobGradient.addColorStop(0, color + 'CC');
    blobGradient.addColorStop(0.5, color + '66');
    blobGradient.addColorStop(1, color + '00');

    ctx.fillStyle = blobGradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = '#FFFFFF33';
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    const startX = Math.random() * width;
    const startY = Math.random() * height;
    ctx.moveTo(startX, startY);

    for (let t = 0; t <= 1; t += 0.01) {
      const x =
        startX +
        Math.sin(t * Math.PI * 2 + i) * (80 + Math.random() * 60) +
        t * (width - startX - 50);
      const y =
        startY +
        Math.cos(t * Math.PI * 2 + i * 0.7) * (60 + Math.random() * 40) +
        t * (height - startY - 50);
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  for (let i = 0; i < 5; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    ctx.fillStyle = color + 'AA';
    ctx.beginPath();
    const cx = Math.random() * width;
    const cy = Math.random() * height;
    const w = 60 + Math.random() * 100;
    const h = 40 + Math.random() * 80;
    ctx.ellipse(cx, cy, w, h, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas;
}

export function createInitialPieces(): PuzzlePiece[] {
  const pieces: PuzzlePiece[] = [];
  let id = 0;

  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const correctPos = getGridPosition(row, col);
      const randomRotation = Math.floor(Math.random() * 4) * 90;

      pieces.push({
        id: id++,
        row,
        col,
        currentX: -1,
        currentY: -1,
        rotation: randomRotation,
        isPlaced: false,
        isSelected: false,
        sourceX: correctPos.x,
        sourceY: correctPos.y,
      });
    }
  }

  return shuffleArray(pieces);
}

export function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
