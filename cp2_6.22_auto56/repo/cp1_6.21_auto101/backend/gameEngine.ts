import { v4 as uuidv4 } from 'uuid';
import type {
  Piece,
  PieceType,
  PlayerColor,
  Position,
  Move,
  BoardState,
  BattleLogEntry,
} from '../src/types';

export const BOARD_SIZE = 8;

function posEqual(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col;
}

export function getPieceAt(pieces: Piece[], pos: Position): Piece | undefined {
  return pieces.find((p) => posEqual(p.position, pos));
}

export function isInBounds(pos: Position): boolean {
  return pos.row >= 0 && pos.row < BOARD_SIZE && pos.col >= 0 && pos.col < BOARD_SIZE;
}

function makePiece(type: PieceType, color: PlayerColor, row: number, col: number): Piece {
  return {
    id: uuidv4(),
    type,
    color,
    revealed: false,
    position: { row, col },
  };
}

export function createInitialBoard(): BoardState {
  const pieces: Piece[] = [];
  const backRow: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];

  for (let col = 0; col < BOARD_SIZE; col++) {
    pieces.push(makePiece(backRow[col], 'white', 0, col));
    pieces.push(makePiece('pawn', 'white', 1, col));
    pieces.push(makePiece('pawn', 'black', 6, col));
    pieces.push(makePiece(backRow[col], 'black', 7, col));
  }

  return {
    pieces,
    currentTurn: 'white',
    totalMoves: 0,
    winner: null,
    isGameOver: false,
  };
}

function getPawnMoves(piece: Piece, pieces: Piece[]): Position[] {
  const moves: Position[] = [];
  const direction = piece.color === 'white' ? 1 : -1;
  const startRow = piece.color === 'white' ? 1 : 6;
  const { row, col } = piece.position;

  const oneForward = { row: row + direction, col };
  if (isInBounds(oneForward) && !getPieceAt(pieces, oneForward)) {
    moves.push(oneForward);
    const twoForward = { row: row + 2 * direction, col };
    if (row === startRow && !getPieceAt(pieces, twoForward)) {
      moves.push(twoForward);
    }
  }

  for (const dc of [-1, 1]) {
    const capturePos = { row: row + direction, col: col + dc };
    if (!isInBounds(capturePos)) continue;
    const target = getPieceAt(pieces, capturePos);
    if (target && target.color !== piece.color) {
      moves.push(capturePos);
    }
  }

  return moves;
}

function getSlidingMoves(piece: Piece, pieces: Piece[], directions: Array<[number, number]>): Position[] {
  const moves: Position[] = [];
  const { row, col } = piece.position;

  for (const [dr, dc] of directions) {
    let r = row + dr;
    let c = col + dc;
    while (isInBounds({ row: r, col: c })) {
      const pos = { row: r, col: c };
      const target = getPieceAt(pieces, pos);
      if (!target) {
        moves.push(pos);
      } else {
        if (target.color !== piece.color) {
          moves.push(pos);
        }
        break;
      }
      r += dr;
      c += dc;
    }
  }

  return moves;
}

function getRookMoves(piece: Piece, pieces: Piece[]): Position[] {
  return getSlidingMoves(piece, pieces, [[1, 0], [-1, 0], [0, 1], [0, -1]]);
}

function getBishopMoves(piece: Piece, pieces: Piece[]): Position[] {
  return getSlidingMoves(piece, pieces, [[1, 1], [1, -1], [-1, 1], [-1, -1]]);
}

function getQueenMoves(piece: Piece, pieces: Piece[]): Position[] {
  return [...getRookMoves(piece, pieces), ...getBishopMoves(piece, pieces)];
}

function getKnightMoves(piece: Piece, pieces: Piece[]): Position[] {
  const moves: Position[] = [];
  const deltas: Array<[number, number]> = [
    [2, 1], [2, -1], [-2, 1], [-2, -1],
    [1, 2], [1, -2], [-1, 2], [-1, -2],
  ];
  const { row, col } = piece.position;

  for (const [dr, dc] of deltas) {
    const pos = { row: row + dr, col: col + dc };
    if (!isInBounds(pos)) continue;
    const target = getPieceAt(pieces, pos);
    if (!target || target.color !== piece.color) {
      moves.push(pos);
    }
  }

  return moves;
}

function getKingMoves(piece: Piece, pieces: Piece[]): Position[] {
  const moves: Position[] = [];
  const { row, col } = piece.position;

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const pos = { row: row + dr, col: col + dc };
      if (!isInBounds(pos)) continue;
      const target = getPieceAt(pieces, pos);
      if (!target || target.color !== piece.color) {
        moves.push(pos);
      }
    }
  }

  return moves;
}

export function getLegalMovesForPiece(piece: Piece, pieces: Piece[]): Position[] {
  switch (piece.type) {
    case 'pawn':   return getPawnMoves(piece, pieces);
    case 'rook':   return getRookMoves(piece, pieces);
    case 'knight': return getKnightMoves(piece, pieces);
    case 'bishop': return getBishopMoves(piece, pieces);
    case 'queen':  return getQueenMoves(piece, pieces);
    case 'king':   return getKingMoves(piece, pieces);
  }
}

export function hasAnyLegalMoves(color: PlayerColor, pieces: Piece[]): boolean {
  for (const p of pieces) {
    if (p.color !== color) continue;
    const moves = getLegalMovesForPiece(p, pieces);
    if (moves.length > 0) return true;
  }
  return false;
}

export function validateMove(
  board: BoardState,
  move: Move,
  playerColor: PlayerColor
): { valid: boolean; reason?: string } {
  if (board.isGameOver) {
    return { valid: false, reason: '游戏已结束' };
  }
  if (board.currentTurn !== playerColor) {
    return { valid: false, reason: `当前是${board.currentTurn === 'white' ? '白方' : '黑方'}回合` };
  }

  const piece = board.pieces.find((p) => p.id === move.pieceId);
  if (!piece) {
    return { valid: false, reason: '棋子不存在' };
  }
  if (piece.color !== playerColor) {
    return { valid: false, reason: '不能操作对方棋子' };
  }
  if (!posEqual(piece.position, move.from)) {
    return { valid: false, reason: '棋子起始位置不匹配' };
  }
  if (posEqual(move.from, move.to)) {
    return { valid: false, reason: '不能原地移动' };
  }
  if (!isInBounds(move.to)) {
    return { valid: false, reason: '目标位置越界' };
  }

  const legalMoves = getLegalMovesForPiece(piece, board.pieces);
  const isLegal = legalMoves.some((m) => posEqual(m, move.to));
  if (!isLegal) {
    return { valid: false, reason: '走法不符合规则' };
  }

  return { valid: true };
}

function promotePawnIfNeeded(piece: Piece): Piece {
  if (piece.type !== 'pawn') return piece;
  const endRow = piece.color === 'white' ? 7 : 0;
  if (piece.position.row === endRow) {
    return { ...piece, type: 'queen' };
  }
  return piece;
}

export function applyMove(
  board: BoardState,
  move: Move
): { board: BoardState; capturedPiece?: Piece; battleEntry: BattleLogEntry } {
  let pieces = [...board.pieces];
  const pieceIndex = pieces.findIndex((p) => p.id === move.pieceId);
  if (pieceIndex === -1) {
    throw new Error('piece not found');
  }

  let movingPiece = { ...pieces[pieceIndex] };
  movingPiece.position = { ...move.to };
  movingPiece.revealed = true;
  movingPiece = promotePawnIfNeeded(movingPiece);

  let capturedPiece: Piece | undefined;
  const targetIndex = pieces.findIndex(
    (p) => posEqual(p.position, move.to) && p.id !== move.pieceId
  );
  if (targetIndex !== -1) {
    capturedPiece = { ...pieces[targetIndex], revealed: true };
    pieces = pieces.filter((_, i) => i !== targetIndex);
  }

  const updatedIdx = pieces.findIndex((p) => p.id === move.pieceId);
  if (updatedIdx !== -1) {
    pieces[updatedIdx] = movingPiece;
  } else {
    pieces.push(movingPiece);
  }

  const nextTurn: PlayerColor = board.currentTurn === 'white' ? 'black' : 'white';
  const nextMoveNum = board.totalMoves + 1;

  let winner: PlayerColor | null = null;
  let isGameOver = false;

  if (capturedPiece?.type === 'king') {
    winner = board.currentTurn;
    isGameOver = true;
  } else if (!hasAnyLegalMoves(nextTurn, pieces)) {
    winner = board.currentTurn;
    isGameOver = true;
  }

  const newBoard: BoardState = {
    pieces,
    currentTurn: nextTurn,
    totalMoves: nextMoveNum,
    winner,
    isGameOver,
  };

  const moveNotation = posToNotation(move.from) + '-' + posToNotation(move.to);
  let message = `${playerColorToName(board.currentTurn)}走 ${moveNotation}`;
  if (capturedPiece) {
    message += ` 吃掉${playerColorToName(capturedPiece.color)}${pieceTypeToName(capturedPiece.type)}`;
  }
  if (isGameOver && winner) {
    message += ` | ${playerColorToName(winner)}胜利！`;
  }

  const battleEntry: BattleLogEntry = {
    timestamp: Date.now(),
    turn: Math.ceil(nextMoveNum / 2),
    player: board.currentTurn,
    move: { ...move, capturedPieceId: capturedPiece?.id },
    capturedPiece,
    message,
  };

  return { board: newBoard, capturedPiece, battleEntry };
}

function posToNotation(pos: Position): string {
  const files = 'abcdefgh';
  const ranks = '12345678';
  return files[pos.col] + ranks[pos.row];
}

function playerColorToName(c: PlayerColor): string {
  return c === 'white' ? '白方' : '黑方';
}

function pieceTypeToName(t: PieceType): string {
  const map: Record<PieceType, string> = {
    pawn: '兵', rook: '车', knight: '马', bishop: '象', queen: '后', king: '王',
  };
  return map[t];
}
