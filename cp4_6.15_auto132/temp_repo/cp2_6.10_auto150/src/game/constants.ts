export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const BALL_RADIUS = 15;
export const BALL_COLOR = '#c8a45a';
export const PIN_WIDTH = 10;
export const PIN_HEIGHT = 40;
export const PIN_SPACING = 50;
export const GROUND_COLOR = '#e8d4a8';
export const BACKGROUND_COLOR = '#f5e6c8';
export const FRICTION = 0.985;
export const MIN_SPEED = 0.3;
export const MAX_POWER = 100;
export const POWER_TO_SPEED = 0.28;
export const TOTAL_ROUNDS = 10;

export const PIN_WORDS = [
  { word: '仁', type: 'red' },
  { word: '义', type: 'red' },
  { word: '礼', type: 'red' },
  { word: '智', type: 'red' },
  { word: '信', type: 'red' },
  { word: '骄', type: 'black' },
  { word: '奢', type: 'black' },
  { word: '淫', type: 'black' },
  { word: '逸', type: 'black' },
  { word: '盗', type: 'black' },
  { word: '忠', type: 'red' },
  { word: '孝', type: 'red' },
  { word: '廉', type: 'red' },
  { word: '耻', type: 'black' },
  { word: '贪', type: 'black' },
];

export const SCORE_RULES = {
  red: 10,
  black: -10,
};

export interface Pin {
  id: number;
  x: number;
  y: number;
  word: string;
  type: 'red' | 'black';
  isDown: boolean;
  rotation: number;
  fallDirection: number;
  angularVelocity: number;
}

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isMoving: boolean;
  rotation: number;
}

export type GameStatus = 'ready' | 'playing' | 'roundEnd' | 'gameOver';
