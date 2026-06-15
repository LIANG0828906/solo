export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export enum ItemType {
  ENERGY = 'ENERGY',
  SPEED = 'SPEED',
  SHIELD = 'SHIELD',
}

export interface Position {
  x: number;
  y: number;
}

export interface SnakeSegment extends Position {
  id: string;
}

export interface Item {
  id: string;
  type: ItemType;
  position: Position;
}

export interface TrailPoint extends Position {
  timestamp: number;
}

export interface SpeedBuff {
  active: boolean;
  endTime: number;
}

export interface ShieldBuff {
  count: number;
}

export interface GameState {
  snake: SnakeSegment[];
  direction: Direction;
  nextDirection: Direction;
  items: Item[];
  trail: TrailPoint[];
  score: number;
  isGameOver: boolean;
  isPaused: boolean;
  speedBuff: SpeedBuff;
  shieldBuff: ShieldBuff;
  highScore: number;
  borderFlash: boolean;
  lastBorderHitTime: number;
  gameStartTime: number;
}

export const GRID_SIZE = 20;
export const INITIAL_SNAKE_LENGTH = 3;
export const BASE_TICK_INTERVAL = 150;
export const SPEED_BUFF_MULTIPLIER = 0.8;
export const SPEED_BUFF_DURATION = 5000;
export const TRAIL_DURATION = 5000;
export const BORDER_FLASH_DURATION = 500;

export const GROWTH_QUOTES = [
  '长度增加带来的不仅是障碍',
  '每一次选择都在塑造未来',
  '速度与谨慎需要平衡',
  '保护自己才能走得更远',
  '轨迹是成长的证明',
  '边界不是终点而是转折',
  '在有限空间里创造无限可能',
  '沉淀的每一步都有意义',
  '闪光的时刻源于积累',
  '越成长越需要清醒的头脑',
];
