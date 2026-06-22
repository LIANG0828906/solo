export const GRID_SIZE = 8;
export const CELL_SIZE = 60;
export const CART_WIDTH = 28;
export const CART_HEIGHT = 20;
export const TRACK_WIDTH = 4;
export const CART_SPEED = 1.8;
export const ORE_LOAD_INTERVAL = 500;
export const ORE_LOAD_COUNT = 3;
export const UNLOAD_DURATION = 800;
export const MAX_CARTS = 20;
export const STATS_REFRESH_INTERVAL = 2000;
export const PARTICLE_COUNT_MIN = 10;
export const PARTICLE_COUNT_MAX = 15;
export const PARTICLE_LIFETIME = 0.8;

export type Direction = 'N' | 'E' | 'S' | 'W';
export type CellType = 'empty' | 'track' | 'mine' | 'unload';
export type ToolType = 'track' | 'cart' | 'mine' | 'unload' | 'eraser';
export type CartState = 'idle' | 'moving_to_mine' | 'loading' | 'moving_to_unload' | 'unloading' | 'waiting';

export interface Position {
  row: number;
  col: number;
}

export interface GridCell {
  type: CellType;
  connections: Direction[];
  row: number;
  col: number;
}

export interface MineCart {
  id: number;
  position: Position;
  path: Position[];
  pathIndex: number;
  progress: number;
  loaded: boolean;
  state: CartState;
  loadingTimer: number;
  loadCount: number;
  waitingForCart: boolean;
  currentTripStart: number;
  unloadTimer: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  opacity: number;
  size: number;
  life: number;
}

export interface Stats {
  inTransitCarts: number;
  totalOre: number;
  avgTransportTime: number;
  trackUtilization: number;
}

export interface OrePopup {
  row: number;
  col: number;
  count: number;
  timer: number;
}

export const OPPOSITE_DIR: Record<Direction, Direction> = {
  N: 'S',
  S: 'N',
  E: 'W',
  W: 'E',
};

export const DIR_OFFSET: Record<Direction, [number, number]> = {
  N: [-1, 0],
  S: [1, 0],
  E: [0, 1],
  W: [0, -1],
};

export const ALL_DIRS: Direction[] = ['N', 'E', 'S', 'W'];
