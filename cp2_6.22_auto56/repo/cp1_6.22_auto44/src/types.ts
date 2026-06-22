export enum GameState {
  MENU = 'menu',
  PLAYING = 'playing',
  PAUSED = 'paused',
  GAME_OVER = 'game_over'
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Velocity {
  vx: number;
  vy: number;
}

export interface Rect extends Position, Size {}

export enum EnemyType {
  NORMAL = 'normal',
  ELITE = 'elite'
}

export enum BulletType {
  PLAYER = 'player',
  ENEMY = 'enemy'
}

export enum ParticleType {
  EXPLOSION = 'explosion',
  DEBRIS = 'debris',
  SCORE = 'score'
}

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  shoot: boolean;
}

export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;
export const ASPECT_RATIO = CANVAS_WIDTH / CANVAS_HEIGHT;

export const PLAYER_SPEED = 300;
export const PLAYER_SIZE: Size = { width: 50, height: 40 };
export const PLAYER_MAX_HEALTH = 3;
export const PLAYER_FIRE_RATE = 150;

export const PLAYER_BULLET_SPEED = 500;
export const ENEMY_BULLET_SPEED = 250;
export const BULLET_SIZE: Size = { width: 12, height: 4 };

export const WAVE_INTERVAL = 3000;
export const ENEMY_BASE_SPEED = 80;
export const ELITE_ENEMY_HEALTH = 3;
export const NORMAL_ENEMY_HEALTH = 1;

export const SCORE_PER_ENEMY = 100;
export const SCORE_PER_ELITE = 300;

export const COLORS = {
  BACKGROUND: '#0a0a2e',
  ACCENT: '#00f0ff',
  WHITE: '#ffffff',
  GOLD: '#ffd700',
  PLAYER: '#00f0ff',
  ENEMY: '#ff4444',
  ELITE: '#ff8800',
  STAR_NEAR: '#ffffff',
  STAR_FAR: '#4466aa'
};

export const MAX_PARTICLES = 200;
