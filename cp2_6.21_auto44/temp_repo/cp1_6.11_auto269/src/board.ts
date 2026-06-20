import {
  type Piece,
  type PieceColor,
  type PieceType,
  type Position,
  getPieceAt,
  getValidMoves,
  getPieceName
} from './gameLogic';

export interface BoardConfig {
  cellSize: number;
  padding: number;
  pieceRadius: number;
}

const BOARD_BG = '#D2B48C';
const LINE_COLOR = '#4A2C1A';
const RED_PIECE_BG = '#CC3333';
const BLACK_PIECE_BG = '#2F4F2F';
const GOLD_TEXT = '#FFD700';
const SELECTED_GLOW = '#FFD700';
const HIGHLIGHT_COLOR = 'rgba(255, 215, 0, 0.4)';

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let config: BoardConfig;
let pieces: Piece[] = [];
let selectedPiece: Piece | null = null;
let validMoves: Position[] = [];
let isDragging = false;
let dragX = 0;
let dragY = 0;
let topMoves: { from: Position; to: Position; score: number }[] = [];
let animatingPiece: {
  piece: Piece;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  startTime: number;
  duration: number;
  onComplete?: () => void;
} | null = null;

let onPieceClick: ((piece: Piece) => void) | null = null;
let onMoveAttempt: ((from: Position, to: Position) => void) | null = null;

export function initBoard(canvasEl: HTMLCanvasElement, boardConfig: BoardConfig): void {
  canvas = canvasEl;
  config = boardConfig;
  const dpr = window.devicePixelRatio || 1;

  const canvasW = 8 * config.cellSize + 2 * config.padding;
  const canvasH = 9 * config.cellSize + 2 * config.padding;

  canvas.width = canvasW * dpr;
  canvas.height = canvasH * dpr;
  canvas.style.width = canvasW + 'px';
  canvas.style.height = canvasH + 'px';

  ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);

  bindEvents();
}

export function setPieces(newPieces: Piece[]): void {
  pieces = newPieces;
  selectedPiece = null;
  validMoves = [];
  topMoves = [];
}

export function setEventHandlers(
  clickHandler: (piece: Piece) => void,
  moveHandler: (from: Position, to: Position) => void
): void {
  onPieceClick = clickHandler;
  onMoveAttempt = moveHandler;
}

export function setSelected(piece: Piece | null, moves: Position[]): void {
  selectedPiece = piece;
  validMoves = moves;
}

export function setTopMoves(moves: { from: Position; to: Position; score: number }[]): void {
  topMoves = moves;
}

export function getSelectedPiece(): Piece | null {
  return selectedPiece;
}

function posToXY(row: number, col: number): { x: number; y: number } {
  return {
    x: config.padding + col * config.cellSize,
    y: config.padding + row * config.cellSize
  };
}

function xyToPos(x: number, y: number): Position | null {
  const col = Math.round((x - config.padding) / config.cellSize);
  const row = Math.round((y - config.padding) / config.cellSize);
  if (row < 0 || row > 9 || col < 0 || col > 8) return null;
  const { x: snapX, y: snapY } = posToXY(row, col);
  const dist = Math.sqrt((x - snapX) ** 2 + (y - snapY) ** 2);
  if (dist > config.cellSize * 0.6) return null;
  return { row, col };
}

export function drawBoard(): void {
  const w = 8 * config.cellSize + 2 * config.padding;
  const h = 9 * config.cellSize + 2 * config.padding;

  ctx.clearRect(0, 0, w, h);

  ctx.fillStyle = BOARD_BG;
  ctx.fillRect(0, 0, w, h);

  drawWoodGrain();

  ctx.strokeStyle = LINE_COLOR;
  ctx.lineWidth = 1.5;

  for (let c = 0; c <= 8; c++) {
    const x = config.padding + c * config.cellSize;
    ctx.beginPath();
    ctx.moveTo(x, config.padding);
    ctx.lineTo(x, config.padding + 4 * config.cellSize);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x, config.padding + 5 * config.cellSize);
    ctx.lineTo(x, config.padding + 9 * config.cellSize);
    ctx.stroke();
  }

  for (let r = 0; r <= 9; r++) {
    if (r === 0 || r === 9) {
      const y = config.padding + r * config.cellSize;
      ctx.beginPath();
      ctx.moveTo(config.padding, y);
      ctx.lineTo(config.padding + 8 * config.cellSize, y);
      ctx.stroke();
    } else {
      const y = config.padding + r * config.cellSize;
      ctx.beginPath();
      ctx.moveTo(config.padding, y);
      ctx.lineTo(config.padding + 8 * config.cellSize, y);
      ctx.stroke();
    }
  }

  drawRiver();
  drawPalace();
  drawCannonPositions();
  drawPawnPositions();

  if (selectedPiece) {
    highlightSquare(selectedPiece.row, selectedPiece.col);
  }

  for (const m of validMoves) {
    drawValidMoveIndicator(m.row, m.col);
  }

  for (const tm of topMoves) {
    drawTopMoveArrow(tm.from, tm.to, tm.score);
  }

  for (const p of pieces) {
    if (isDragging && selectedPiece && p.id === selectedPiece.id) continue;
    if (animatingPiece && animatingPiece.piece.id === p.id) continue;
    drawPiece(p, posToXY(p.row, p.col).x, posToXY(p.row, p.col).y);
  }

  if (isDragging && selectedPiece) {
    drawPiece(selectedPiece, dragX, dragY);
  }

  if (animatingPiece) {
    const elapsed = performance.now() - animatingPiece.startTime;
    const t = Math.min(1, elapsed / animatingPiece.duration);
    const eased = 1 - Math.pow(1 - t, 3);
    const cx = animatingPiece.fromX + (animatingPiece.toX - animatingPiece.fromX) * eased;
    const cy = animatingPiece.fromY + (animatingPiece.toY - animatingPiece.fromY) * eased;
    drawPiece(animatingPiece.piece, cx, cy);

    if (t >= 1) {
      const cb = animatingPiece.onComplete;
      animatingPiece = null;
      if (cb) cb();
    }
  }
}

function drawWoodGrain(): void {
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.strokeStyle = '#8B6914';
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 30; i++) {
    const y = Math.random() * (9 * config.cellSize + 2 * config.padding);
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x < 8 * config.cellSize + 2 * config.padding; x += 20) {
      ctx.lineTo(x, y + (Math.random() - 0.5) * 3);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawRiver(): void {
  const riverTop = config.padding + 4 * config.cellSize;
  const riverBottom = config.padding + 5 * config.cellSize;
  const riverHeight = config.cellSize;

  ctx.fillStyle = BOARD_BG;
  ctx.fillRect(config.padding, riverTop, 8 * config.cellSize, riverHeight);

  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.strokeStyle = '#4A6C8C';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 5; i++) {
    const waveY = riverTop + (riverHeight / 6) * (i + 1);
    ctx.beginPath();
    for (let x = config.padding; x <= config.padding + 8 * config.cellSize; x += 2) {
      const yOffset = Math.sin((x - config.padding) / 20 + i) * 3;
      if (x === config.padding) ctx.moveTo(x, waveY + yOffset);
      else ctx.lineTo(x, waveY + yOffset);
    }
    ctx.stroke();
  }
  ctx.restore();

  ctx.strokeStyle = LINE_COLOR;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(config.padding, riverTop);
  ctx.lineTo(config.padding + 8 * config.cellSize, riverTop);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(config.padding, riverBottom);
  ctx.lineTo(config.padding + 8 * config.cellSize, riverBottom);
  ctx.stroke();

  ctx.font = `bold ${config.cellSize * 0.45}px "Ma Shan Zheng", "LiSu", "STLiti", serif`;
  ctx.fillStyle = LINE_COLOR;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const riverMidY = (riverTop + riverBottom) / 2;
  ctx.fillText('楚 河', config.padding + 2 * config.cellSize, riverMidY);
  ctx.fillText('汉 界', config.padding + 6 * config.cellSize, riverMidY);
}

function drawPalace(): void {
  ctx.strokeStyle = LINE_COLOR;
  ctx.lineWidth = 1;

  const drawDiag = (r1: number, c1: number, r2: number, c2: number) => {
    const p1 = posToXY(r1, c1);
    const p2 = posToXY(r2, c2);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  };

  drawDiag(0, 3, 2, 5);
  drawDiag(0, 5, 2, 3);
  drawDiag(7, 3, 9, 5);
  drawDiag(7, 5, 9, 3);
}

function drawCannonPositions(): void {
  const positions = [
    { row: 2, col: 1 }, { row: 2, col: 7 },
    { row: 7, col: 1 }, { row: 7, col: 7 }
  ];
  for (const pos of positions) {
    drawStarMark(pos.row, pos.col);
  }
}

function drawPawnPositions(): void {
  const positions = [
    { row: 3, col: 0 }, { row: 3, col: 2 }, { row: 3, col: 4 },
    { row: 3, col: 6 }, { row: 3, col: 8 },
    { row: 6, col: 0 }, { row: 6, col: 2 }, { row: 6, col: 4 },
    { row: 6, col: 6 }, { row: 6, col: 8 }
  ];
  for (const pos of positions) {
    drawStarMark(pos.row, pos.col);
  }
}

function drawStarMark(row: number, col: number): void {
  const { x, y } = posToXY(row, col);
  const s = config.cellSize * 0.12;
  const g = config.cellSize * 0.06;
  ctx.strokeStyle = LINE_COLOR;
  ctx.lineWidth = 1;

  const drawCorner = (dx: number, dy: number) => {
    if ((col === 0 && dx < 0) || (col === 8 && dx > 0)) return;
    ctx.beginPath();
    ctx.moveTo(x + dx * g, y + dy * (g + s));
    ctx.lineTo(x + dx * g, y + dy * g);
    ctx.lineTo(x + dx * (g + s), y + dy * g);
    ctx.stroke();
  };

  drawCorner(1, 1);
  drawCorner(-1, 1);
  drawCorner(1, -1);
  drawCorner(-1, -1);
}

export function drawPiece(piece: Piece, x: number, y: number): void {
  const r = config.pieceRadius;
  const bgColor = piece.color === 'red' ? RED_PIECE_BG : BLACK_PIECE_BG;

  ctx.save();

  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  const grad = ctx.createRadialGradient(x - r * 0.2, y - r * 0.2, r * 0.1, x, y, r);
  grad.addColorStop(0, lightenColor(bgColor, 30));
  grad.addColorStop(1, bgColor);

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowColor = 'transparent';

  ctx.strokeStyle = darkenColor(bgColor, 40);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.strokeStyle = GOLD_TEXT;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, r - 3, 0, Math.PI * 2);
  ctx.stroke();

  ctx.font = `bold ${r * 1.2}px "ZCOOL XiaoWei", "KaiTi", "STKaiti", serif`;
  ctx.fillStyle = GOLD_TEXT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(getPieceName(piece.type, piece.color), x, y + 1);

  ctx.restore();
}

export function highlightSquare(row: number, col: number): void {
  const { x, y } = posToXY(row, col);
  const r = config.pieceRadius + 4;

  ctx.save();
  ctx.strokeStyle = SELECTED_GLOW;
  ctx.lineWidth = 3;
  ctx.shadowColor = SELECTED_GLOW;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawValidMoveIndicator(row: number, col: number): void {
  const { x, y } = posToXY(row, col);
  const piece = getPieceAt(row, col);

  ctx.save();
  if (piece) {
    ctx.strokeStyle = 'rgba(255, 80, 80, 0.7)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x, y, config.pieceRadius + 3, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.fillStyle = 'rgba(100, 180, 100, 0.5)';
    ctx.beginPath();
    ctx.arc(x, y, config.cellSize * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawTopMoveArrow(from: Position, to: Position, score: number): void {
  const fromXY = posToXY(from.row, from.col);
  const toXY = posToXY(to.row, to.col);
  const allScores = topMoves.map(m => Math.abs(m.score));
  const maxScore = Math.max(...allScores, 1);
  const opacity = 0.3 + 0.5 * (Math.abs(score) / maxScore);

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);

  const angle = Math.atan2(toXY.y - fromXY.y, toXY.x - fromXY.x);
  const startOffset = config.pieceRadius + 4;
  const endOffset = config.pieceRadius + 8;

  const sx = fromXY.x + Math.cos(angle) * startOffset;
  const sy = fromXY.y + Math.sin(angle) * startOffset;
  const ex = toXY.x - Math.cos(angle) * endOffset;
  const ey = toXY.y - Math.sin(angle) * endOffset;

  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(ex, ey);
  ctx.stroke();

  const arrowLen = 10;
  const arrowAngle = Math.PI / 6;
  ctx.setLineDash([]);
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.moveTo(ex, ey);
  ctx.lineTo(
    ex - arrowLen * Math.cos(angle - arrowAngle),
    ey - arrowLen * Math.sin(angle - arrowAngle)
  );
  ctx.lineTo(
    ex - arrowLen * Math.cos(angle + arrowAngle),
    ey - arrowLen * Math.sin(angle + arrowAngle)
  );
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

export function animatePieceMove(
  piece: Piece,
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number,
  duration: number,
  onComplete?: () => void
): void {
  const fromXY = posToXY(fromRow, fromCol);
  const toXY = posToXY(toRow, toCol);
  animatingPiece = {
    piece,
    fromX: fromXY.x,
    fromY: fromXY.y,
    toX: toXY.x,
    toY: toXY.y,
    startTime: performance.now(),
    duration,
    onComplete
  };
}

export function animatePieceDrop(
  piece: Piece,
  targetRow: number,
  targetCol: number,
  onComplete?: () => void
): void {
  const targetXY = posToXY(targetRow, targetCol);
  const shakeDuration = 200;
  const shakeStart = performance.now();

  const animateShake = () => {
    const elapsed = performance.now() - shakeStart;
    if (elapsed < shakeDuration) {
      const progress = elapsed / shakeDuration;
      const offset = 2 * (1 - progress) * Math.sin(progress * Math.PI * 4);
      drawBoard();
      drawPiece(piece, targetXY.x + offset, targetXY.y);
      requestAnimationFrame(animateShake);
    } else {
      drawBoard();
      if (onComplete) onComplete();
    }
  };

  requestAnimationFrame(animateShake);
}

export function startAnimationLoop(): void {
  const loop = () => {
    drawBoard();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

function bindEvents(): void {
  let mouseX = 0;
  let mouseY = 0;

  const getCanvasXY = (e: MouseEvent | TouchEvent) => {
    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }
    const scaleX = parseFloat(canvas.style.width) / rect.width;
    const scaleY = parseFloat(canvas.style.height) / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const findPieceAtXY = (x: number, y: number): Piece | null => {
    for (const p of pieces) {
      const { x: px, y: py } = posToXY(p.row, p.col);
      const dist = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
      if (dist <= config.pieceRadius + 2) return p;
    }
    return null;
  };

  canvas.addEventListener('mousedown', (e) => {
    const { x, y } = getCanvasXY(e);
    const clickedPos = xyToPos(x, y);
    const clickedPiece = findPieceAtXY(x, y);

    if (clickedPiece) {
      if (onPieceClick) onPieceClick(clickedPiece);
      isDragging = true;
      dragX = x;
      dragY = y;
    } else if (clickedPos && selectedPiece) {
      if (onMoveAttempt) onMoveAttempt({ row: selectedPiece.row, col: selectedPiece.col }, clickedPos);
    }
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const { x, y } = getCanvasXY(e);
    dragX = x;
    dragY = y;
  });

  canvas.addEventListener('mouseup', (e) => {
    if (!isDragging || !selectedPiece) {
      isDragging = false;
      return;
    }

    const { x, y } = getCanvasXY(e);
    const targetPos = xyToPos(x, y);
    isDragging = false;

    if (targetPos && !(targetPos.row === selectedPiece.row && targetPos.col === selectedPiece.col)) {
      if (onMoveAttempt) onMoveAttempt({ row: selectedPiece.row, col: selectedPiece.col }, targetPos);
    }
  });

  canvas.addEventListener('mouseleave', () => {
    isDragging = false;
  });

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const { x, y } = getCanvasXY(e);
    const clickedPos = xyToPos(x, y);
    const clickedPiece = findPieceAtXY(x, y);

    if (clickedPiece) {
      if (onPieceClick) onPieceClick(clickedPiece);
      isDragging = true;
      dragX = x;
      dragY = y;
    } else if (clickedPos && selectedPiece) {
      if (onMoveAttempt) onMoveAttempt({ row: selectedPiece.row, col: selectedPiece.col }, clickedPos);
    }
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!isDragging) return;
    const { x, y } = getCanvasXY(e);
    dragX = x;
    dragY = y;
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    if (!isDragging || !selectedPiece) {
      isDragging = false;
      return;
    }
    const targetPos = xyToPos(dragX, dragY);
    isDragging = false;

    if (targetPos && !(targetPos.row === selectedPiece.row && targetPos.col === selectedPiece.col)) {
      if (onMoveAttempt) onMoveAttempt({ row: selectedPiece.row, col: selectedPiece.col }, targetPos);
    }
  });
}

function lightenColor(hex: string, amount: number): string {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b = Math.min(255, (num & 0xff) + amount);
  return `rgb(${r},${g},${b})`;
}

function darkenColor(hex: string, amount: number): string {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, ((num >> 16) & 0xff) - amount);
  const g = Math.max(0, ((num >> 8) & 0xff) - amount);
  const b = Math.max(0, (num & 0xff) - amount);
  return `rgb(${r},${g},${b})`;
}

export function calculateConfig(): BoardConfig {
  const isMobile = window.innerWidth <= 900;
  const maxBoardWidth = isMobile ? window.innerWidth - 32 : Math.min(window.innerWidth * 0.5, 560);
  const cellSize = Math.max(30, Math.floor(maxBoardWidth / 10));
  const pieceRadius = isMobile ? Math.max(12, cellSize * 0.4) : Math.max(18, cellSize * 0.43);

  return {
    cellSize,
    padding: Math.max(20, cellSize * 0.6),
    pieceRadius
  };
}
