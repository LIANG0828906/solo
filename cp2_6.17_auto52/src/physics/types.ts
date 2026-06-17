export interface Ball {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  energy: number;
  flashUntil: number;
  flashColor: string;
  spawnTime: number;
  spawning: boolean;
}

export interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CollisionResult {
  ball1: Ball;
  ball2: Ball;
  collided: boolean;
}

export interface FlashEffect {
  id: string;
  x: number;
  y: number;
  color: string;
  until: number;
}

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const PADDLE_WIDTH = 120;
export const PADDLE_HEIGHT = 16;
export const PADDLE_Y_OFFSET = 40;
export const PADDLE_SPEED_LIMIT = 300;
export const PADDLE_RESTITUTION = 0.8;
export const WALL_RESTITUTION = 1.0;
export const MAX_BALLS = 15;
export const INITIAL_LIVES = 3;
export const FLASH_DURATION = 100;
export const SPAWN_ANIM_DURATION = 300;
export const GRAVITY = 400;
export const FRICTION = 0.999;

export const COLOR_PALETTE = ['#E94560', '#0F3460', '#533483', '#00B4D8'];
