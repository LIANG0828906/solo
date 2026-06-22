export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  isGrounded: boolean;
  isJumping: boolean;
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Coin {
  x: number;
  y: number;
  radius: number;
  collected: boolean;
  floatOffset: number;
  collectAnimation: number;
}

export interface Spike {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Goal {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LevelData {
  platforms: Platform[];
  coins: Coin[];
  spikes: Spike[];
  goal: Goal;
  playerStart: { x: number; y: number };
}

export interface GameState {
  player: Player;
  platforms: Platform[];
  coins: Coin[];
  spikes: Spike[];
  goal: Goal;
  score: number;
  lives: number;
  level: number;
  gameStatus: 'menu' | 'playing' | 'won' | 'lost' | 'editor';
  animationFrame: number;
  selectedTool: 'platform' | 'coin' | 'spike' | 'goal' | null;
  customLevel: LevelData | null;
}

export type EditorTool = 'platform' | 'coin' | 'spike' | 'goal';
