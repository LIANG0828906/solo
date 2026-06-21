export type PlayerColor = 'white' | 'black';
export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';

export interface Position {
  row: number;
  col: number;
}

export interface Piece {
  id: string;
  type: PieceType;
  color: PlayerColor;
  revealed: boolean;
  position: Position;
}

export interface Move {
  pieceId: string;
  from: Position;
  to: Position;
  capturedPieceId?: string;
}

export interface BoardState {
  pieces: Piece[];
  currentTurn: PlayerColor;
  totalMoves: number;
  winner: PlayerColor | null;
  isGameOver: boolean;
}

export interface BattleLogEntry {
  timestamp: number;
  turn: number;
  player: PlayerColor;
  move: Move;
  capturedPiece?: Piece;
  message: string;
}

export type WSClientMessage =
  | { type: 'join'; roomId: string }
  | { type: 'move'; roomId: string; move: Move; playerColor: PlayerColor }
  | { type: 'restart'; roomId: string; playerColor: PlayerColor };

export type WSServerMessage =
  | { type: 'room_joined'; roomId: string; playerColor: PlayerColor; board: BoardState; battleLog: BattleLogEntry[] }
  | { type: 'room_created'; roomId: string; playerColor: PlayerColor; board: BoardState; battleLog: BattleLogEntry[] }
  | { type: 'waiting_for_opponent' }
  | { type: 'player_joined'; playerColor: PlayerColor }
  | { type: 'state_update'; board: BoardState; battleLog: BattleLogEntry[] }
  | { type: 'move_invalid'; reason: string }
  | { type: 'game_over'; winner: PlayerColor; board: BoardState; battleLog: BattleLogEntry[] };

export const PIECE_SYMBOLS: Record<PieceType, { white: string; black: string }> = {
  pawn:   { white: '♙', black: '♟' },
  rook:   { white: '♖', black: '♜' },
  knight: { white: '♘', black: '♞' },
  bishop: { white: '♗', black: '♝' },
  queen:  { white: '♕', black: '♛' },
  king:   { white: '♔', black: '♚' },
};

export const PIECE_NAMES: Record<PieceType, string> = {
  pawn: '兵',
  rook: '车',
  knight: '马',
  bishop: '象',
  queen: '后',
  king: '王',
};
