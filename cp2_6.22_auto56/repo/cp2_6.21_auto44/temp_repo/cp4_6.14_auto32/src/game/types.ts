export interface Position {
  x: number;
  y: number;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface SnakeSegment {
  x: number;
  y: number;
}

export interface Snake {
  id: string;
  name: string;
  segments: SnakeSegment[];
  direction: Direction;
  nextDirection: Direction;
  score: number;
  alive: boolean;
  color: string;
  bornAt: number;
  flashUntil: number;
  headRotation: number;
  targetRotation: number;
}

export interface Food {
  id: string;
  x: number;
  y: number;
  spawnedAt: number;
}

export interface DeathParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  createdAt: number;
}

export interface GameState {
  snakes: Map<string, Snake>;
  foods: Map<string, Food>;
  deathParticles: DeathParticle[];
  mapWidth: number;
  mapHeight: number;
  tick: number;
  tickInterval: number;
  startedAt: number;
}

export interface PlayerState {
  id: string;
  name: string;
  score: number;
  alive: boolean;
  survivalTime: number;
}

export interface ServerMessage {
  type: 'state' | 'welcome' | 'player-joined' | 'player-left';
  data: any;
}

export interface ClientMessage {
  type: 'direction' | 'join';
  data: any;
}

export const MAP_WIDTH = 800;
export const MAP_HEIGHT = 600;
export const SMALL_MAP_WIDTH = 600;
export const SMALL_MAP_HEIGHT = 450;
export const GRID_SIZE = 40;
export const SEGMENT_SIZE = 16;
export const SEGMENT_GAP = 5;
export const FOOD_SIZE = 10;
export const MOVE_INTERVAL = 150;
export const INITIAL_SNAKE_LENGTH = 3;
export const FOOD_SPAWN_INTERVAL = 1000;
export const SERVER_TICK_INTERVAL = 50;
export const MAX_FOODS = 20;
