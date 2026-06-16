import { BoardState, CellState, Piece, PieceColor, PieceType, Position, MoveRecord } from '../../shared/types';

export class ChessEngine {
  static createInitialBoard(): BoardState {
    const board: BoardState = Array.from({ length: 10 }, () => Array(9).fill(null));
    const backRow: PieceType[] = ['rook', 'knight', 'bishop', 'advisor', 'king', 'advisor', 'bishop', 'knight', 'rook'];

    for (let c = 0; c < 9; c++) {
      board[0][c] = { type: backRow[c], color: 'black' };
      board[9][c] = { type: backRow[c], color: 'red' };
    }

    board[2][1] = { type: 'cannon', color: 'black' };
    board[2][7] = { type: 'cannon', color: 'black' };
    board[7][1] = { type: 'cannon', color: 'red' };
    board[7][7] = { type: 'cannon', color: 'red' };

    for (let c = 0; c < 9; c += 2) {
      board[3][c] = { type: 'pawn', color: 'black' };
      board[6][c] = { type: 'pawn', color: 'red' };
    }

    return board;
  }

  static cloneBoard(board: BoardState): BoardState {
    return board.map(row => row.map(cell => (cell ? { ...cell } : null)));
  }

  static getPiece(board: BoardState, pos: Position): CellState {
    if (pos.row < 0 || pos.row > 9 || pos.col < 0 || pos.col > 8) return undefined as any;
    return board[pos.row][pos.col];
  }

  static isInBoard(row: number, col: number): boolean {
    return row >= 0 && row <= 9 && col >= 0 && col <= 8;
  }

  static isInPalace(row: number, col: number, color: PieceColor): boolean {
    if (col < 3 || col > 5) return false;
    if (color === 'red') return row >= 7 && row <= 9;
    return row >= 0 && row <= 2;
  }

  static hasCrossedRiver(row: number, color: PieceColor): boolean {
    if (color === 'red') return row <= 4;
    return row >= 5;
  }

  static isValidMove(board: BoardState, from: Position, to: Position, currentTurn: PieceColor): { valid: boolean; reason?: string } {
    const piece = ChessEngine.getPiece(board, from);
    if (!piece) return { valid: false, reason: '没有棋子' };
    if (piece.color !== currentTurn) return { valid: false, reason: '不是你的棋子' };

    const target = ChessEngine.getPiece(board, to);
    if (target && target.color === piece.color) return { valid: false, reason: '不能吃自己的棋子' };

    if (from.row === to.row && from.col === to.col) return { valid: false, reason: '没有移动' };

    const pieceValidation = ChessEngine.validatePieceMove(board, from, to, piece);
    if (!pieceValidation.valid) return pieceValidation;

    const newBoard = ChessEngine.cloneBoard(board);
    newBoard[to.row][to.col] = newBoard[from.row][from.col];
    newBoard[from.row][from.col] = null;

    if (ChessEngine.isKingsFacing(newBoard)) {
      return { valid: false, reason: '王不见王' };
    }

    if (ChessEngine.isInCheck(newBoard, currentTurn)) {
      return { valid: false, reason: '不能送将' };
    }

    return { valid: true };
  }

  private static validatePieceMove(board: BoardState, from: Position, to: Position, piece: Piece): { valid: boolean; reason?: string } {
    switch (piece.type) {
      case 'king': return ChessEngine.validateKing(from, to, piece.color);
      case 'advisor': return ChessEngine.validateAdvisor(from, to, piece.color);
      case 'bishop': return ChessEngine.validateBishop(board, from, to, piece.color);
      case 'knight': return ChessEngine.validateKnight(board, from, to);
      case 'rook': return ChessEngine.validateRook(board, from, to);
      case 'cannon': return ChessEngine.validateCannon(board, from, to);
      case 'pawn': return ChessEngine.validatePawn(from, to, piece.color);
      default: return { valid: false, reason: '未知棋子类型' };
    }
  }

  private static validateKing(from: Position, to: Position, color: PieceColor): { valid: boolean; reason?: string } {
    if (!ChessEngine.isInPalace(to.row, to.col, color)) {
      return { valid: false, reason: '将帅不能出九宫' };
    }
    const dr = Math.abs(to.row - from.row);
    const dc = Math.abs(to.col - from.col);
    if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
      return { valid: true };
    }
    return { valid: false, reason: '将帅只能走一步' };
  }

  private static validateAdvisor(from: Position, to: Position, color: PieceColor): { valid: boolean; reason?: string } {
    if (!ChessEngine.isInPalace(to.row, to.col, color)) {
      return { valid: false, reason: '仕士不能出九宫' };
    }
    const dr = Math.abs(to.row - from.row);
    const dc = Math.abs(to.col - from.col);
    if (dr === 1 && dc === 1) {
      return { valid: true };
    }
    return { valid: false, reason: '仕士只能走斜线一格' };
  }

  private static validateBishop(board: BoardState, from: Position, to: Position, color: PieceColor): { valid: boolean; reason?: string } {
    if (!ChessEngine.isInBoard(to.row, to.col)) {
      return { valid: false, reason: '超出棋盘' };
    }
    if (color === 'red' && to.row < 5) {
      return { valid: false, reason: '相不能过河' };
    }
    if (color === 'black' && to.row > 4) {
      return { valid: false, reason: '象不能过河' };
    }
    const dr = Math.abs(to.row - from.row);
    const dc = Math.abs(to.col - from.col);
    if (dr !== 2 || dc !== 2) {
      return { valid: false, reason: '象走田字' };
    }
    const eyeRow = from.row + (to.row - from.row) / 2;
    const eyeCol = from.col + (to.col - from.col) / 2;
    if (board[eyeRow][eyeCol]) {
      return { valid: false, reason: '塞象眼' };
    }
    return { valid: true };
  }

  private static validateKnight(board: BoardState, from: Position, to: Position): { valid: boolean; reason?: string } {
    const dr = to.row - from.row;
    const dc = to.col - from.col;
    const adr = Math.abs(dr);
    const adc = Math.abs(dc);

    if (!((adr === 2 && adc === 1) || (adr === 1 && adc === 2))) {
      return { valid: false, reason: '马走日字' };
    }

    if (adr === 2) {
      const legRow = from.row + (dr > 0 ? 1 : -1);
      if (board[legRow][from.col]) {
        return { valid: false, reason: '蹩马脚' };
      }
    } else {
      const legCol = from.col + (dc > 0 ? 1 : -1);
      if (board[from.row][legCol]) {
        return { valid: false, reason: '蹩马脚' };
      }
    }

    return { valid: true };
  }

  private static validateRook(board: BoardState, from: Position, to: Position): { valid: boolean; reason?: string } {
    if (from.row !== to.row && from.col !== to.col) {
      return { valid: false, reason: '车只能走直线' };
    }
    if (ChessEngine.countPiecesBetween(board, from, to) > 0) {
      return { valid: false, reason: '车不能越子' };
    }
    return { valid: true };
  }

  private static validateCannon(board: BoardState, from: Position, to: Position): { valid: boolean; reason?: string } {
    if (from.row !== to.row && from.col !== to.col) {
      return { valid: false, reason: '炮只能走直线' };
    }
    const count = ChessEngine.countPiecesBetween(board, from, to);
    const target = board[to.row][to.col];
    if (target) {
      if (count !== 1) {
        return { valid: false, reason: '炮吃子需要隔一个棋子' };
      }
    } else {
      if (count > 0) {
        return { valid: false, reason: '炮移动不能越子' };
      }
    }
    return { valid: true };
  }

  private static validatePawn(from: Position, to: Position, color: PieceColor): { valid: boolean; reason?: string } {
    const dr = to.row - from.row;
    const dc = Math.abs(to.col - from.col);

    if (Math.abs(dr) > 1 || dc > 1) {
      return { valid: false, reason: '兵卒只能走一步' };
    }
    if (Math.abs(dr) + dc !== 1) {
      return { valid: false, reason: '兵卒只能直走或横走一步' };
    }

    if (color === 'red') {
      if (dr > 0) return { valid: false, reason: '兵不能后退' };
      if (dc > 0 && !ChessEngine.hasCrossedRiver(from.row, color)) {
        return { valid: false, reason: '兵未过河不能横走' };
      }
    } else {
      if (dr < 0) return { valid: false, reason: '卒不能后退' };
      if (dc > 0 && !ChessEngine.hasCrossedRiver(from.row, color)) {
        return { valid: false, reason: '卒未过河不能横走' };
      }
    }

    return { valid: true };
  }

  private static countPiecesBetween(board: BoardState, from: Position, to: Position): number {
    let count = 0;
    if (from.row === to.row) {
      const minC = Math.min(from.col, to.col);
      const maxC = Math.max(from.col, to.col);
      for (let c = minC + 1; c < maxC; c++) {
        if (board[from.row][c]) count++;
      }
    } else {
      const minR = Math.min(from.row, to.row);
      const maxR = Math.max(from.row, to.row);
      for (let r = minR + 1; r < maxR; r++) {
        if (board[r][from.col]) count++;
      }
    }
    return count;
  }

  static isKingsFacing(board: BoardState): boolean {
    let redKing: Position | null = null;
    let blackKing: Position | null = null;

    for (let r = 0; r <= 9; r++) {
      for (let c = 0; c <= 8; c++) {
        const p = board[r][c];
        if (p?.type === 'king') {
          if (p.color === 'red') redKing = { row: r, col: c };
          else blackKing = { row: r, col: c };
        }
      }
    }

    if (!redKing || !blackKing) return false;
    if (redKing.col !== blackKing.col) return false;

    const minR = Math.min(redKing.row, blackKing.row);
    const maxR = Math.max(redKing.row, blackKing.row);
    for (let r = minR + 1; r < maxR; r++) {
      if (board[r][redKing.col]) return false;
    }

    return true;
  }

  static findKing(board: BoardState, color: PieceColor): Position | null {
    for (let r = 0; r <= 9; r++) {
      for (let c = 0; c <= 8; c++) {
        const p = board[r][c];
        if (p?.type === 'king' && p.color === color) {
          return { row: r, col: c };
        }
      }
    }
    return null;
  }

  static isInCheck(board: BoardState, color: PieceColor): boolean {
    const kingPos = ChessEngine.findKing(board, color);
    if (!kingPos) return false;

    const opponent: PieceColor = color === 'red' ? 'black' : 'red';

    for (let r = 0; r <= 9; r++) {
      for (let c = 0; c <= 8; c++) {
        const p = board[r][c];
        if (p && p.color === opponent) {
          const from: Position = { row: r, col: c };
          const validation = ChessEngine.validatePieceMove(board, from, kingPos, p);
          if (validation.valid) return true;
        }
      }
    }

    return false;
  }

  static getValidMoves(board: BoardState, pos: Position, currentTurn: PieceColor): Position[] {
    const piece = board[pos.row][pos.col];
    if (!piece || piece.color !== currentTurn) return [];

    const moves: Position[] = [];
    for (let r = 0; r <= 9; r++) {
      for (let c = 0; c <= 8; c++) {
        const to: Position = { row: r, col: c };
        const result = ChessEngine.isValidMove(board, pos, to, currentTurn);
        if (result.valid) {
          moves.push(to);
        }
      }
    }
    return moves;
  }

  static makeMove(board: BoardState, from: Position, to: Position): { newBoard: BoardState; captured: Piece | null } {
    const newBoard = ChessEngine.cloneBoard(board);
    const captured = newBoard[to.row][to.col];
    newBoard[to.row][to.col] = newBoard[from.row][from.col];
    newBoard[from.row][from.col] = null;
    return { newBoard, captured };
  }

  static isCheckmate(board: BoardState, color: PieceColor): boolean {
    if (!ChessEngine.isInCheck(board, color)) return false;
    return ChessEngine.hasNoLegalMoves(board, color);
  }

  static isStalemate(board: BoardState, color: PieceColor): boolean {
    if (ChessEngine.isInCheck(board, color)) return false;
    return ChessEngine.hasNoLegalMoves(board, color);
  }

  private static hasNoLegalMoves(board: BoardState, color: PieceColor): boolean {
    for (let r = 0; r <= 9; r++) {
      for (let c = 0; c <= 8; c++) {
        const p = board[r][c];
        if (p && p.color === color) {
          const from: Position = { row: r, col: c };
          for (let tr = 0; tr <= 9; tr++) {
            for (let tc = 0; tc <= 8; tc++) {
              const to: Position = { row: tr, col: tc };
              if (ChessEngine.isValidMove(board, from, to, color).valid) {
                return false;
              }
            }
          }
        }
      }
    }
    return true;
  }

  static generateNotation(from: Position, to: Position, piece: Piece, boardBefore: BoardState): string {
    const PIECE_CHARS: Record<PieceType, { red: string; black: string }> = {
      king: { red: '帅', black: '将' },
      advisor: { red: '仕', black: '士' },
      bishop: { red: '相', black: '象' },
      knight: { red: '马', black: '马' },
      rook: { red: '车', black: '车' },
      cannon: { red: '炮', black: '砲' },
      pawn: { red: '兵', black: '卒' },
    };

    const COL_NAMES_RED = ['九', '八', '七', '六', '五', '四', '三', '二', '一'];
    const COL_NAMES_BLACK = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

    const isRed = piece.color === 'red';
    const colNames = isRed ? COL_NAMES_RED : COL_NAMES_BLACK;
    const pieceChar = PIECE_CHARS[piece.type][piece.color];

    const fromColStr = colNames[from.col];
    const isVertical = from.col === to.col;
    const isForward = isRed ? to.row < from.row : to.row > from.row;
    const stepCount = Math.abs(to.row - from.row) + Math.abs(to.col - from.col);

    let action: string;
    let dest: string;

    if (isVertical) {
      const distance = Math.abs(to.row - from.row);
      const numStr = isRed
        ? ChessEngine.numToChinese(distance)
        : String(distance);
      action = isForward ? '进' : '退';
      dest = numStr;
    } else if (from.row === to.row) {
      action = '平';
      dest = colNames[to.col];
    } else {
      action = isForward ? '进' : '退';
      dest = colNames[to.col];
    }

    return `${pieceChar}${fromColStr}${action}${dest}`;
  }

  private static numToChinese(n: number): string {
    const chars = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
    return chars[n] || String(n);
  }

  static checkGameEnd(board: BoardState, currentTurn: PieceColor): { ended: boolean; status: 'checkmate' | 'stalemate' | null; winner: PieceColor | null } {
    const opponent: PieceColor = currentTurn === 'red' ? 'black' : 'red';

    if (ChessEngine.isCheckmate(board, currentTurn)) {
      return { ended: true, status: 'checkmate', winner: opponent };
    }

    if (ChessEngine.isStalemate(board, currentTurn)) {
      return { ended: true, status: 'stalemate', winner: opponent };
    }

    return { ended: false, status: null, winner: null };
  }

  static boardToPGN(moveHistory: MoveRecord[]): string {
    const lines: string[] = [];
    for (let i = 0; i < moveHistory.length; i += 2) {
      const moveNum = Math.floor(i / 2) + 1;
      const redMove = moveHistory[i]?.notation || '...';
      const blackMove = moveHistory[i + 1]?.notation || '';
      lines.push(`${moveNum}. ${redMove}${blackMove ? ' ' + blackMove : ''}`);
    }
    return lines.join(' ');
  }
}
