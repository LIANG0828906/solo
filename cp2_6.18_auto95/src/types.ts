export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Point {
  x: number;
  y: number;
}

export interface Snake {
  id: string;
  name: string;
  body: Point[];
  direction: Direction;
  alive: boolean;
  score: number;
  color: string;
  isPlayer: boolean;
  deathOpacity?: number;
  lastTurnTime?: number;
}

export interface Food {
  id: string;
  position: Point;
  scale: number;
  createdAt: number;
}

export type GameStage = 'waiting' | 'playing' | 'ended';

export interface GameState {
  snakes: Snake[];
  foods: Food[];
  gameStage: GameStage;
  winnerId: string | null;
}

export const COLOR_PALETTE = [
  '#FF0000',
  '#00FF00',
  '#0000FF',
  '#FFFF00',
  '#FF00FF',
  '#00FFFF',
  '#FFA500',
  '#FF69B4',
];

export const AI_NAMES = [
  'AI-猎手',
  'AI-闪电',
  'AI-幽灵',
  'AI-巨蟒',
];

export const CANVAS_SIZE = 800;
export const GRID_SIZE = 20;
export const CELL_PADDING = 4;
export const FOOD_RADIUS = 6;
export const TARGET_FPS = 15;
export const FRAME_INTERVAL = 1000 / TARGET_FPS;
export const MAX_FOODS = 5;
export const SCORE_PER_FOOD = 10;
export const DEATH_ANIMATION_DURATION = 300;
export const FOOD_SCALE_ANIMATION_DURATION = 200;
