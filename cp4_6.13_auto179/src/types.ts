export type GameStatus = 'idle' | 'playing' | 'paused' | 'gameover';
export type ObstacleType = 'box' | 'spike' | 'barrier';
export type VoiceCommand = 'jump' | 'crouch' | 'dash' | null;

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityY: number;
  isJumping: boolean;
  isCrouching: boolean;
  isDashing: boolean;
  isHurt: boolean;
  hurtTimer: number;
  animFrame: number;
  animTimer: number;
  dashTimer: number;
  crouchTimer: number;
}

export interface Obstacle {
  type: ObstacleType;
  x: number;
  y: number;
  width: number;
  height: number;
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

export interface GameState {
  status: GameStatus;
  score: number;
  lives: number;
  volume: number;
  confidence: number;
  lastCommand: VoiceCommand;
  scrollSpeed: number;
  scrollSpeedMin: number;
  scrollSpeedMax: number;
  difficulty: number;
  spawnInterval: number;
  spawnIntervalMin: number;
  spawnIntervalMax: number;
  backgroundProgress: number;
  fps: number;
  waveData: number[];
}

export interface GameConfig {
  canvasWidth: number;
  canvasHeight: number;
  gravity: number;
  groundY: number;
  playerStartX: number;
  volumeJumpMin: number;
  volumeJumpMax: number;
  jumpHeightMin: number;
  jumpHeightMax: number;
  superJumpThreshold: number;
  superJumpHeight: number;
  confidenceThreshold: number;
  initialLives: number;
  hurtDuration: number;
  dashDuration: number;
  crouchDuration: number;
}
