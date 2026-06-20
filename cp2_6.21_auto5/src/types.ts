export type CellType = 'empty' | 'obstacle' | 'speed_boost' | 'jump_platform';

export interface Cell {
  type: CellType;
  height: number;
  multiplier: number;
}

export interface Track {
  id: string;
  name: string;
  cells: Cell[][];
  width: number;
  height: number;
  createdAt: number;
}

export interface PlayerRecord {
  id: string;
  trackId: string;
  trackName: string;
  nickname: string;
  time: number;
  timestamp: number;
  skin: Skin;
  attempts: number;
}

export interface Skin {
  bodyColor: string;
  accessory: 'none' | 'glasses' | 'helmet' | 'cape';
  accessoryStyle: number;
}

export interface PlayerState {
  x: number;
  y: number;
  vy: number;
  speed: number;
  isJumping: boolean;
  jumpHoldTime: number;
  isOnGround: boolean;
  isFinished: boolean;
  trail: Array<{ x: number; y: number; alpha: number }>;
}

export interface GameState {
  player: PlayerState;
  gameTime: number;
  isRunning: boolean;
  isPaused: boolean;
  currentTrack: Track | null;
  currentSkin: Skin;
}

export const GRID_WIDTH = 20;
export const GRID_HEIGHT = 10;
export const CELL_SIZE = 30;
export const GRID_LINE_WIDTH = 1;

export const COLOR_EMPTY = '#000000';
export const COLOR_OBSTACLE = '#ff006e';
export const COLOR_SPEED_BOOST = '#00f5d4';
export const COLOR_JUMP_PLATFORM = '#b5179e';
export const COLOR_GRID_LINE = '#0a0f24';
export const COLOR_PLAYER_BODY = '#00d9ff';
export const COLOR_PLAYER_JOINT = '#ffffff';
export const COLOR_NEON_BORDER = '#00f5d4';
export const COLOR_BG_DARK = '#0a0f24';
export const COLOR_BG_PURPLE = '#1a0033';

export const CELL_TYPES: CellType[] = ['empty', 'obstacle', 'speed_boost', 'jump_platform'];

export const SKIN_PALETTE = [
  '#00d9ff', '#ff006e', '#00f5d4', '#b5179e',
  '#ffbe0b', '#fb5607', '#8338ec', '#3a86ff',
  '#06d6a0', '#ef476f', '#ffd166', '#118ab2',
  '#e63946', '#a8dadc', '#f4a261', '#2a9d8f',
];

export const ACCESSORY_STYLES: Record<Skin['accessory'], number> = {
  none: 0,
  glasses: 3,
  helmet: 3,
  cape: 3,
};
