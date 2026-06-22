export type Judgment = 'Perfect' | 'Great' | 'Good' | 'Miss';

export type Phase = 'PREPARING' | 'COUNTDOWN' | 'PLAYING' | 'RESULT';

export type Lane = 0 | 1;

export interface Note {
  id: number;
  time: number;
  lane: Lane