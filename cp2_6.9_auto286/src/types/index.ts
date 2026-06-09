export type StoneColor = 'black' | 'white' | null;

export interface Position {
  x: number;
  y: number;
}

export interface Move {
  position: Position;
  color: StoneColor;
  moveNumber: number;
  winRate: number;
  capturedStones: Position[];
}

export interface GameState {
  board: StoneColor[][];
  currentPlayer: StoneColor;
  moveHistory: Move[];
  captures: { black: number; white: number };
  isGameOver: boolean;
  winner: StoneColor;
  startTime: number;
  lastMoveTime: number;
}

export interface GameRecord {
  version: string;
  date: string;
  moves: Move[];
  captures: { black: number; white: number };
  winner: StoneColor;
  totalTime: number;
}

export interface RippleEffect {
  id: string;
  x: number;
  y: number;
  color: StoneColor;
}

export interface BlinkingStone {
  position: Position;
  color: StoneColor;
}
