export type PlayerColor = 'black' | 'white';
export type CellState = PlayerColor | null;
export type Board = CellState[][];

export const BOARD_SIZE = 8;

const DIRECTIONS: [number, number][] = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],          [0, 1],
  [1, -1],  [1, 0], [1, 1],
];

export function createInitialBoard(): Board {
  const board: Board = Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(null));

  const mid = BOARD_SIZE / 2;
  board[mid - 1][mid - 1] = 'white';
  board[mid - 1][mid] = 'black';
  board[mid][mid - 1] = 'black';
  board[mid][mid] = 'white';

  return board;
}

export function cloneBoard(board: Board): Board {
  return board.map(row => [...row]);
}

export function getOpponent(player: PlayerColor): PlayerColor {
  return player === 'black' ? 'white' : 'black';
}

function isInBounds(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

function getFlipsInDirection(
  board: Board,
  row: number,
  col: number,
  player: PlayerColor,
  dRow: number,
  dCol: number
): [number, number][] {
  const opponent = getOpponent(player);
  const flips: [number, number][] = [];
  let r = row + dRow;
  let c = col + dCol;

  while (isInBounds(r, c) && board[r][c] === opponent) {
    flips.push([r, c]);
    r += dRow;
    c += dCol;
  }

  if (flips.length > 0 && isInBounds(r, c) && board[r][c] === player) {
    return flips;
  }

  return [];
}

export function getFlips(
  board: Board,
  row: number,
  col: number,
  player: PlayerColor
): [number, number][] {
  if (board[row][col] !== null) {
    return [];
  }

  const allFlips: [number, number][] = [];

  for (const [dRow, dCol] of DIRECTIONS) {
    const flips = getFlipsInDirection(board, row, col, player, dRow, dCol);
    allFlips.push(...flips);
  }

  return allFlips;
}

export function isValidMove(
  board: Board,
  row: number,
  col: number,
  player: PlayerColor
): boolean {
  if (board[row][col] !== null) {
    return false;
  }
  return getFlips(board, row, col, player).length > 0;
}

export function getValidMoves(board: Board, player: PlayerColor): [number, number][] {
  const moves: [number, number][] = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (isValidMove(board, row, col, player)) {
        moves.push([row, col]);
      }
    }
  }

  return moves;
}

export function hasValidMoves(board: Board, player: PlayerColor): boolean {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (isValidMove(board, row, col, player)) {
        return true;
      }
    }
  }
  return false;
}

export function makeMove(
  board: Board,
  row: number,
  col: number,
  player: PlayerColor
): { newBoard: Board; flipped: [number, number][] } {
  const flips = getFlips(board, row, col, player);
  if (flips.length === 0) {
    return { newBoard: board, flipped: [] };
  }

  const newBoard = cloneBoard(board);
  newBoard[row][col] = player;

  for (const [r, c] of flips) {
    newBoard[r][c] = player;
  }

  return { newBoard, flipped: flips };
}

export function countPieces(board: Board): { black: number; white: number } {
  let black = 0;
  let white = 0;

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col] === 'black') {
        black++;
      } else if (board[row][col] === 'white') {
        white++;
      }
    }
  }

  return { black, white };
}

export function isGameOver(board: Board): boolean {
  return !hasValidMoves(board, 'black') && !hasValidMoves(board, 'white');
}

export function getWinner(board: Board): PlayerColor | 'draw' | null {
  if (!isGameOver(board)) {
    return null;
  }
  const { black, white } = countPieces(board);
  if (black > white) return 'black';
  if (white > black) return 'white';
  return 'draw';
}
