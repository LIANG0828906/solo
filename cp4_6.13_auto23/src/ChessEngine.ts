import type {
  Board,
  Piece,
  PieceColor,
  PieceType,
  Position,
  Move,
  Difficulty,
} from './types';

export const BOARD_ROWS = 10;
export const BOARD_COLS = 9;

export const PIECE_VALUES: Record<PieceType, number> = {
  K: 10000,
  R: 900,
  H: 450,
  C: 450,
  A: 200,
  E: 200,
  P: 100,
};

export const PIECE_CHARS: Record<PieceColor, Record<PieceType, string>> = {
  red: { K: '帅', A: '仕', E: '相', H: '馬', R: '車', C: '炮', P: '兵' },
  black: { K: '将', A: '士', E: '象', H: '馬', R: '車', C: '砲', P: '卒' },
};

let pieceIdCounter = 0;
const makePiece = (type: PieceType, color: PieceColor): Piece => ({
  type,
  color,
  id: `${color}-${type}-${pieceIdCounter++}`,
});

export function createInitialBoard(): Board {
  pieceIdCounter = 0;
  const board: Board = Array.from({ length: BOARD_ROWS }, () =>
    Array(BOARD_COLS).fill(null)
  );

  const setup = (row: number, color: PieceColor) => {
    board[row][0] = makePiece('R', color);
    board[row][1] = makePiece('H', color);
    board[row][2] = makePiece('E', color);
    board[row][3] = makePiece('A', color);
    board[row][4] = makePiece('K', color);
    board[row][5] = makePiece('A', color);
    board[row][6] = makePiece('E', color);
    board[row][7] = makePiece('H', color);
    board[row][8] = makePiece('R', color);
  };

  setup(0, 'black');
  setup(9, 'red');

  board[2][1] = makePiece('C', 'black');
  board[2][7] = makePiece('C', 'black');
  board[7][1] = makePiece('C', 'red');
  board[7][7] = makePiece('C', 'red');

  for (let c = 0; c < BOARD_COLS; c += 2) {
    board[3][c] = makePiece('P', 'black');
    board[6][c] = makePiece('P', 'red');
  }

  return board;
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => row.slice());
}

export function isInBoard(pos: Position): boolean {
  return pos.row >= 0 && pos.row < BOARD_ROWS && pos.col >= 0 && pos.col < BOARD_COLS;
}

export function isInPalace(pos: Position, color: PieceColor): boolean {
  if (pos.col < 3 || pos.col > 5) return false;
  if (color === 'red') return pos.row >= 7 && pos.row <= 9;
  return pos.row >= 0 && pos.row <= 2;
}

export function findKing(board: Board, color: PieceColor): Position | null {
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const p = board[r][c];
      if (p && p.color === color && p.type === 'K') return { row: r, col: c };
    }
  }
  return null;
}

function generateKingMoves(board: Board, from: Position, piece: Piece): Position[] {
  const moves: Position[] = [];
  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  for (const [dr, dc] of dirs) {
    const to = { row: from.row + dr, col: from.col + dc };
    if (!isInPalace(to, piece.color)) continue;
    const target = board[to.row][to.col];
    if (!target || target.color !== piece.color) moves.push(to);
  }
  const opponentColor: PieceColor = piece.color === 'red' ? 'black' : 'red';
  const oppKing = findKing(board, opponentColor);
  if (oppKing && oppKing.col === from.col) {
    let blocked = false;
    const [minR, maxR] =
      from.row < oppKing.row ? [from.row, oppKing.row] : [oppKing.row, from.row];
    for (let r = minR + 1; r < maxR; r++) {
      if (board[r][from.col]) {
        blocked = true;
        break;
      }
    }
    if (!blocked) moves.push(oppKing);
  }
  return moves;
}

function generateAdvisorMoves(
  board: Board,
  from: Position,
  piece: Piece
): Position[] {
  const moves: Position[] = [];
  const dirs = [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ];
  for (const [dr, dc] of dirs) {
    const to = { row: from.row + dr, col: from.col + dc };
    if (!isInPalace(to, piece.color)) continue;
    const target = board[to.row][to.col];
    if (!target || target.color !== piece.color) moves.push(to);
  }
  return moves;
}

function generateElephantMoves(
  board: Board,
  from: Position,
  piece: Piece
): Position[] {
  const moves: Position[] = [];
  const dirs = [
    [-2, -2],
    [-2, 2],
    [2, -2],
    [2, 2],
  ];
  const eyes = [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ];
  for (let i = 0; i < 4; i++) {
    const [dr, dc] = dirs[i];
    const [er, ec] = eyes[i];
    const to = { row: from.row + dr, col: from.col + dc };
    if (!isInBoard(to)) continue;
    if (piece.color === 'red' && to.row < 5) continue;
    if (piece.color === 'black' && to.row > 4) continue;
    if (board[from.row + er][from.col + ec]) continue;
    const target = board[to.row][to.col];
    if (!target || target.color !== piece.color) moves.push(to);
  }
  return moves;
}

function generateHorseMoves(
  board: Board,
  from: Position,
  piece: Piece
): Position[] {
  const moves: Position[] = [];
  const steps = [
    [-2, -1, -1, 0],
    [-2, 1, -1, 0],
    [2, -1, 1, 0],
    [2, 1, 1, 0],
    [-1, -2, 0, -1],
    [1, -2, 0, -1],
    [-1, 2, 0, 1],
    [1, 2, 0, 1],
  ];
  for (const [dr, dc, br, bc] of steps) {
    const to = { row: from.row + dr, col: from.col + dc };
    if (!isInBoard(to)) continue;
    if (board[from.row + br][from.col + bc]) continue;
    const target = board[to.row][to.col];
    if (!target || target.color !== piece.color) moves.push(to);
  }
  return moves;
}

function generateRookMoves(
  board: Board,
  from: Position,
  piece: Piece
): Position[] {
  const moves: Position[] = [];
  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  for (const [dr, dc] of dirs) {
    let r = from.row + dr;
    let c = from.col + dc;
    while (isInBoard({ row: r, col: c })) {
      const target = board[r][c];
      if (!target) {
        moves.push({ row: r, col: c });
      } else {
        if (target.color !== piece.color) moves.push({ row: r, col: c });
        break;
      }
      r += dr;
      c += dc;
    }
  }
  return moves;
}

function generateCannonMoves(
  board: Board,
  from: Position,
  piece: Piece
): Position[] {
  const moves: Position[] = [];
  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  for (const [dr, dc] of dirs) {
    let r = from.row + dr;
    let c = from.col + dc;
    while (isInBoard({ row: r, col: c }) && !board[r][c]) {
      moves.push({ row: r, col: c });
      r += dr;
      c += dc;
    }
    if (isInBoard({ row: r, col: c })) {
      r += dr;
      c += dc;
      while (isInBoard({ row: r, col: c })) {
        const target = board[r][c];
        if (target) {
          if (target.color !== piece.color) moves.push({ row: r, col: c });
          break;
        }
        r += dr;
        c += dc;
      }
    }
  }
  return moves;
}

function generatePawnMoves(
  board: Board,
  from: Position,
  piece: Piece
): Position[] {
  const moves: Position[] = [];
  const forward = piece.color === 'red' ? -1 : 1;
  const crossed = piece.color === 'red' ? from.row <= 4 : from.row >= 5;

  const ahead = { row: from.row + forward, col: from.col };
  if (isInBoard(ahead)) {
    const target = board[ahead.row][ahead.col];
    if (!target || target.color !== piece.color) moves.push(ahead);
  }

  if (crossed) {
    for (const dc of [-1, 1]) {
      const side = { row: from.row, col: from.col + dc };
      if (isInBoard(side)) {
        const target = board[side.row][side.col];
        if (!target || target.color !== piece.color) moves.push(side);
      }
    }
  }

  return moves;
}

export function generatePieceMoves(
  board: Board,
  from: Position
): Position[] {
  const piece = board[from.row][from.col];
  if (!piece) return [];

  let moves: Position[];
  switch (piece.type) {
    case 'K':
      moves = generateKingMoves(board, from, piece);
      break;
    case 'A':
      moves = generateAdvisorMoves(board, from, piece);
      break;
    case 'E':
      moves = generateElephantMoves(board, from, piece);
      break;
    case 'H':
      moves = generateHorseMoves(board, from, piece);
      break;
    case 'R':
      moves = generateRookMoves(board, from, piece);
      break;
    case 'C':
      moves = generateCannonMoves(board, from, piece);
      break;
    case 'P':
      moves = generatePawnMoves(board, from, piece);
      break;
  }

  return moves.filter((to) => {
    const testBoard = cloneBoard(board);
    applyMoveToBoard(testBoard, {
      from,
      to,
      piece,
      captured: testBoard[to.row][to.col],
    });
    return !isInCheck(testBoard, piece.color);
  });
}

export function generateAllMoves(board: Board, color: PieceColor): Move[] {
  const moves: Move[] = [];
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const piece = board[r][c];
      if (!piece || piece.color !== color) continue;
      const from = { row: r, col: c };
      const targets = generatePieceMoves(board, from);
      for (const to of targets) {
        moves.push({
          from,
          to,
          piece,
          captured: board[to.row][to.col],
        });
      }
    }
  }
  return moves;
}

export function applyMoveToBoard(board: Board, move: Move): void {
  board[move.to.row][move.to.col] = move.piece;
  board[move.from.row][move.from.col] = null;
}

export function undoMoveOnBoard(board: Board, move: Move): void {
  board[move.from.row][move.from.col] = move.piece;
  board[move.to.row][move.to.col] = move.captured;
}

export function isInCheck(board: Board, color: PieceColor): boolean {
  const kingPos = findKing(board, color);
  if (!kingPos) return true;
  const opponentColor: PieceColor = color === 'red' ? 'black' : 'red';
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const piece = board[r][c];
      if (!piece || piece.color !== opponentColor) continue;
      let pseudo: Position[];
      switch (piece.type) {
        case 'K':
          pseudo = generateKingMoves(board, { row: r, col: c }, piece);
          break;
        case 'A':
          pseudo = generateAdvisorMoves(board, { row: r, col: c }, piece);
          break;
        case 'E':
          pseudo = generateElephantMoves(board, { row: r, col: c }, piece);
          break;
        case 'H':
          pseudo = generateHorseMoves(board, { row: r, col: c }, piece);
          break;
        case 'R':
          pseudo = generateRookMoves(board, { row: r, col: c }, piece);
          break;
        case 'C':
          pseudo = generateCannonMoves(board, { row: r, col: c }, piece);
          break;
        case 'P':
          pseudo = generatePawnMoves(board, { row: r, col: c }, piece);
          break;
      }
      if (pseudo.some((p) => p.row === kingPos.row && p.col === kingPos.col)) {
        return true;
      }
    }
  }
  return false;
}

export function checkGameEnd(
  board: Board,
  currentPlayer: PieceColor,
  noCaptureCount: number
): { status: 'playing' | 'checkmate' | 'stalemate' | 'draw'; winner: PieceColor | null } {
  if (noCaptureCount >= 60) {
    return { status: 'draw', winner: null };
  }
  const moves = generateAllMoves(board, currentPlayer);
  if (moves.length === 0) {
    const opponent: PieceColor = currentPlayer === 'red' ? 'black' : 'red';
    if (isInCheck(board, currentPlayer)) {
      return { status: 'checkmate', winner: opponent };
    }
    return { status: 'stalemate', winner: opponent };
  }
  return { status: 'playing', winner: null };
}

export function evaluateBoard(board: Board): number {
  let score = 0;
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const p = board[r][c];
      if (!p) continue;
      const val = PIECE_VALUES[p.type];
      const posBonus = getPositionBonus(p, r, c);
      score += p.color === 'black' ? val + posBonus : -(val + posBonus);
    }
  }
  return score;
}

function getPositionBonus(piece: Piece, r: number, c: number): number {
  const centerCol = 4;
  let bonus = 0;
  const colDist = Math.abs(c - centerCol);
  if (piece.type === 'P') {
    const crossed = piece.color === 'black' ? r >= 5 : r <= 4;
    if (crossed) bonus += 30;
    const advance = piece.color === 'black' ? r : 9 - r;
    bonus += advance * 5;
  }
  if (piece.type === 'H' || piece.type === 'C') {
    bonus += (4 - colDist) * 3;
  }
  return bonus;
}

export function easyAIMove(board: Board, color: PieceColor): Move | null {
  const allMoves = generateAllMoves(board, color);
  if (allMoves.length === 0) return null;
  const captures = allMoves.filter((m) => m.captured);
  if (captures.length > 0) {
    captures.sort(
      (a, b) =>
        PIECE_VALUES[b.captured!.type] - PIECE_VALUES[a.captured!.type]
    );
    return captures[0];
  }
  return allMoves[Math.floor(Math.random() * allMoves.length)];
}

function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
  color: PieceColor
): number {
  if (depth === 0) return evaluateBoard(board);

  const moves = generateAllMoves(board, color);
  if (moves.length === 0) {
    if (isInCheck(board, color)) {
      return maximizing ? -99999 : 99999;
    }
    return 0;
  }

  moves.sort((a, b) => {
    const aCap = a.captured ? PIECE_VALUES[a.captured.type] : 0;
    const bCap = b.captured ? PIECE_VALUES[b.captured.type] : 0;
    return bCap - aCap;
  });

  const nextColor: PieceColor = color === 'red' ? 'black' : 'red';

  if (maximizing) {
    let best = -Infinity;
    for (const move of moves) {
      applyMoveToBoard(board, move);
      best = Math.max(
        best,
        minimax(board, depth - 1, alpha, beta, false, nextColor)
      );
      undoMoveOnBoard(board, move);
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of moves) {
      applyMoveToBoard(board, move);
      best = Math.min(
        best,
        minimax(board, depth - 1, alpha, beta, true, nextColor)
      );
      undoMoveOnBoard(board, move);
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

export function mediumAIMove(board: Board, color: PieceColor): Move | null {
  const moves = generateAllMoves(board, color);
  if (moves.length === 0) return null;

  moves.sort((a, b) => {
    const aCap = a.captured ? PIECE_VALUES[a.captured.type] : 0;
    const bCap = b.captured ? PIECE_VALUES[b.captured.type] : 0;
    return bCap - aCap;
  });

  const maximizing = color === 'black';
  let bestMove: Move = moves[0];
  let bestScore = maximizing ? -Infinity : Infinity;
  const nextColor: PieceColor = color === 'red' ? 'black' : 'red';

  for (const move of moves) {
    applyMoveToBoard(board, move);
    const score = minimax(board, 2, -Infinity, Infinity, !maximizing, nextColor);
    undoMoveOnBoard(board, move);

    if (maximizing ? score > bestScore : score < bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

export function makeAIMove(
  board: Board,
  color: PieceColor,
  difficulty: Difficulty
): Move | null {
  const workingBoard = cloneBoard(board);
  if (difficulty === 'easy') {
    return easyAIMove(workingBoard, color);
  }
  return mediumAIMove(workingBoard, color);
}
