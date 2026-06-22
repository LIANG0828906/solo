export const TILE_SIZE = 48;
export const MAP_WIDTH = 8;
export const MAP_HEIGHT = 8;
export const CANVAS_WIDTH = TILE_SIZE * MAP_WIDTH;
export const CANVAS_HEIGHT = TILE_SIZE * MAP_HEIGHT;

export enum TileType {
  WALL = 0,
  FLOOR = 1,
  CHEST = 2,
  EXIT = 3,
  KEY_RED = 4,
  KEY_BLUE = 5,
  KEY_GOLD = 6,
  SPAWN = 7,
  DOOR = 8
}

export enum KeyColor {
  RED = 'red',
  BLUE = 'blue',
  GOLD = 'gold'
}

export interface Position {
  x: number;
  y: number;
}

export interface Room {
  x: number;
  y: number;
  width: number;
  height: number;
  connected: boolean;
}

export interface ChestData {
  x: number;
  y: number;
  keyRequired: KeyColor;
  opened: boolean;
  opening: boolean;
  openProgress: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  value: number;
}

export interface Doorway {
  x: number;
  y: number;
  pulsePhase: number;
}
