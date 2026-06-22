export type GameState = 'idle' | 'playing' | 'paused' | 'gameover' | 'victory';

export interface Beat {
  id: string;
  time: number;
  lane: number;
  hit?: boolean;
  missed?: boolean;
}
