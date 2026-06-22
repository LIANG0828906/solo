export interface AudioAnalysisResult {
  beatIntensity: number;
  frequencyDistribution: number[];
  bpm: number;
  isBeat: boolean;
}

export interface TrackNode {
  x: number;
  y: number;
  baseY: number;
  amplitude: number;
  phase: number;
  isPeak: boolean;
}

export interface Obstacle {
  x: number;
  y: number;
  size: number;
  active: boolean;
}

export interface MusicNote {
  x: number;
  y: number;
  size: number;
  active: boolean;
  collected: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface ShipState {
  x: number;
  y: number;
  baseY: number;
  velocityY: number;
  isJumping: boolean;
  jumpStartTime: number;
  trail: { x: number; y: number; alpha: number; size: number }[];
}

export interface GameState {
  score: number;
  combo: number;
  maxCombo: number;
  highScore: number;
  bpm: number;
  baseBpm: number;
  scrollSpeed: number;
  level: number;
  elapsedTime: number;
  musicProgress: number;
  isPlaying: boolean;
  isGameOver: boolean;
  isPaused: boolean;
  gamePhase: 'menu' | 'playing' | 'gameover';
}

export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
}
