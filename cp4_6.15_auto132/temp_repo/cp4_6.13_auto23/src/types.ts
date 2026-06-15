export type PieceType = 'K' | 'A' | 'E' | 'H' | 'R' | 'C' | 'P';
export type PieceColor = 'red' | 'black';

export interface Piece {
  type: PieceType;
  color: PieceColor;
  id: string;
}

export type Board = (Piece | null)[][];

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  from: Position;
  to: Position;
  piece: Piece;
  captured: Piece | null;
}

export type Difficulty = 'easy' | 'medium';

export type GameStatus = 'playing' | 'checkmate' | 'stalemate' | 'draw';

export interface GameRecord {
  move: Move;
  noCaptureCount: number;
}

export interface GameState {
  board: Board;
  currentPlayer: PieceColor;
  history: GameRecord[];
  status: GameStatus;
  winner: PieceColor | null;
  noCaptureCount: number;
  difficulty: Difficulty;
  aiColor: PieceColor;
  selected: Position | null;
  validMoves: Position[];
  lastMove: Move | null;
  replaying: boolean;
  aiThinking: boolean;
}

export type Action =
  | { type: 'SELECT_PIECE'; pos: Position }
  | { type: 'MOVE_PIECE'; from: Position; to: Position }
  | { type: 'UNDO' }
  | { type: 'NEW_GAME'; difficulty: Difficulty }
  | { type: 'AI_MOVE'; move: Move }
  | { type: 'START_REPLAY' }
  | { type: 'REPLAY_STEP'; index: number }
  | { type: 'END_REPLAY' }
  | { type: 'SET_AI_THINKING'; thinking: boolean };
