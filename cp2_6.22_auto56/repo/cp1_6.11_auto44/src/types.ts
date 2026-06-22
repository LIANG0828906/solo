export enum TileType {
  EMPTY = 0,
  WALL = 1,
  COPPER = 2,
  SILVER = 3,
  GOLD = 4,
  DIAMOND = 5
}

export enum Direction {
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right'
}

export enum GameState {
  LOADING = 'loading',
  PLAYING = 'playing',
  GAME_OVER = 'gameover',
  VICTORY = 'victory'
}

export interface Position {
  x: number;
  y: number;
}

export interface Tile {
  type: TileType;
  x: number;
  y: number;
  texture: number[][];
}

export interface PlayerState {
  x: number;
  y: number;
  direction: Direction;
  frame: number;
  health: number;
  maxHealth: number;
  inventory: {
    copper: number;
    silver: number;
    gold: number;
    diamond: number;
  };
  totalOres: number;
  isMoving: boolean;
  moveCooldown: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export interface Debris {
  x: number;
  y: number;
  vy: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  life: number;
  maxLife: number;
}

export interface MapChunk {
  startY: number;
  endY: number;
  tiles: Tile[][];
  lastUsed: number;
}

export interface GameConfig {
  TILE_SIZE: number;
  PLAYER_SIZE: number;
  MOVE_STEP: number;
  CANVAS_HEIGHT: number;
  MIN_CANVAS_WIDTH: number;
  DEPTH_PER_TILE: number;
  MAX_ORES: number;
  INITIAL_HEALTH: number;
  COLLAPSE_INTERVAL_MIN: number;
  COLLAPSE_INTERVAL_MAX: number;
  COLLAPSE_SIZE: number;
  LERP_FACTOR: number;
}

export interface CameraState {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  shake: number;
  shakeTime: number;
  flashTime: number;
  flashColor: string;
}

export interface CollapseEvent {
  x: number;
  y: number;
  size: number;
  timeLeft: number;
  debris: Debris[];
  damageDealt: boolean;
}
