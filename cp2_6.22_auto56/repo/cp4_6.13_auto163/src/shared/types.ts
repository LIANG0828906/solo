export type TowerType = 'fireball' | 'frost' | 'lightning';
export type MonsterType = 'normal' | 'fast' | 'elite';
export type GamePhase = 'preparation' | 'wave' | 'gameover';

export interface Position {
  x: number;
  y: number;
}

export interface Tower {
  id: string;
  type: TowerType;
  level: 1 | 2 | 3;
  position: Position;
  lastAttackTime: number;
}

export interface Monster {
  id: string;
  type: MonsterType;
  hp: number;
  maxHp: number;
  position: { x: number; y: number };
  pathIndex: number;
  baseSpeed: number;
  slowEndTime: number;
  slowFactor: number;
  hasShield: boolean;
  isDying: boolean;
  deathStartTime: number;
  spawnDelay: number;
  spawned: boolean;
}

export type EffectType = 'fireball' | 'frost' | 'lightning' | 'buildFlash' | 'towerMuzzle' | 'deathParticles';

export interface Effect {
  id: string;
  type: EffectType;
  from?: Position;
  to?: Position | Position[];
  startTime: number;
  duration: number;
  towerId?: string;
  monsterId?: string;
  chainTargets?: Position[];
}

export interface WaveConfig {
  waveNumber: number;
  totalMonsters: number;
  normalCount: number;
  fastCount: number;
  eliteCount: number;
  spawnInterval: number;
  hpMultiplier: number;
  speedMultiplier: number;
  hasBoss: boolean;
  scoreThreshold?: number;
  timeBonus?: number;
}

export interface GameState {
  gameId: string;
  phase: GamePhase;
  lives: number;
  gold: number;
  wave: number;
  kills: number;
  towers: Tower[];
  monsters: Monster[];
  effects: Effect[];
  preparationEndTime: number | null;
  waveStartTime: number | null;
  score: number;
  pendingMonsterCount: number;
  gameStartTime: number;
  currentWaveConfig?: WaveConfig;
}

export interface ScoreEntry {
  id: string;
  score: number;
  kills: number;
  wave: number;
  createdAt: number;
}

export interface TowerConfig {
  type: TowerType;
  level: 1 | 2 | 3;
  damage?: number;
  slowFactor?: number;
  slowDuration?: number;
  chainCount?: number;
  range: number;
  attackInterval: number;
  buildCost: number;
  upgradeCost: number | null;
}

export const GRID_COLS = 8;
export const GRID_ROWS = 6;
export const CELL_SIZE = 80;
export const INITIAL_GOLD = 200;
export const INITIAL_LIVES = 20;
export const PREPARATION_TIME = 10000;
export const KILL_GOLD_REWARD = 10;

export const PATH: Position[] = [
  { x: 0, y: 2 },
  { x: 1, y: 2 },
  { x: 2, y: 2 },
  { x: 2, y: 3 },
  { x: 2, y: 4 },
  { x: 3, y: 4 },
  { x: 4, y: 4 },
  { x: 4, y: 3 },
  { x: 4, y: 2 },
  { x: 4, y: 1 },
  { x: 5, y: 1 },
  { x: 6, y: 1 },
  { x: 6, y: 2 },
  { x: 6, y: 3 },
  { x: 7, y: 3 },
];

export const TOWER_CONFIGS: Record<TowerType, Record<1 | 2 | 3, TowerConfig>> = {
  fireball: {
    1: { type: 'fireball', level: 1, damage: 30, range: 2.5, attackInterval: 1000, buildCost: 50, upgradeCost: 80 },
    2: { type: 'fireball', level: 2, damage: 60, range: 3, attackInterval: 900, buildCost: 50, upgradeCost: 120 },
    3: { type: 'fireball', level: 3, damage: 100, range: 3.5, attackInterval: 800, buildCost: 50, upgradeCost: null },
  },
  frost: {
    1: { type: 'frost', level: 1, slowFactor: 0.5, slowDuration: 2000, range: 2, attackInterval: 1500, buildCost: 40, upgradeCost: 60 },
    2: { type: 'frost', level: 2, slowFactor: 0.7, slowDuration: 3000, range: 2.5, attackInterval: 1300, buildCost: 40, upgradeCost: 100 },
    3: { type: 'frost', level: 3, slowFactor: 0.9, slowDuration: 4000, range: 3, attackInterval: 1100, buildCost: 40, upgradeCost: null },
  },
  lightning: {
    1: { type: 'lightning', level: 1, damage: 20, chainCount: 3, range: 2.5, attackInterval: 1200, buildCost: 60, upgradeCost: 100 },
    2: { type: 'lightning', level: 2, damage: 35, chainCount: 4, range: 3, attackInterval: 1000, buildCost: 60, upgradeCost: 150 },
    3: { type: 'lightning', level: 3, damage: 55, chainCount: 5, range: 3.5, attackInterval: 800, buildCost: 60, upgradeCost: null },
  },
};
