export enum RuneType {
  Fire = 'fire',
  Water = 'water',
  Wind = 'wind',
  Earth = 'earth',
  Light = 'light',
  Dark = 'dark',
  Golden = 'golden'
}

export const RUNE_COLORS: Record<string, string> = {
  [RuneType.Fire]: '#EF4444',
  [RuneType.Water]: '#3B82F6',
  [RuneType.Wind]: '#06B6D4',
  [RuneType.Earth]: '#84CC16',
  [RuneType.Light]: '#FBBF24',
  [RuneType.Dark]: '#A855F7',
  [RuneType.Golden]: '#FFD700'
};

export const RUNE_GLOW_COLORS: Record<string, string> = {
  [RuneType.Fire]: '#FF6B6B',
  [RuneType.Water]: '#60A5FA',
  [RuneType.Wind]: '#22D3EE',
  [RuneType.Earth]: '#A3E635',
  [RuneType.Light]: '#FDE68A',
  [RuneType.Dark]: '#C084FC',
  [RuneType.Golden]: '#FFE066'
};

export interface Position {
  row: number;
  col: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface CellData {
  type: RuneType;
  isGolden: boolean;
  glowTimer: number;
  destroyTimer: number;
  fallOffsetY: number;
  fallTimer: number;
  fallDuration: number;
  swipeOffsetX: number;
  swipeOffsetY: number;
  swipeTimer: number;
  goldenRotation: number;
  eliminated: boolean;
  isNew: boolean;
}

export enum GamePhase {
  Idle,
  Swiping,
  CheckMatch,
  Eliminating,
  Falling,
  CheckCascade,
  BurstFlash,
  GameOver
}

export interface MatchGroup {
  positions: Position[];
  type: RuneType;
  hasGolden: boolean;
}

export interface SwipeData {
  direction: 'left' | 'right' | 'up' | 'down';
  isRow: boolean;
  index: number;
}

export const BOARD_SIZE = 6;
export const GAME_DURATION = 60;
export const SWIPE_DURATION = 0.25;
export const GLOW_DURATION = 0.3;
export const DESTROY_DURATION = 0.5;
export const FALL_DURATION = 0.2;
export const BURST_FLASH_DURATION = 0.6;
export const MATCH_SCORE_BASE = 100;
export const MATCH_SCORE_EXTRA = 50;
export const ENERGY_PER_ELIMINATION = 0.1;
export const MAX_PARTICLES = 100;
