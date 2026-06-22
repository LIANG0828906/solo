export type PieceColor = 'red' | 'black';
export type PieceType = 'king' | 'advisor' | 'bishop' | 'knight' | 'rook' | 'cannon' | 'pawn';

export interface Piece {
  type: PieceType;
  color: PieceColor;
}

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  from: Position;
  to: Position;
}

export interface MoveRecord {
  from: Position;
  to: Position;
  piece: Piece;
  captured: Piece | null;
  notation: string;
  timestamp: number;
  redTime: number;
  blackTime: number;
}

export type CellState = Piece | null;
export type BoardState = CellState[][];

export type GameStatus =
  | 'waiting'
  | 'playing'
  | 'check'
  | 'checkmate'
  | 'stalemate'
  | 'timeout'
  | 'resigned';

export interface GameState {
  board: BoardState;
  currentTurn: PieceColor;
  redTime: number;
  blackTime: number;
  moveHistory: MoveRecord[];
  status: GameStatus;
  winner: PieceColor | null;
}

export type WSMessageType =
  | 'CREATE_ROOM'
  | 'JOIN_ROOM'
  | 'RANDOM_MATCH'
  | 'ROOM_CREATED'
  | 'JOIN_SUCCESS'
  | 'JOIN_FAILED'
  | 'MATCH_FOUND'
  | 'MAKE_MOVE'
  | 'MOVE_MADE'
  | 'INVALID_MOVE'
  | 'GAME_START'
  | 'GAME_OVER'
  | 'CHAT_MESSAGE'
  | 'RESIGN'
  | 'TIMER_UPDATE'
  | 'GAME_STATE'
  | 'ERROR'
  | 'PLAYER_DISCONNECTED'
  | 'REQUEST_REPLAY'
  | 'REPLAY_DATA';

export interface WSMessage {
  type: WSMessageType;
  payload: any;
}

export interface PlayerInfo {
  id: string;
  color: PieceColor;
  name: string;
}

export interface RoomInfo {
  roomId: string;
  players: PlayerInfo[];
  gameState: GameState;
}

export const PIECE_NAMES: Record<PieceType, { red: string; black: string }> = {
  king: { red: '帥', black: '將' },
  advisor: { red: '仕', black: '士' },
  bishop: { red: '相', black: '象' },
  knight: { red: '馬', black: '馬' },
  rook: { red: '車', black: '車' },
  cannon: { red: '炮', black: '砲' },
  pawn: { red: '兵', black: '卒' },
};

export const PRESET_MESSAGES = ['好棋！', '加油', '思考中...', '认输', '请多指教', '再来一局'];
