export type Direction = 'up' | 'down' | 'left' | 'right';

export type FoodType = 'normal' | 'speed' | 'bomb';

export type GameStatus = 'waiting' | 'playing' | 'ended';

export interface Position {
  x: number;
  y: number;
}

export interface Snake {
  id: string;
  body: Position[];
  direction: Direction;
  color: string;
  speed: number;
  baseSpeed: number;
  speedBoostEndTime: number;
  isAlive: boolean;
  kills: number;
  maxLength: number;
  spawnTime: number;
  deathTime: number | null;
}

export interface Food {
  id: string;
  type: FoodType;
  position: Position;
  spawnTime: number;
}

export interface Player {
  id: string;
  name: string;
  color: string;
  isReady: boolean;
}

export interface GameState {
  status: GameStatus;
  players: Player[];
  snakes: Snake[];
  foods: Food[];
  gridWidth: number;
  gridHeight: number;
  safeMode: boolean;
  startTime: number;
  endTime: number | null;
}

export type WSMessageType =
  | 'join'
  | 'leave'
  | 'ready'
  | 'start'
  | 'direction'
  | 'state'
  | 'gameOver'
  | 'error'
  | 'playersUpdate'
  | 'restart';

export interface WSMessage<T = unknown> {
  type: WSMessageType;
  data: T;
  timestamp: number;
}

export interface JoinData {
  name: string;
  color: string;
}

export interface DirectionData {
  direction: Direction;
}

export interface ReadyData {
  isReady: boolean;
}

export const COLORS: string[] = [
  '#e94560',
  '#00d9ff',
  '#7c3aed',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#3b82f6',
  '#8b5cf6',
];

export const FOOD_CONFIG = {
  normal: {
    growth: 1,
    color: '#ffffff',
    duration: Infinity,
  },
  speed: {
    growth: 2,
    color: '#ef4444',
    duration: 10000,
    speedBoost: 0.1,
    speedBoostDuration: 3000,
  },
  bomb: {
    growth: -3,
    color: '#1a1a1a',
    duration: 15000,
  },
} as const;

export const GRID_WIDTH = 50;
export const GRID_HEIGHT = 35;
export const BASE_SPEED = 6;
export const SYNC_INTERVAL = 100;
export const TARGET_FPS = 60;
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 4;
export const MIN_FOODS = 10;
export const MAX_FOODS = 15;
