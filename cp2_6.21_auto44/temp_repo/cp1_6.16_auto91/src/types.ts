export type PlayerState = 'idle' | 'running' | 'jumping';
export type ObstacleType = 'vent' | 'antenna' | 'billboard';
export type ParticleType = 'trail' | 'halo';

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  lives: number;
  isJumping: boolean;
  isInvincible: boolean;
  invincibleTimer: number;
  frameIndex: number;
  frameTimer: number;
  state: PlayerState;
}

export interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: ObstacleType;
  color: string;
  speed: number;
  textFrame: number;
  passed: boolean;
}

export interface DataFragment {
  x: number;
  y: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  collected: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  maxSize: number;
  color: string;
  alpha: number;
  decay: number;
  type: ParticleType;
}

export interface GameState {
  score: number;
  highScore: number;
  displayScore: number;
  isPaused: boolean;
  isGameOver: boolean;
  gameSpeed: number;
  spawnInterval: number;
  alertLevel: number;
  obstacleCount: number;
  lastLifeBonus: number;
}

export interface GameConfig {
  readonly GRAVITY: number;
  readonly JUMP_FORCE: number;
  readonly MOVE_SPEED: number;
  readonly INITIAL_GAME_SPEED: number;
  readonly MAX_GAME_SPEED: number;
  readonly INITIAL_LIVES: number;
  readonly MAX_LIVES: number;
  readonly SCORE_PER_FRAGMENT: number;
  readonly LIFE_BONUS_SCORE: number;
  readonly DIFFICULTY_INTERVAL: number;
  readonly CANVAS_WIDTH: number;
  readonly CANVAS_HEIGHT: number;
  readonly GROUND_Y: number;
  readonly CEILING_Y: number;
  readonly PLAYER_SIZE: number;
  readonly MAX_PARTICLES: number;
  readonly INITIAL_SPAWN_INTERVAL: number;
  readonly MIN_SPAWN_INTERVAL: number;
}

export const CONFIG: GameConfig = {
  GRAVITY: -0.6,
  JUMP_FORCE: 12,
  MOVE_SPEED: 5,
  INITIAL_GAME_SPEED: 4,
  MAX_GAME_SPEED: 12,
  INITIAL_LIVES: 3,
  MAX_LIVES: 5,
  SCORE_PER_FRAGMENT: 10,
  LIFE_BONUS_SCORE: 500,
  DIFFICULTY_INTERVAL: 100,
  CANVAS_WIDTH: 1080,
  CANVAS_HEIGHT: 1920,
  GROUND_Y: 1700,
  CEILING_Y: 100,
  PLAYER_SIZE: 32,
  MAX_PARTICLES: 200,
  INITIAL_SPAWN_INTERVAL: 3000,
  MIN_SPAWN_INTERVAL: 800
};
