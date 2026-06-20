export type CellType = 'wall' | 'path';

export type NoteColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue';

export interface Position {
  x: number;
  y: number;
}

export interface Note {
  id: string;
  position: Position;
  color: NoteColor;
  frequency: number;
  collected: boolean;
  order: number;
}

export interface WallWave {
  position: Position;
  frequency: number;
  color: string;
  startTime: number;
}

export interface GameState {
  grid: CellType[][];
  player: Position;
  notes: Note[];
  collectedNotes: Note[];
  wallWaves: Map<string, WallWave>;
  isComplete: boolean;
  isPlaying: boolean;
  correctOrder: NoteColor[];
  movePlayer: (direction: 'up' | 'down' | 'left' | 'right') => void;
  collectNote: (noteId: string) => void;
  triggerWallWave: (positions: Position[], frequency: number, color: NoteColor) => void;
  checkCompletion: () => void;
  playMelody: () => void;
  resetGame: () => void;
  initializeGame: () => void;
  cleanUpWallWaves: () => void;
}
