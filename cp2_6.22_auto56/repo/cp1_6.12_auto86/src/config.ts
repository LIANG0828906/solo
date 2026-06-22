export const GRID_COLS = 20;
export const GRID_ROWS = 15;
export const CELL_SIZE = 40;
export const GAME_WIDTH = GRID_COLS * CELL_SIZE;
export const GAME_HEIGHT = GRID_ROWS * CELL_SIZE;

export enum ElementType {
  GROUND = 'ground',
  PLATFORM = 'platform',
  SPIKE = 'spike',
  ENEMY = 'enemy',
  COIN = 'coin',
  PLAYER_START = 'player_start',
  END_FLAG = 'end_flag',
  ERASER = 'eraser',
}

export const ELEMENT_LABELS: Record<string, string> = {
  [ElementType.GROUND]: '地面砖块',
  [ElementType.PLATFORM]: '平台',
  [ElementType.SPIKE]: '尖刺',
  [ElementType.ENEMY]: '敌人',
  [ElementType.COIN]: '金币',
  [ElementType.PLAYER_START]: '玩家起始点',
  [ElementType.END_FLAG]: '终点旗帜',
  [ElementType.ERASER]: '橡皮擦',
};

export interface LevelCell {
  type: ElementType;
  platformLength?: number;
  enemyRange?: number;
}

export interface LevelData {
  grid: (LevelCell | null)[][];
  playerStart: { x: number; y: number } | null;
  endFlag: { x: number; y: number } | null;
}

export function createEmptyGrid(): (LevelCell | null)[][] {
  const grid: (LevelCell | null)[][] = [];
  for (let y = 0; y < GRID_ROWS; y++) {
    grid[y] = [];
    for (let x = 0; x < GRID_COLS; x++) {
      grid[y][x] = null;
    }
  }
  return grid;
}
