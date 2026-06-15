import {
  type Piece,
  type Position,
  type Puzzle,
  type MoveResult,
  getPuzzles,
  loadPuzzle,
  getPieceAt,
  getValidMoves,
  validateMove,
  aiMove,
  getTopMoves,
  evaluateWinRate,
  isInCheck,
  isCheckmate,
  getPieceName,
  getCurrentPuzzle,
  getBoard
} from './gameLogic';
import {
  initBoard,
  setPieces,
  setSelected,
  setTopMoves,
  getSelectedPiece,
  drawBoard,
  drawPiece,
  highlightSquare,
  animatePieceMove,
  animatePieceDrop,
  startAnimationLoop,
  calculateConfig,
  setEventHandlers,
  type BoardConfig
} from './board';
import {
  recordMove,
  generateReport,
  exportData,
  downloadExport,
  resetAnalysis,
  getWinRate,
  getMoveRecords,
  type MoveRecord,
  type AnalysisReport
} from './analysis';

let currentTurn: 'red' | 'black' = 'red';
let gameOver = false;
let moveCount = 0;
let currentConfig: BoardConfig;
let selectedPuzzleId: string | null = null;
let lastMoveTime = 0;

const canvasEl = document.getElementById('chessBoard') as HTMLCanvasElement;
const moveInfoEl = document.getElementById('moveInfo') as HTMLDivElement;
const puzzleListEl = document.getElementById('puzzleList') as HTMLDivElement;
const analysisPanelEl = document.getElementById('analysisPanel') as HTMLDivElement;
const moveListEl = document.getElementById('moveList') as HTMLDivElement;
const winrateRedEl = document.getElementById('winrateRed') as HTMLDivElement;
const winrateBlackEl = document.getElementById('winrateBlack') as HTMLDivElement;
const winrateLabelEl = document.getElementById('winrateLabel') as HTMLDivElement;
const reportSectionEl = document.getElementById('reportSection') as HTMLDivElement;
const reportStatsEl = document.getElementById('reportStats') as HTMLDivElement;
const reportTextEl = document.getElementById('reportText') as HTMLDivElement;
const exportJSONBtn = document.getElementById('exportJSON') as HTMLButtonElement;
const exportTXTBtn = document.getElementById('exportTXT') as HTMLButtonElement;

function init(): void {
  currentConfig = calculateConfig();
  initBoard(canvasEl, currentConfig);
  startAnimationLoop();
  renderPuzzleList();
  bindGlobalEvents();
  updateWinRateDisplay();
}

function renderPuzzleList(): void {
  const puzzles = getPuzzles();
  const groups: Record<string, Puzzle[]> = {
    beginner: [],
    intermediate: [],
    master: []
  };

  const diffLabels: Record<string, string> = {
    beginner: '入门',
    intermediate: '进阶',
    master: '大师'
  };

  for (const p of puzzles) {
    groups[p.difficulty].push(p);
  }

  let html = '<h3>残局谱</h3>';
  for (const [key, label] of Object.entries(diffLabels)) {
    const group = groups[key];
    if (group.length === 0) continue;
    html += `<div class="puzzle-group">`;
    html += `<div class="puzzle-group-title">▸ ${label}</div>`;
    for (const p of group) {
      html += `<div class="puzzle-item" data-id="${p.id}">${p.name}</div>`;
    }
    html += `</div>`;
  }

  puzzleListEl.innerHTML = html;

  puzzleListEl.querySelectorAll('.puzzle-item').forEach(el => {
    el.addEventListener('click', () => {
      const id = (el as HTMLElement).dataset.id!;
      selectPuzzle(id);
    });
  });
}

function selectPuzzle(puzzleId: string): void {
  puzzleListEl.querySelectorAll('.puzzle-item').forEach(el => {
    el.classList.remove('active');
    if ((el as HTMLElement).dataset.id === puzzleId) {
      el.classList.add('active');
    }
  });

  const pieces = loadPuzzle(puzzleId);
  if (pieces.length === 0) return;

  selectedPuzzleId = puzzleId;
  currentTurn = 'red';
  gameOver = false;
  moveCount = 0;
  lastMoveTime = Date.now();
  resetAnalysis();

  currentConfig = calculateConfig();
  initBoard(canvasEl, currentConfig);
  setPieces(pieces);

  setEventHandlers(handlePieceClick, handleMoveAttempt);

  moveInfoEl.textContent = '第1着 红方先行';
  moveListEl.innerHTML = '';

  const puzzle = getCurrentPuzzle();
  if (puzzle) {
    for (const p of pieces) {
      animatePieceDrop(p, p.row, p.col);
    }
  }

  updateWinRateDisplay();
  hideReport();
}

function handlePieceClick(piece: Piece): void {
  if (gameOver) return;
  if (currentTurn !== 'red') return;
  if (piece.color !== 'red') {
    if (getSelectedPiece()) {
      const sel = getSelectedPiece()!;
      handleMoveAttempt({ row: sel.row, col: sel.col }, { row: piece.row, col: piece.col });
    }
    return;
  }

  const moves = getValidMoves(piece.row, piece.col);
  setSelected(piece, moves);
  drawBoard();
}

function handleMoveAttempt(from: Position, to: Position): void {
  if (gameOver || currentTurn !== 'red') return;

  const piece = getPieceAt(from.row, from.col);
  if (!piece || piece.color !== 'red') return;

  const validMoves = getValidMoves(from.row, from.col);
  const isValid = validMoves.some(m => m.row === to.row && m.col === to.col);
  if (!isValid) {
    setSelected(null, []);
    drawBoard();
    return;
  }

  makeMove(from, to, 'red', () => {
    if (gameOver) return;

    const captured = getPieceAt(to.row, to.col);
    const record = recordMove('red', from, to, piece.type, captured?.type);
    updateMoveList(record);

    const topM = getTopMoves('black', 3);
    setTopMoves(topM);
    updateWinRateDisplay();

    if (isInCheck('black')) {
      if (isCheckmate('black')) {
        gameOver = true;
        moveInfoEl.textContent = `将杀！红方胜！`;
        showReport();
        setTopMoves([]);
        drawBoard();
        return;
      }
    }

    currentTurn = 'black';
    moveInfoEl.textContent = `第${moveCount + 1}着 黑方思考中…`;

    setTimeout(() => {
      doAiMove();
    }, 1500);
  });
}

function makeMove(from: Position, to: Position, color: 'red' | 'black', onComplete?: () => void): void {
  const piece = getPieceAt(from.row, from.col);
  if (!piece) return;

  const result = validateMove(from.row, from.col, to.row, to.col);
  if (!result.valid) return;

  moveCount++;
  setSelected(null, []);

  const refreshedPieces = getAllPieces();
  setPieces(refreshedPieces);

  animatePieceMove(piece, from.row, from.col, to.row, to.col, 200, () => {
    const finalPieces = getAllPieces();
    setPieces(finalPieces);
    drawBoard();
    if (onComplete) onComplete();
  });
}

function doAiMove(): void {
  if (gameOver) return;

  const aiResult = aiMove('black');
  if (!aiResult) {
    gameOver = true;
    moveInfoEl.textContent = '黑方无子可动，红方胜！';
    showReport();
    return;
  }

  const { from, to } = aiResult;
  const piece = getPieceAt(from.row, from.col);
  if (!piece) return;

  const capturedBefore = getPieceAt(to.row, to.col);

  makeMove(from, to, 'black', () => {
    const record = recordMove('black', from, to, piece.type, capturedBefore?.type);
    updateMoveList(record);

    const topM = getTopMoves('red', 3);
    setTopMoves(topM);
    updateWinRateDisplay();

    if (isInCheck('red')) {
      if (isCheckmate('red')) {
        gameOver = true;
        moveInfoEl.textContent = '将杀！黑方胜！';
        showReport();
        setTopMoves([]);
        drawBoard();
        return;
      }
    }

    currentTurn = 'red';
    moveInfoEl.textContent = `第${moveCount + 1}着 红方走棋`;
    drawBoard();
  });
}

function getAllPieces(): Piece[] {
  const result: Piece[] = [];
  const board = getBoard();
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c]) result.push(board[r][c]!);
    }
  }
  return result;
}

function updateMoveList(record: MoveRecord): void {
  const turningPoints = detectTurningPointsFromRecords();
  const isTurning = turningPoints.includes(record.moveNumber);

  const colorLabel = record.color === 'red' ? '红' : '黑';
  const pieceChar = getPieceName(record.pieceType, record.color);
  const capturedStr = record.captured ? ' 吃' + getPieceName(record.captured, record.color === 'red' ? 'black' : 'red') : '';
  const star = isTurning ? ' ★' : '';

  const entry = document.createElement('div');
  entry.className = `move-entry${isTurning ? ' turning-point' : ''}`;
  entry.textContent = `${record.moveNumber}. ${colorLabel}${pieceChar} (${record.from.col},${record.from.row})→(${record.to.col},${record.to.row})${capturedStr} ${record.timeSpent}s${star}`;

  moveListEl.appendChild(entry);
  moveListEl.scrollTop = moveListEl.scrollHeight;

  triggerAnalysisUnfurl();
}

function detectTurningPointsFromRecords(): number[] {
  const records = getMoveRecords();
  const points: number[] = [];
  for (const r of records) {
    if (Math.abs(r.winRateAfter - r.winRateBefore) >= 20) {
      points.push(r.moveNumber);
    }
  }
  return points;
}

function triggerAnalysisUnfurl(): void {
  analysisPanelEl.classList.remove('unfurl');
  void analysisPanelEl.offsetWidth;
  analysisPanelEl.classList.add('unfurl');
}

function updateWinRateDisplay(): void {
  const wr = getWinRate();
  const redPct = Math.round(wr);
  const blackPct = 100 - redPct;

  winrateRedEl.style.width = `${redPct}%`;
  winrateBlackEl.style.width = `${blackPct}%`;
  winrateLabelEl.textContent = `红方胜率 ${redPct}% — ${blackPct}% 黑方胜率`;
}

function showReport(): void {
  const report = generateReport();

  reportSectionEl.style.display = 'block';

  reportStatsEl.innerHTML = `
    总步数：${report.totalMoves}<br>
    平均每步用时：${report.avgTimePerMove}秒<br>
    红方平均用时：${report.redAvgTime}秒<br>
    黑方平均用时：${report.blackAvgTime}秒<br>
    失误次数：${report.mistakes}<br>
    转折点：${report.turningPoints.length > 0 ? '第' + report.turningPoints.join('、') + '着' : '无'}
  `;

  reportTextEl.textContent = report.summary;

  exportJSONBtn.onclick = () => downloadExport('json');
  exportTXTBtn.onclick = () => downloadExport('txt');
}

function hideReport(): void {
  reportSectionEl.style.display = 'none';
}

function bindGlobalEvents(): void {
  window.addEventListener('resize', () => {
    currentConfig = calculateConfig();
    initBoard(canvasEl, currentConfig);
    const pieces = getAllPieces();
    setPieces(pieces);
    drawBoard();
  });
}

init();
