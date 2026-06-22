export type PieceType = 'king' | 'advisor' | 'elephant' | 'horse' | 'rook' | 'cannon' | 'pawn';
export type PieceColor = 'red' | 'black';

export interface Position {
  row: number;
  col: number;
}

export interface Piece {
  type: PieceType;
  color: PieceColor;
  row: number;
  col: number;
  id: string;
}

export interface Puzzle {
  id: string;
  name: string;
  difficulty: 'beginner' | 'intermediate' | 'master';
  pieces: Omit<Piece, 'id'>[];
  description: string;
}

export interface Move {
  from: Position;
  to: Position;
  pieceType: PieceType;
  pieceColor: PieceColor;
  captured?: PieceType;
  timestamp: number;
  timeSpent: number;
}

export interface MoveResult {
  valid: boolean;
  captured?: Piece;
  inCheck?: boolean;
  checkmate?: boolean;
}

interface EvalResult {
  score: number;
  bestMove: { from: Position; to: Position } | null;
}

const PIECE_VALUES: Record<PieceType, number> = {
  king: 10000,
  rook: 900,
  cannon: 450,
  horse: 400,
  advisor: 200,
  elephant: 200,
  pawn: 80
};

const RED_PAWN_ADVANCED_VALUE = 150;
const BLACK_PAWN_ADVANCED_VALUE = 150;

const PIECE_NAMES: Record<PieceType, { red: string; black: string }> = {
  king: { red: '帅', black: '将' },
  advisor: { red: '仕', black: '士' },
  elephant: { red: '相', black: '象' },
  horse: { red: '马', black: '马' },
  rook: { red: '车', black: '车' },
  cannon: { red: '炮', black: '炮' },
  pawn: { red: '兵', black: '卒' }
};

export function getPieceName(type: PieceType, color: PieceColor): string {
  return PIECE_NAMES[type][color];
}

const POSITION_WEIGHT: Record<PieceType, number[][]> = {
  king: Array.from({ length: 10 }, () => Array(9).fill(0)),
  advisor: Array.from({ length: 10 }, () => Array(9).fill(0)),
  elephant: Array.from({ length: 10 }, () => Array(9).fill(0)),
  horse: [
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,2,2,2,0,0,0],
    [2,0,2,4,4,4,2,0,2],
    [2,2,4,6,6,6,4,2,2],
    [2,2,4,6,6,6,4,2,2],
    [2,2,4,6,6,6,4,2,2],
    [2,2,4,6,6,6,4,2,2],
    [2,0,2,4,4,4,2,0,2],
    [0,0,0,2,2,2,0,0,0],
    [0,0,0,0,0,0,0,0,0]
  ],
  rook: [
    [6,8,6,8,8,8,6,8,6],
    [6,8,8,10,12,10,8,8,6],
    [4,6,8,10,10,10,8,6,4],
    [4,6,8,10,10,10,8,6,4],
    [4,6,8,10,10,10,8,6,4],
    [4,6,8,10,10,10,8,6,4],
    [4,6,8,10,10,10,8,6,4],
    [4,6,8,10,10,10,8,6,4],
    [6,8,8,10,12,10,8,8,6],
    [6,8,6,8,8,8,6,8,6]
  ],
  cannon: [
    [0,0,2,4,4,4,2,0,0],
    [0,2,4,4,6,4,4,2,0],
    [2,2,2,4,6,4,2,2,2],
    [0,0,0,2,4,2,0,0,0],
    [0,0,0,2,4,2,0,0,0],
    [0,0,0,2,4,2,0,0,0],
    [0,0,0,2,4,2,0,0,0],
    [2,2,2,4,6,4,2,2,2],
    [0,2,4,4,6,4,4,2,0],
    [0,0,2,4,4,4,2,0,0]
  ],
  pawn: [
    [0,0,0,2,4,2,0,0,0],
    [0,0,2,4,6,4,2,0,0],
    [0,2,4,6,8,6,4,2,0],
    [0,0,2,6,8,6,2,0,0],
    [0,0,0,4,6,4,0,0,0],
    [0,0,0,4,6,4,0,0,0],
    [0,0,2,6,8,6,2,0,0],
    [0,2,4,6,8,6,4,2,0],
    [0,0,2,4,6,4,2,0,0],
    [0,0,0,2,4,2,0,0,0]
  ]
};

const PUZZLES: Puzzle[] = [
  {
    id: 'da-dao-wan-xin',
    name: '大刀剜心',
    difficulty: 'beginner',
    description: '红方车攻入九宫，直取黑将',
    pieces: [
      { type: 'king', color: 'red', row: 9, col: 4 },
      { type: 'rook', color: 'red', row: 3, col: 0 },
      { type: 'king', color: 'black', row: 0, col: 4 },
      { type: 'advisor', color: 'black', row: 0, col: 3 },
      { type: 'advisor', color: 'black', row: 1, col: 4 }
    ]
  },
  {
    id: 'wo-cao-ma',
    name: '卧槽马',
    difficulty: 'beginner',
    description: '马入卧槽，车绝杀',
    pieces: [
      { type: 'king', color: 'red', row: 9, col: 4 },
      { type: 'horse', color: 'red', row: 7, col: 1 },
      { type: 'rook', color: 'red', row: 0, col: 0 },
      { type: 'king', color: 'black', row: 0, col: 4 },
      { type: 'advisor', color: 'black', row: 0, col: 5 }
    ]
  },
  {
    id: 'tie-men-shuan',
    name: '铁门闩',
    difficulty: 'beginner',
    description: '车炮同线封锁，铁壁合围',
    pieces: [
      { type: 'king', color: 'red', row: 9, col: 4 },
      { type: 'rook', color: 'red', row: 2, col: 3 },
      { type: 'cannon', color: 'red', row: 5, col: 3 },
      { type: 'king', color: 'black', row: 0, col: 4 },
      { type: 'advisor', color: 'black', row: 0, col: 3 }
    ]
  },
  {
    id: 'ma-hou-pao',
    name: '马后炮',
    difficulty: 'beginner',
    description: '马做炮架，炮击黑将',
    pieces: [
      { type: 'king', color: 'red', row: 9, col: 4 },
      { type: 'horse', color: 'red', row: 2, col: 3 },
      { type: 'cannon', color: 'red', row: 4, col: 3 },
      { type: 'king', color: 'black', row: 0, col: 3 },
      { type: 'advisor', color: 'black', row: 0, col: 5 }
    ]
  },
  {
    id: 'chong-pao',
    name: '重炮',
    difficulty: 'beginner',
    description: '双炮重叠，绝杀无解',
    pieces: [
      { type: 'king', color: 'red', row: 9, col: 4 },
      { type: 'cannon', color: 'red', row: 4, col: 4 },
      { type: 'cannon', color: 'red', row: 5, col: 4 },
      { type: 'king', color: 'black', row: 0, col: 4 },
      { type: 'advisor', color: 'black', row: 0, col: 3 },
      { type: 'advisor', color: 'black', row: 1, col: 5 }
    ]
  },
  {
    id: 'shuang-che-cuo',
    name: '双车错',
    difficulty: 'intermediate',
    description: '双车交错进攻，势如破竹',
    pieces: [
      { type: 'king', color: 'red', row: 9, col: 4 },
      { type: 'rook', color: 'red', row: 1, col: 0 },
      { type: 'rook', color: 'red', row: 0, col: 8 },
      { type: 'king', color: 'black', row: 0, col: 4 },
      { type: 'advisor', color: 'black', row: 0, col: 3 },
      { type: 'advisor', color: 'black', row: 0, col: 5 },
      { type: 'elephant', color: 'black', row: 0, col: 2 }
    ]
  },
  {
    id: 'diao-yu-ma',
    name: '钓鱼马',
    difficulty: 'intermediate',
    description: '马钓金钩，巧擒黑将',
    pieces: [
      { type: 'king', color: 'red', row: 9, col: 4 },
      { type: 'horse', color: 'red', row: 7, col: 4 },
      { type: 'rook', color: 'red', row: 0, col: 0 },
      { type: 'king', color: 'black', row: 0, col: 4 },
      { type: 'advisor', color: 'black', row: 0, col: 3 },
      { type: 'advisor', color: 'black', row: 1, col: 4 }
    ]
  },
  {
    id: 'hai-di-lao-yue',
    name: '海底捞月',
    difficulty: 'intermediate',
    description: '车炮沉底，捞月擒王',
    pieces: [
      { type: 'king', color: 'red', row: 9, col: 4 },
      { type: 'rook', color: 'red', row: 2, col: 0 },
      { type: 'cannon', color: 'red', row: 5, col: 4 },
      { type: 'king', color: 'black', row: 0, col: 4 },
      { type: 'rook', color: 'black', row: 3, col: 4 }
    ]
  },
  {
    id: 'men-sha',
    name: '闷杀',
    difficulty: 'intermediate',
    description: '困将于宫，闷杀取局',
    pieces: [
      { type: 'king', color: 'red', row: 9, col: 4 },
      { type: 'horse', color: 'red', row: 2, col: 5 },
      { type: 'rook', color: 'red', row: 0, col: 0 },
      { type: 'king', color: 'black', row: 0, col: 3 },
      { type: 'advisor', color: 'black', row: 1, col: 4 },
      { type: 'elephant', color: 'black', row: 0, col: 2 },
      { type: 'elephant', color: 'black', row: 0, col: 6 }
    ]
  },
  {
    id: 'bai-lian-jiang',
    name: '白脸将',
    difficulty: 'intermediate',
    description: '将帅对面，巧用规则',
    pieces: [
      { type: 'king', color: 'red', row: 9, col: 4 },
      { type: 'rook', color: 'red', row: 5, col: 0 },
      { type: 'pawn', color: 'red', row: 4, col: 4 },
      { type: 'king', color: 'black', row: 0, col: 4 },
      { type: 'advisor', color: 'black', row: 0, col: 3 },
      { type: 'advisor', color: 'black', row: 1, col: 5 }
    ]
  },
  {
    id: 'shuang-jiang',
    name: '双将',
    difficulty: 'master',
    description: '双将齐出，无可回避',
    pieces: [
      { type: 'king', color: 'red', row: 9, col: 4 },
      { type: 'rook', color: 'red', row: 0, col: 0 },
      { type: 'cannon', color: 'red', row: 4, col: 4 },
      { type: 'horse', color: 'red', row: 2, col: 3 },
      { type: 'king', color: 'black', row: 0, col: 4 },
      { type: 'advisor', color: 'black', row: 0, col: 3 },
      { type: 'advisor', color: 'black', row: 0, col: 5 },
      { type: 'elephant', color: 'black', row: 2, col: 2 }
    ]
  },
  {
    id: 'che-ma-leng-zhao',
    name: '车马冷着',
    difficulty: 'master',
    description: '车马冷招，暗藏杀机',
    pieces: [
      { type: 'king', color: 'red', row: 9, col: 4 },
      { type: 'rook', color: 'red', row: 2, col: 8 },
      { type: 'horse', color: 'red', row: 5, col: 3 },
      { type: 'king', color: 'black', row: 0, col: 4 },
      { type: 'rook', color: 'black', row: 0, col: 0 },
      { type: 'advisor', color: 'black', row: 0, col: 3 },
      { type: 'advisor', color: 'black', row: 1, col: 5 }
    ]
  },
  {
    id: 'xiao-dao-wan-xin',
    name: '小刀剜心',
    difficulty: 'master',
    description: '兵入九宫，剜心取将',
    pieces: [
      { type: 'king', color: 'red', row: 9, col: 4 },
      { type: 'rook', color: 'red', row: 3, col: 4 },
      { type: 'pawn', color: 'red', row: 1, col: 4 },
      { type: 'king', color: 'black', row: 0, col: 3 },
      { type: 'advisor', color: 'black', row: 1, col: 4 },
      { type: 'advisor', color: 'black', row: 0, col: 5 },
      { type: 'elephant', color: 'black', row: 2, col: 2 }
    ]
  },
  {
    id: 'ba-huang-ma',
    name: '拔簧马',
    difficulty: 'master',
    description: '马拔簧动，出奇制胜',
    pieces: [
      { type: 'king', color: 'red', row: 9, col: 4 },
      { type: 'horse', color: 'red', row: 1, col: 2 },
      { type: 'cannon', color: 'red', row: 3, col: 5 },
      { type: 'rook', color: 'red', row: 0, col: 8 },
      { type: 'king', color: 'black', row: 0, col: 4 },
      { type: 'advisor', color: 'black', row: 0, col: 3 },
      { type: 'advisor', color: 'black', row: 1, col: 4 },
      { type: 'rook', color: 'black', row: 0, col: 0 }
    ]
  },
  {
    id: 'san-che-nao-shi',
    name: '三车闹士',
    difficulty: 'master',
    description: '三路合围，闹士擒王',
    pieces: [
      { type: 'king', color: 'red', row: 9, col: 4 },
      { type: 'rook', color: 'red', row: 1, col: 0 },
      { type: 'rook', color: 'red', row: 2, col: 8 },
      { type: 'cannon', color: 'red', row: 5, col: 4 },
      { type: 'king', color: 'black', row: 0, col: 4 },
      { type: 'advisor', color: 'black', row: 0, col: 3 },
      { type: 'advisor', color: 'black', row: 0, col: 5 },
      { type: 'elephant', color: 'black', row: 2, col: 2 },
      { type: 'elephant', color: 'black', row: 2, col: 6 }
    ]
  }
];

let board: (Piece | null)[][] = [];
let currentPuzzle: Puzzle | null = null;
let pieceIdCounter = 0;

function createPiece(p: Omit<Piece, 'id'>): Piece {
  return { ...p, id: `p${pieceIdCounter++}` };
}

export function getPuzzles(): Puzzle[] {
  return PUZZLES;
}

export function loadPuzzle(puzzleId: string): Piece[] {
  const puzzle = PUZZLES.find(p => p.id === puzzleId);
  if (!puzzle) return [];

  currentPuzzle = puzzle;
  pieceIdCounter = 0;
  board = Array.from({ length: 10 }, () => Array(9).fill(null));

  const pieces: Piece[] = [];
  for (const p of puzzle.pieces) {
    const piece = createPiece(p);
    board[piece.row][piece.col] = piece;
    pieces.push(piece);
  }

  return pieces;
}

export function getCurrentPuzzle(): Puzzle | null {
  return currentPuzzle;
}

export function getBoard(): (Piece | null)[][] {
  return board;
}

export function setBoard(newBoard: (Piece | null)[][]): void {
  board = newBoard;
}

export function getPieceAt(row: number, col: number): Piece | null {
  if (row < 0 || row > 9 || col < 0 || col > 8) return null;
  return board[row][col];
}

function isInsideBoard(row: number, col: number): boolean {
  return row >= 0 && row <= 9 && col >= 0 && col <= 8;
}

function isInPalace(row: number, col: number, color: PieceColor): boolean {
  if (col < 3 || col > 5) return false;
  if (color === 'black') return row >= 0 && row <= 2;
  return row >= 7 && row <= 9;
}

function hasCrossedRiver(row: number, color: PieceColor): boolean {
  if (color === 'red') return row <= 4;
  return row >= 5;
}

function countPiecesBetween(r1: number, c1: number, r2: number, c2: number): number {
  let count = 0;
  if (r1 === r2) {
    const minC = Math.min(c1, c2);
    const maxC = Math.max(c1, c2);
    for (let c = minC + 1; c < maxC; c++) {
      if (board[r1][c]) count++;
    }
  } else if (c1 === c2) {
    const minR = Math.min(r1, r2);
    const maxR = Math.max(r1, r2);
    for (let r = minR + 1; r < maxR; r++) {
      if (board[r][c1]) count++;
    }
  }
  return count;
}

export function getValidMoves(row: number, col: number): Position[] {
  const piece = board[row][col];
  if (!piece) return [];

  const moves: Position[] = [];
  const { type, color } = piece;

  switch (type) {
    case 'king': {
      const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
      for (const [dr, dc] of dirs) {
        const nr = row + dr;
        const nc = col + dc;
        if (isInsideBoard(nr, nc) && isInPalace(nr, nc, color)) {
          const target = board[nr][nc];
          if (!target || target.color !== color) {
            moves.push({ row: nr, col: nc });
          }
        }
      }
      const otherKingRow = findKingRow(color === 'red' ? 'black' : 'red');
      if (otherKingRow !== -1 && col === findKingCol(color === 'red' ? 'black' : 'red')) {
        if (countPiecesBetween(row, col, otherKingRow, col) === 0) {
          moves.push({ row: otherKingRow, col });
        }
      }
      break;
    }
    case 'advisor': {
      const dirs = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
      for (const [dr, dc] of dirs) {
        const nr = row + dr;
        const nc = col + dc;
        if (isInsideBoard(nr, nc) && isInPalace(nr, nc, color)) {
          const target = board[nr][nc];
          if (!target || target.color !== color) {
            moves.push({ row: nr, col: nc });
          }
        }
      }
      break;
    }
    case 'elephant': {
      const dirs = [[2, 2], [2, -2], [-2, 2], [-2, -2]];
      const blocks = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
      for (let i = 0; i < dirs.length; i++) {
        const nr = row + dirs[i][0];
        const nc = col + dirs[i][1];
        const br = row + blocks[i][0];
        const bc = col + blocks[i][1];
        if (isInsideBoard(nr, nc)) {
          const onOwnSide = color === 'red' ? nr >= 5 : nr <= 4;
          if (onOwnSide && !board[br][bc]) {
            const target = board[nr][nc];
            if (!target || target.color !== color) {
              moves.push({ row: nr, col: nc });
            }
          }
        }
      }
      break;
    }
    case 'horse': {
      const jumps = [
        { dr: -2, dc: -1, br: -1, bc: 0 },
        { dr: -2, dc: 1, br: -1, bc: 0 },
        { dr: 2, dc: -1, br: 1, bc: 0 },
        { dr: 2, dc: 1, br: 1, bc: 0 },
        { dr: -1, dc: -2, br: 0, bc: -1 },
        { dr: -1, dc: 2, br: 0, bc: 1 },
        { dr: 1, dc: -2, br: 0, bc: -1 },
        { dr: 1, dc: 2, br: 0, bc: 1 }
      ];
      for (const j of jumps) {
        const nr = row + j.dr;
        const nc = col + j.dc;
        const blockR = row + j.br;
        const blockC = col + j.bc;
        if (isInsideBoard(nr, nc) && isInsideBoard(blockR, blockC)) {
          if (!board[blockR][blockC]) {
            const target = board[nr][nc];
            if (!target || target.color !== color) {
              moves.push({ row: nr, col: nc });
            }
          }
        }
      }
      break;
    }
    case 'rook': {
      const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
      for (const [dr, dc] of dirs) {
        let nr = row + dr;
        let nc = col + dc;
        while (isInsideBoard(nr, nc)) {
          const target = board[nr][nc];
          if (target) {
            if (target.color !== color) moves.push({ row: nr, col: nc });
            break;
          }
          moves.push({ row: nr, col: nc });
          nr += dr;
          nc += dc;
        }
      }
      break;
    }
    case 'cannon': {
      const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
      for (const [dr, dc] of dirs) {
        let nr = row + dr;
        let nc = col + dc;
        let jumped = false;
        while (isInsideBoard(nr, nc)) {
          const target = board[nr][nc];
          if (!jumped) {
            if (target) {
              jumped = true;
            } else {
              moves.push({ row: nr, col: nc });
            }
          } else {
            if (target) {
              if (target.color !== color) moves.push({ row: nr, col: nc });
              break;
            }
          }
          nr += dr;
          nc += dc;
        }
      }
      break;
    }
    case 'pawn': {
      const forward = color === 'red' ? -1 : 1;
      const crossed = hasCrossedRiver(row, color);
      const candidates: Position[] = [{ row: row + forward, col }];
      if (crossed) {
        candidates.push({ row, col: col - 1 });
        candidates.push({ row, col: col + 1 });
      }
      for (const pos of candidates) {
        if (isInsideBoard(pos.row, pos.col)) {
          const target = board[pos.row][pos.col];
          if (!target || target.color !== color) {
            moves.push(pos);
          }
        }
      }
      break;
    }
  }

  return moves.filter(m => !wouldBeInCheck(row, col, m.row, m.col, color));
}

function findKingRow(color: PieceColor): number {
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r][c];
      if (p && p.type === 'king' && p.color === color) return r;
    }
  }
  return -1;
}

function findKingCol(color: PieceColor): number {
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r][c];
      if (p && p.type === 'king' && p.color === color) return c;
    }
  }
  return -1;
}

function findKing(color: PieceColor): Position | null {
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r][c];
      if (p && p.type === 'king' && p.color === color) return { row: r, col: c };
    }
  }
  return null;
}

function isUnderAttack(row: number, col: number, byColor: PieceColor): boolean {
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r][c];
      if (!p || p.color !== byColor) continue;
      const rawMoves = getRawMoves(r, c);
      if (rawMoves.some(m => m.row === row && m.col === col)) return true;
    }
  }
  return false;
}

function getRawMoves(row: number, col: number): Position[] {
  const piece = board[row][col];
  if (!piece) return [];

  const moves: Position[] = [];
  const { type, color } = piece;

  switch (type) {
    case 'king': {
      const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
      for (const [dr, dc] of dirs) {
        const nr = row + dr;
        const nc = col + dc;
        if (isInsideBoard(nr, nc) && isInPalace(nr, nc, color)) {
          const target = board[nr][nc];
          if (!target || target.color !== color) moves.push({ row: nr, col: nc });
        }
      }
      const oppColor = color === 'red' ? 'black' : 'red';
      const oppKing = findKing(oppColor);
      if (oppKing && col === oppKing.col && countPiecesBetween(row, col, oppKing.row, oppKing.col) === 0) {
        moves.push(oppKing);
      }
      break;
    }
    case 'advisor': {
      const dirs = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
      for (const [dr, dc] of dirs) {
        const nr = row + dr;
        const nc = col + dc;
        if (isInsideBoard(nr, nc) && isInPalace(nr, nc, color)) {
          const target = board[nr][nc];
          if (!target || target.color !== color) moves.push({ row: nr, col: nc });
        }
      }
      break;
    }
    case 'elephant': {
      const dirs = [[2, 2], [2, -2], [-2, 2], [-2, -2]];
      const blocks = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
      for (let i = 0; i < dirs.length; i++) {
        const nr = row + dirs[i][0];
        const nc = col + dirs[i][1];
        const br = row + blocks[i][0];
        const bc = col + blocks[i][1];
        if (isInsideBoard(nr, nc)) {
          const onOwnSide = color === 'red' ? nr >= 5 : nr <= 4;
          if (onOwnSide && !board[br][bc]) {
            const target = board[nr][nc];
            if (!target || target.color !== color) moves.push({ row: nr, col: nc });
          }
        }
      }
      break;
    }
    case 'horse': {
      const jumps = [
        { dr: -2, dc: -1, br: -1, bc: 0 },
        { dr: -2, dc: 1, br: -1, bc: 0 },
        { dr: 2, dc: -1, br: 1, bc: 0 },
        { dr: 2, dc: 1, br: 1, bc: 0 },
        { dr: -1, dc: -2, br: 0, bc: -1 },
        { dr: -1, dc: 2, br: 0, bc: 1 },
        { dr: 1, dc: -2, br: 0, bc: -1 },
        { dr: 1, dc: 2, br: 0, bc: 1 }
      ];
      for (const j of jumps) {
        const nr = row + j.dr;
        const nc = col + j.dc;
        const blockR = row + j.br;
        const blockC = col + j.bc;
        if (isInsideBoard(nr, nc) && isInsideBoard(blockR, blockC)) {
          if (!board[blockR][blockC]) {
            const target = board[nr][nc];
            if (!target || target.color !== color) moves.push({ row: nr, col: nc });
          }
        }
      }
      break;
    }
    case 'rook': {
      const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
      for (const [dr, dc] of dirs) {
        let nr = row + dr;
        let nc = col + dc;
        while (isInsideBoard(nr, nc)) {
          const target = board[nr][nc];
          if (target) {
            if (target.color !== color) moves.push({ row: nr, col: nc });
            break;
          }
          moves.push({ row: nr, col: nc });
          nr += dr;
          nc += dc;
        }
      }
      break;
    }
    case 'cannon': {
      const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
      for (const [dr, dc] of dirs) {
        let nr = row + dr;
        let nc = col + dc;
        let jumped = false;
        while (isInsideBoard(nr, nc)) {
          const target = board[nr][nc];
          if (!jumped) {
            if (target) jumped = true;
            else moves.push({ row: nr, col: nc });
          } else {
            if (target) {
              if (target.color !== color) moves.push({ row: nr, col: nc });
              break;
            }
          }
          nr += dr;
          nc += dc;
        }
      }
      break;
    }
    case 'pawn': {
      const forward = color === 'red' ? -1 : 1;
      const crossed = hasCrossedRiver(row, color);
      const candidates: Position[] = [{ row: row + forward, col }];
      if (crossed) {
        candidates.push({ row, col: col - 1 });
        candidates.push({ row, col: col + 1 });
      }
      for (const pos of candidates) {
        if (isInsideBoard(pos.row, pos.col)) {
          const target = board[pos.row][pos.col];
          if (!target || target.color !== color) moves.push(pos);
        }
      }
      break;
    }
  }

  return moves;
}

function wouldBeInCheck(fromRow: number, fromCol: number, toRow: number, toCol: number, color: PieceColor): boolean {
  const piece = board[fromRow][fromCol];
  const captured = board[toRow][toCol];

  board[fromRow][fromCol] = null;
  board[toRow][toCol] = piece;

  const kingPos = findKing(color);
  if (!kingPos) {
    board[fromRow][fromCol] = piece;
    board[toRow][toCol] = captured;
    return true;
  }

  const oppColor = color === 'red' ? 'black' : 'red';
  const inCheck = isUnderAttack(kingPos.row, kingPos.col, oppColor);

  board[fromRow][fromCol] = piece;
  board[toRow][toCol] = captured;

  return inCheck;
}

export function isInCheck(color: PieceColor): boolean {
  const kingPos = findKing(color);
  if (!kingPos) return false;
  const oppColor = color === 'red' ? 'black' : 'red';
  return isUnderAttack(kingPos.row, kingPos.col, oppColor);
}

export function isCheckmate(color: PieceColor): boolean {
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r][c];
      if (p && p.color === color) {
        const moves = getValidMoves(r, c);
        if (moves.length > 0) return false;
      }
    }
  }
  return true;
}

export function validateMove(fromRow: number, fromCol: number, toRow: number, toCol: number): MoveResult {
  const piece = board[fromRow][fromCol];
  if (!piece) return { valid: false };

  const validMoves = getValidMoves(fromRow, fromCol);
  const isValid = validMoves.some(m => m.row === toRow && m.col === toCol);
  if (!isValid) return { valid: false };

  const captured = board[toRow][toCol];
  board[fromRow][fromCol] = null;
  board[toRow][toCol] = piece;
  piece.row = toRow;
  piece.col = toCol;

  const oppColor = piece.color === 'red' ? 'black' : 'red';
  const inCheck = isInCheck(oppColor);
  const checkmate = inCheck && isCheckmate(oppColor);

  return {
    valid: true,
    captured: captured || undefined,
    inCheck,
    checkmate
  };
}

export function undoMoveOnBoard(fromRow: number, fromCol: number, toRow: number, toCol: number, captured: Piece | null): void {
  const piece = board[toRow][toCol];
  if (!piece) return;
  board[toRow][toCol] = captured;
  board[fromRow][fromCol] = piece;
  piece.row = fromRow;
  piece.col = fromCol;
}

function evaluateBoard(): number {
  let score = 0;
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r][c];
      if (!p) continue;

      let value = PIECE_VALUES[p.type];

      if (p.type === 'pawn') {
        if (hasCrossedRiver(r, p.color)) {
          value += p.color === 'red' ? RED_PAWN_ADVANCED_VALUE : BLACK_PAWN_ADVANCED_VALUE;
        }
      }

      const posWeight = POSITION_WEIGHT[p.type]?.[r]?.[c] ?? 0;
      value += posWeight;

      if (p.color === 'red') {
        score += value;
      } else {
        score -= value;
      }
    }
  }
  return score;
}

function minimax(depth: number, alpha: number, beta: number, isMaximizing: boolean): EvalResult {
  if (depth === 0) {
    return { score: evaluateBoard(), bestMove: null };
  }

  const color: PieceColor = isMaximizing ? 'red' : 'black';
  let bestMove: { from: Position; to: Position } | null = null;

  if (isMaximizing) {
    let maxScore = -Infinity;
    const allMoves = getAllMoves(color);
    for (const move of allMoves) {
      const captured = board[move.to.row][move.to.col];
      const piece = board[move.from.row][move.from.col]!;

      board[move.from.row][move.from.col] = null;
      board[move.to.row][move.to.col] = piece;
      const origRow = piece.row;
      const origCol = piece.col;
      piece.row = move.to.row;
      piece.col = move.to.col;

      const result = minimax(depth - 1, alpha, beta, false);

      piece.row = origRow;
      piece.col = origCol;
      board[move.from.row][move.from.col] = piece;
      board[move.to.row][move.to.col] = captured;

      if (result.score > maxScore) {
        maxScore = result.score;
        bestMove = move;
      }
      alpha = Math.max(alpha, result.score);
      if (beta <= alpha) break;
    }
    return { score: maxScore, bestMove };
  } else {
    let minScore = Infinity;
    const allMoves = getAllMoves(color);
    for (const move of allMoves) {
      const captured = board[move.to.row][move.to.col];
      const piece = board[move.from.row][move.from.col]!;

      board[move.from.row][move.from.col] = null;
      board[move.to.row][move.to.col] = piece;
      const origRow = piece.row;
      const origCol = piece.col;
      piece.row = move.to.row;
      piece.col = move.to.col;

      const result = minimax(depth - 1, alpha, beta, true);

      piece.row = origRow;
      piece.col = origCol;
      board[move.from.row][move.from.col] = piece;
      board[move.to.row][move.to.col] = captured;

      if (result.score < minScore) {
        minScore = result.score;
        bestMove = move;
      }
      beta = Math.min(beta, result.score);
      if (beta <= alpha) break;
    }
    return { score: minScore, bestMove };
  }
}

function getAllMoves(color: PieceColor): { from: Position; to: Position }[] {
  const moves: { from: Position; to: Position }[] = [];
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r][c];
      if (p && p.color === color) {
        const validMoves = getValidMoves(r, c);
        for (const m of validMoves) {
          moves.push({ from: { row: r, col: c }, to: m });
        }
      }
    }
  }
  return moves;
}

export function aiMove(color: PieceColor): { from: Position; to: Position; result: MoveResult } | null {
  const isMaximizing = color === 'red';
  const evalResult = minimax(3, -Infinity, Infinity, isMaximizing);
  if (!evalResult.bestMove) return null;

  const { from, to } = evalResult.bestMove;
  const moveResult = validateMove(from.row, from.col, to.row, to.col);
  return { from, to, result: moveResult };
}

export function getTopMoves(color: PieceColor, count: number): { from: Position; to: Position; score: number }[] {
  const isMaximizing = color === 'red';
  const allMoves = getAllMoves(color);
  const scored: { from: Position; to: Position; score: number }[] = [];

  for (const move of allMoves) {
    const captured = board[move.to.row][move.to.col];
    const piece = board[move.from.row][move.from.col]!;

    board[move.from.row][move.from.col] = null;
    board[move.to.row][move.to.col] = piece;
    const origRow = piece.row;
    const origCol = piece.col;
    piece.row = move.to.row;
    piece.col = move.to.col;

    const result = minimax(2, -Infinity, Infinity, !isMaximizing);

    piece.row = origRow;
    piece.col = origCol;
    board[move.from.row][move.from.col] = piece;
    board[move.to.row][move.to.col] = captured;

    scored.push({ from: move.from, to: move.to, score: result.score });
  }

  scored.sort((a, b) => isMaximizing ? b.score - a.score : a.score - b.score);
  return scored.slice(0, count);
}

export function evaluateWinRate(): number {
  const score = evaluateBoard();
  const clamped = Math.max(-3000, Math.min(3000, score));
  return 50 + (clamped / 3000) * 50;
}
