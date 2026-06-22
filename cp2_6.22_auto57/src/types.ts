export const TILE_SIZE = 16;
export const MAP_WIDTH = 50;
export const MAP_HEIGHT = 40;
export const VISION_RADIUS = 5;
export const TRAP_VISION_RADIUS = 2;

export enum TileType {
  WALL = 0,
  FLOOR = 1,
  TRAP = 2,
  CRYSTAL = 3,
  ORE = 4,
  EXIT = 5,
  ENTRANCE = 6
}

export interface Tile {
  type: TileType;
  explored: boolean;
  visible: boolean;
  collected?: boolean;
  trapTriggered?: boolean;
}

export interface Position {
  x: number;
  y: number;
}

export interface GameState {
  health: number;
  maxHealth: number;
  oxygen: number;
  maxOxygen: number;
  crystals: number;
  ores: number;
  time: number;
  deaths: number;
  isGameOver: boolean;
  isVictory: boolean;
  isPaused: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: number;
  size: number;
}
