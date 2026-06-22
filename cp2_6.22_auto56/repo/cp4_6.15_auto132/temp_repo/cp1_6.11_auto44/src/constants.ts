import { GameConfig } from './types';

export const CONFIG: GameConfig = {
  TILE_SIZE: 24,
  PLAYER_SIZE: 32,
  MOVE_STEP: 16,
  CANVAS_HEIGHT: 600,
  MIN_CANVAS_WIDTH: 800,
  DEPTH_PER_TILE: 0.5,
  MAX_ORES: 20,
  INITIAL_HEALTH: 3,
  COLLAPSE_INTERVAL_MIN: 30000,
  COLLAPSE_INTERVAL_MAX: 40000,
  COLLAPSE_SIZE: 5,
  LERP_FACTOR: 0.1
};

export const COLORS = {
  BACKGROUND: '#000000',
  WALL_BASE: '#3B2313',
  WALL_HIGHLIGHT: '#8B4513',
  COPPER: '#FF8C00',
  SILVER: '#C0C0C0',
  GOLD: '#FFD700',
  DIAMOND: '#00BFFF',
  UI_BG: 'rgba(30, 30, 30, 0.85)',
  UI_TEXT: '#FFFFFF',
  UI_BORDER: '#8B4513',
  HEART: '#FF0000',
  HEART_EMPTY: '#333333',
  EDGE_GLOW: 'rgba(100, 100, 100, 0.3)'
};

export const TILE_COLORS: Record<number, string> = {
  0: COLORS.BACKGROUND,
  1: COLORS.WALL_BASE,
  2: COLORS.COPPER,
  3: COLORS.SILVER,
  4: COLORS.GOLD,
  5: COLORS.DIAMOND
};

export const ORE_VALUES = {
  copper: 1,
  silver: 3,
  gold: 10,
  diamond: 50
};

export const ORE_NAMES: Record<string, string> = {
  copper: '铜',
  silver: '银',
  gold: '金',
  diamond: '钻石'
};

export const MAP_WIDTH = 100;
export const CHUNK_HEIGHT = 50;
export const RENDER_BUFFER = 50;
export const CHUNK_UNLOAD_DELAY = 2000;
