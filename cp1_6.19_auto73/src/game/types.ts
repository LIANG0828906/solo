export type Position = {
  x: number;
  y: number;
};

export type CellType = 'path' | 'trap_area' | 'wall' | 'entrance' | 'exit';

export type TrapType = 'spike' | 'freeze' | 'bomb';

export type GuardType = 'swordsman' | 'archer' | 'mage';

export type MonsterType = 'skeleton' | 'golem' | 'ghost';

export type DamageType = 'physical' | 'magical';

export interface Trap {
  id: string;
  type: TrapType;
  position: Position;
  cooldown: number;
  triggered: boolean;
}

export interface Guard {
  id: string;
  type: GuardType;
  position: Position;
  attackRange: number;
  attackDamage: number;
  attackSpeed: number;
  lastAttackTime: number;
  damageType: DamageType;
  slowEffect?: boolean;
}

export interface Monster {
  id: string;
  type: MonsterType;
  position: Position;
  currentHp: number;
  maxHp: number;
  speed: number;
  baseSpeed: number;
  path: Position[];
  currentPathIndex: number;
  slowTimer: number;
  dotTimer: number;
  dotDamage: number;
  immuneToPhysical: boolean;
  goldDrop: number;
  alive: boolean;
}

export interface CoinAnimation {
  id: string;
  position: Position;
  value: number;
  createdAt: number;
}

export interface ExplosionAnimation {
  id: string;
  position: Position;
  createdAt: number;
}

export interface GameState {
  gold: number;
  lives: number;
  currentWave: number;
  isPlaying: boolean;
  isGameOver: boolean;
  monsters: Monster[];
  traps: Trap[];
  guards: Guard[];
  coins: CoinAnimation[];
  explosions: ExplosionAnimation[];
  totalKills: number;
  totalGoldEarned: number;
  waveInProgress: boolean;
  showWaveText: boolean;
  selectedItem: { type: 'trap' | 'guard'; subtype: TrapType | GuardType } | null;
}

export const GRID_SIZE = 12;
export const CELL_SIZE = 48;
export const INITIAL_GOLD = 100;
export const INITIAL_LIVES = 20;
export const TRAP_COST = 15;
export const GUARD_COST = 25;
