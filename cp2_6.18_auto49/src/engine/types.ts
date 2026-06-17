export interface Player {
  x: number;
  y: number;
  baseY: number;
  width: number;
  height: number;
  velocityY: number;
  state: 'idle' | 'jumping' | 'sliding';
  stateTimer: number;
  jumpPhase: 'up' | 'down' | 'none';
  color: string;
}

export interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  lane: 'left' | 'right';
  color: string;
  hit: boolean;
}

export interface Coin {
  x: number;
  y: number;
  radius: number;
  collected: boolean;
  value: number;
}

export type SongSection = 'intro' | 'verse' | 'chorus';

export interface GameState {
  player: Player;
  obstacles: Obstacle[];
  coins: Coin[];
  score: number;
  health: number;
  beatIndex: number;
  section: SongSection;
  coinsCollected: number;
  survivalTime: number;
  isPaused: boolean;
  isGameOver: boolean;
  scrollSpeed: number;
  bgFlash: boolean;
  combo: number;
  comboBreak: boolean;
  comboFlash: boolean;
}

export type GameEventType =
  | 'gameState'
  | 'beat'
  | 'collision'
  | 'gameOver'
  | 'pauseToggle'
  | 'restart'
  | 'backToMenu'
  | 'comboIncrement'
  | 'comboBreak'
  | 'comboMilestone';

export interface LeaderboardEntry {
  rank?: number;
  name: string;
  score: number;
  timestamp: number;
}

export interface BeatEvent {
  index: number;
  section: SongSection;
  time: number;
}
