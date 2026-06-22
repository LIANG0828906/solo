export interface Cell {
  x: number;
  y: number;
}

export type TotemStatus = 'idle' | 'triggered' | 'collected';

export interface Totem {
  id: string;
  position: Cell;
  frequency: number;
  status: TotemStatus;
  glowStart: number;
}

export type GameStatus = 'playing' | 'victory';
