export enum CellType {
  WALL = 0,
  PATH = 1,
  EMPTY = 2,
  POWER_UP = 3,
}

export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  NONE = 'NONE',
}

export enum PowerUpEffectType {
  SPEED_BOOST = 'speedBoost',
  GHOST_FREEZE = 'ghostFreeze',
  SCORE_MULTIPLIER = 'scoreMultiplier',
}

export interface Position {
  x: number;
  y: number;
}

export interface ActiveBuff {
  type: PowerUpEffectType;
  remainingTime: number;
  totalTime: number;
}

export interface Player {
  id: string;
  x: number;
  y: number;
  direction: Direction;
  nextDirection: Direction;
  score: number;
  lives: number;
  color: string;
  isPowered: boolean;
  powerTimer: number;
  activeBuffs: ActiveBuff[];
}

export interface Ghost {
  id: string;
  x: number;
  y: number;
  color: string;
  direction: Direction;
  isScared: boolean;
  isEaten: boolean;
  scaredTimer: number;
  respawnTimer: number;
}

export interface Shockwave {
  id: string;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  effectType?: PowerUpEffectType;
}

export type PowerUpEffectsMap = { [key: string]: PowerUpEffectType };

export type GameStatus = 'menu' | 'playing' | 'paused' | 'gameover' | 'win';

export interface GameState {
  maze: CellType[][];
  players: Player[];
  ghosts: Ghost[];
  shockwaves: Shockwave[];
  powerUpEffects: PowerUpEffectsMap;
  status: GameStatus;
  twoPlayerMode: boolean;
  powerUpRespawnTimer: number;
  mazeSize: number;
  totalDots: number;
  remainingDots: number;
}

export interface GameActions {
  setDirection: (playerId: string, direction: Direction) => void;
  startGame: (twoPlayer?: boolean) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  restartGame: () => void;
  toggleTwoPlayer: () => void;
  update: (deltaTime: number) => void;
}
