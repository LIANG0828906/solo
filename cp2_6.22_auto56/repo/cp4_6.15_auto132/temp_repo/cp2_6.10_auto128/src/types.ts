export enum StoneColor {
  Empty = 0,
  Black = 1,
  White = 2
}

export interface Position {
  x: number;
  y: number;
}

export interface MoveEntry {
  moveNumber: number;
  position: Position;
  color: StoneColor;
  timestamp: number;
  annotation?: string;
}

export interface GameRecord {
  moves: MoveEntry[];
  startTime: number;
  endTime?: number;
  winner?: StoneColor;
  totalMoves: number;
}

export interface GameState {
  board: StoneColor[][];
  currentTurn: StoneColor;
  gameOver: boolean;
  winner: StoneColor | null;
  gameRecord: GameRecord;
  currentMoveIndex: number;
  isPlaying: boolean;
  isReplaying: boolean;
}

export interface AnimatedStone {
  position: Position;
  color: StoneColor;
  startTime: number;
  duration: number;
}
