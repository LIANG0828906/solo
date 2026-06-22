export type RuneType = 'fire' | 'water' | 'wind' | 'earth';

export interface CellPosition {
  x: number;
  y: number;
}

export interface RuneData {
  id: string;
  type: RuneType;
  position: CellPosition;
  collected: boolean;
}

export interface PlayerData {
  position: CellPosition;
  targetPosition: CellPosition;
  moveProgress: number;
  isMoving: boolean;
}

export interface PortalData {
  position: CellPosition;
  activated: boolean;
}

export type CellType = 0 | 1;

export interface MazeData {
  grid: CellType[][];
  size: number;
  start: CellPosition;
  exit: CellPosition;
}

export interface GameState {
  maze: MazeData;
  player: PlayerData;
  runes: RuneData[];
  portal: PortalData;
  collectedRunes: Set<RuneType>;
  startTime: number;
  elapsedTime: number;
  isRunning: boolean;
  isVictory: boolean;
}

export const RUNE_COLORS: Record<RuneType, { hex: number; css: string; name: string }> = {
  fire: { hex: 0xff5544, css: '#ff5544', name: '火' },
  water: { hex: 0x44aaff, css: '#44aaff', name: '水' },
  wind: { hex: 0x55dd88, css: '#55dd88', name: '风' },
  earth: { hex: 0xcc8844, css: '#cc8844', name: '地' },
};

export const RUNE_TYPES: RuneType[] = ['fire', 'water', 'wind', 'earth'];
export const CELL_SIZE = 2;
export const WALL_HEIGHT = 2;
export const MOVE_DURATION = 0.3;
