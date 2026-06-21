export interface PuzzlePiece {
  id: number;
  row: number;
  col: number;
  correctX: number;
  correctY: number;
  currentX: number;
  currentY: number;
  width: number;
  height: number;
  rotation: number;
  initialRotation: number;
  isPlaced: boolean;
  tabEdges: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  canvas: HTMLCanvasElement;
}

export type Difficulty = 'easy' | 'hard';
export type PieceShape = 'rectangle' | 'polygon';

const TAB_SIZE_RATIO = 0.2;
const BEZIER_CONTROL_RATIO = 0.4;

function generateTabEdges(rows: number, cols: number): number[][][] {
  const edges: number[][][] = [];
  
  for (let row = 0; row < rows; row++) {
    edges[row] = [];
    for (let col = 0; col < cols; col++) {
      const top = row === 0 ? 0 : -edges[row - 1][col][2];
      const left = col === 0 ? 0 : -edges[row][col - 1][1];
      const bottom = row === rows - 1 ? 0 : (Math.random() > 0.5 ? 1 : -1);
      const right = col === cols - 1 ? 0 : (Math.random() > 0.5 ? 1 : -1);
      
      edges[row][col] = [top, right, bottom, left];
    }
  }
  
  return edges;
}

function buildPiecePath(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  tabEdges: { top: number; right: number; bottom: number; left: number },
  pieceShape: PieceShape
): void {
  const tabW = width * TAB_SIZE_RATIO;
  const tabH = height * TAB_SIZE_RATIO;
  
  ctx.beginPath();
  ctx.moveTo(0, 0);
  
  if (pieceShape === 'rectangle') {
    ctx.lineTo(width, 0);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    return;
  }
  
  const topTab = tabEdges.top;
  if (topTab === 0) {
    ctx.lineTo(width, 0);
  } else {
    const tabDir = topTab;
    const startX = width * (0.5 - TAB_SIZE_RATIO / 2);
    const endX = width * (0.5 + TAB_SIZE_RATIO / 2);
    const cp1x = startX + width * BEZIER_CONTROL_RATIO * TAB_SIZE_RATIO;
    const cp2x = endX - width * BEZIER_CONTROL_RATIO * TAB_SIZE_RATIO;
    const midX = width / 2;
    const tabY = -tabDir * tabH;
    const cpY = tabDir * tabH * 0.3;
    
    ctx.lineTo(startX, 0);
    ctx.bezierCurveTo(cp1x, cpY, cp1x, tabY, midX, tabY);
    ctx.bezierCurveTo(cp2x, tabY, cp2x, cpY, endX, 0);
    ctx.lineTo(width, 0);
  }
  
  const rightTab = tabEdges.right;
  if (rightTab === 0) {
    ctx.lineTo(width, height);
  } else {
    const tabDir = rightTab;
    const startY = height * (0.5 - TAB_SIZE_RATIO / 2);
    const endY = height * (0.5 + TAB_SIZE_RATIO / 2);
    const cp1y = startY + height * BEZIER_CONTROL_RATIO * TAB_SIZE_RATIO;
    const cp2y = endY - height * BEZIER_CONTROL_RATIO * TAB_SIZE_RATIO;
    const midY = height / 2;
    const tabX = width + tabDir * tabW;
    const cpX = width + tabDir * tabW * 0.3;
    
    ctx.lineTo(width, startY);
    ctx.bezierCurveTo(cpX, cp1y, tabX, cp1y, tabX, midY);
    ctx.bezierCurveTo(tabX, cp2y, cpX, cp2y, width, endY);
    ctx.lineTo(width, height);
  }
  
  const bottomTab = tabEdges.bottom;
  if (bottomTab === 0) {
    ctx.lineTo(0, height);
  } else {
    const tabDir = bottomTab;
    const startX = width * (0.5 + TAB_SIZE_RATIO / 2);
    const endX = width * (0.5 - TAB_SIZE_RATIO / 2);
    const cp1x = startX - width * BEZIER_CONTROL_RATIO * TAB_SIZE_RATIO;
    const cp2x = endX + width * BEZIER_CONTROL_RATIO * TAB_SIZE_RATIO;
    const midX = width / 2;
    const tabY = height + tabDir * tabH;
    const cpY = height + tabDir * tabH * 0.3;
    
    ctx.lineTo(startX, height);
    ctx.bezierCurveTo(cp1x, cpY, cp1x, tabY, midX, tabY);
    ctx.bezierCurveTo(cp2x, tabY, cp2x, cpY, endX, height);
    ctx.lineTo(0, height);
  }
  
  const leftTab = tabEdges.left;
  if (leftTab === 0) {
    ctx.closePath();
  } else {
    const tabDir = leftTab;
    const startY = height * (0.5 + TAB_SIZE_RATIO / 2);
    const endY = height * (0.5 - TAB_SIZE_RATIO / 2);
    const cp1y = startY - height * BEZIER_CONTROL_RATIO * TAB_SIZE_RATIO;
    const cp2y = endY + height * BEZIER_CONTROL_RATIO * TAB_SIZE_RATIO;
    const midY = height / 2;
    const tabX = -tabDir * tabW;
    const cpX = -tabDir * tabW * 0.3;
    
    ctx.lineTo(0, startY);
    ctx.bezierCurveTo(cpX, cp1y, tabX, cp1y, tabX, midY);
    ctx.bezierCurveTo(tabX, cp2y, cpX, cp2y, 0, endY);
    ctx.closePath();
  }
}

function renderPieceCanvas(
  image: HTMLImageElement,
  row: number,
  col: number,
  pieceWidth: number,
  pieceHeight: number,
  tabEdges: { top: number; right: number; bottom: number; left: number },
  pieceShape: PieceShape,
  gridSize: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const padding = Math.max(pieceWidth, pieceHeight) * TAB_SIZE_RATIO * 1.2;
  
  canvas.width = pieceWidth + padding * 2;
  canvas.height = pieceHeight + padding * 2;
  
  const ctx = canvas.getContext('2d')!;
  
  const imgWidth = image.naturalWidth || image.width;
  const imgHeight = image.naturalHeight || image.height;
  const srcPieceWidth = imgWidth / gridSize;
  const srcPieceHeight = imgHeight / gridSize;
  const sx = col * srcPieceWidth;
  const sy = row * srcPieceHeight;
  
  ctx.save();
  ctx.translate(padding, padding);
  
  buildPiecePath(ctx, pieceWidth, pieceHeight, tabEdges, pieceShape);
  ctx.clip();
  
  ctx.drawImage(image, sx, sy, srcPieceWidth, srcPieceHeight, 0, 0, pieceWidth, pieceHeight);
  
  ctx.restore();
  
  ctx.save();
  ctx.translate(padding, padding);
  buildPiecePath(ctx, pieceWidth, pieceHeight, tabEdges, pieceShape);
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(139, 90, 43, 0.3)';
  ctx.stroke();
  ctx.restore();
  
  return canvas;
}

export function cutPuzzle(
  image: HTMLImageElement,
  difficulty: Difficulty,
  pieceShape: PieceShape,
  boardWidth: number,
  boardHeight: number,
  trayWidth: number,
  trayHeight: number
): PuzzlePiece[] {
  const gridSize = difficulty === 'easy' ? 4 : 6;
  const rows = gridSize;
  const cols = gridSize;
  
  const pieceWidth = boardWidth / cols;
  const pieceHeight = boardHeight / rows;
  
  const edges = generateTabEdges(rows, cols);
  
  const pieces: PuzzlePiece[] = [];
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const [top, right, bottom, left] = edges[row][col];
      const tabEdges = { top, right, bottom, left };
      
      const canvas = renderPieceCanvas(
        image,
        row,
        col,
        pieceWidth,
        pieceHeight,
        tabEdges,
        pieceShape,
        gridSize
      );
      
      const padding = Math.max(pieceWidth, pieceHeight) * TAB_SIZE_RATIO * 1.2;
      const initialRotation = Math.random() * 30 - 15;
      
      const piece: PuzzlePiece = {
        id: row * cols + col,
        row,
        col,
        correctX: col * pieceWidth,
        correctY: row * pieceHeight,
        currentX: 0,
        currentY: 0,
        width: pieceWidth,
        height: pieceHeight,
        rotation: initialRotation,
        initialRotation,
        isPlaced: false,
        tabEdges,
        canvas,
      };
      
      pieces.push(piece);
    }
  }
  
  const shuffled = [...pieces].sort(() => Math.random() - 0.5);
  
  const padding = Math.max(pieceWidth, pieceHeight) * TAB_SIZE_RATIO * 1.2;
  const colsPerRow = Math.floor(trayWidth / (pieceWidth * 1.3));
  const rowHeight = pieceHeight * 1.5;
  
  shuffled.forEach((piece, index) => {
    const trayCol = index % colsPerRow;
    const trayRow = Math.floor(index / colsPerRow);
    
    const baseX = trayCol * pieceWidth * 1.3 + pieceWidth * 0.15;
    const baseY = trayRow * rowHeight + pieceHeight * 0.2;
    
    const randomOffsetX = (Math.random() - 0.5) * pieceWidth * 0.2;
    const randomOffsetY = (Math.random() - 0.5) * pieceHeight * 0.2;
    
    piece.currentX = baseX + randomOffsetX;
    piece.currentY = baseY + randomOffsetY;
    
    if (piece.currentY + pieceHeight > trayHeight - padding) {
      piece.currentY = trayHeight - pieceHeight - padding - Math.random() * 20;
    }
  });
  
  return shuffled;
}

export function getGridSize(difficulty: Difficulty): number {
  return difficulty === 'easy' ? 4 : 6;
}
