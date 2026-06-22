export type Direction = 'up' | 'down' | 'left' | 'right';

export type JudgeResult = 'perfect' | 'good' | 'miss';

export type NoteState = 'active' | 'hit' | 'missed';

export interface Note {
  id: string;
  direction: Direction;
  targetTime: number;
  y: number;
  state: NoteState;
  color: string;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
}

export interface RhythmNote {
  direction: Direction;
  time: number;
}

export const RHYTHM_PATTERN: RhythmNote[] = [
  { direction: 'up', time: 500 },
  { direction: 'down', time: 750 },
  { direction: 'left', time: 1000 },
  { direction: 'right', time: 1250 },
  { direction: 'up', time: 1500 },
  { direction: 'down', time: 1750 },
  { direction: 'left', time: 2000 },
  { direction: 'right', time: 2250 },
  { direction: 'up', time: 2500 },
  { direction: 'up', time: 2750 },
  { direction: 'down', time: 3000 },
  { direction: 'down', time: 3250 },
  { direction: 'left', time: 3500 },
  { direction: 'right', time: 3750 },
  { direction: 'left', time: 4000 },
  { direction: 'right', time: 4250 },
  { direction: 'up', time: 4500 },
  { direction: 'down', time: 4625 },
  { direction: 'left', time: 4750 },
  { direction: 'right', time: 4875 },
  { direction: 'up', time: 5000 },
  { direction: 'left', time: 5250 },
  { direction: 'down', time: 5500 },
  { direction: 'right', time: 5750 },
  { direction: 'up', time: 6000 },
  { direction: 'down', time: 6125 },
  { direction: 'up', time: 6250 },
  { direction: 'down', time: 6375 },
  { direction: 'left', time: 6500 },
  { direction: 'right', time: 6625 },
  { direction: 'left', time: 6750 },
  { direction: 'right', time: 6875 },
];

export const NOTE_COLORS: Record<Direction, string> = {
  up: '#ff6b6b',
  down: '#51cf66',
  left: '#339af0',
  right: '#fcc419',
};

export const SCORE_VALUES: Record<JudgeResult, number> = {
  perfect: 300,
  good: 100,
  miss: 0,
};

export const INITIAL_LIVES = 5;
