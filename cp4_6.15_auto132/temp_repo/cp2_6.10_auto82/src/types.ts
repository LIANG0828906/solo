export type StoneColor = 'black' | 'white' | null;

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  position: Position;
  color: StoneColor;
  moveNumber: number;
  timestamp: number;
}

export interface ChessManual {
  id: string;
  name: string;
  author: string;
  dynasty: string;
  description: string;
  moves: Position[];
  totalMoves: number;
}

export interface GameRecord {
  id: string;
  type: 'manual' | 'free';
  manualName?: string;
  moves: Move[];
  boardState: StoneColor[][];
  capturedBlack: number;
  capturedWhite: number;
  startTime: number;
  endTime: number;
  accuracy?: number;
  winRate?: number;
  winner?: 'black' | 'white' | 'draw';
}

export interface GameState {
  board: StoneColor[][];
  currentPlayer: 'black' | 'white';
  moveHistory: Move[];
  currentMoveIndex: number;
  gameMode: 'idle' | 'manual' | 'free';
  selectedManual: ChessManual | null;
  manualProgress: number;
  capturedBlack: number;
  capturedWhite: number;
  blackTerritory: number;
  whiteTerritory: number;
  isGameOver: boolean;
  deadBlocks: Position[][];
  aiPulsePosition: Position | null;
  startTime: number;
}

export interface ShapeAnalysis {
  description: string;
  suggestion: string;
  patternName: string;
}
