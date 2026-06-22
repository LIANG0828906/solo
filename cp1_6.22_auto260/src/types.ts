export interface PlayerData {
  attackDamage: number;
  attackSpeed: number;
  moveSpeed: number;
}

export interface MonsterConfig {
  patrolSpeed: number;
  chaseSpeed: number;
  visionRadius: number;
  attackInterval: number;
  attackBackswing: number;
}

export interface StatePreset {
  id: number;
  player: PlayerData;
  monster: MonsterConfig;
  timestamp: number;
}

export interface CombatStats {
  totalDamage: number;
  dodgeCount: number;
  hitCount: number;
  monsterHpPercent: number;
  currentDps: number;
  dpsHistory: { time: number; dps: number }[];
}

export const DEFAULT_PLAYER: PlayerData = {
  attackDamage: 10,
  attackSpeed: 0.5,
  moveSpeed: 200
};

export const DEFAULT_MONSTER: MonsterConfig = {
  patrolSpeed: 80,
  chaseSpeed: 120,
  visionRadius: 150,
  attackInterval: 1.5,
  attackBackswing: 0.3
};

export const MAP_WIDTH = 400;
export const MAP_HEIGHT = 1200;
export const GRID_SIZE = 32;
export const PLAYER_SIZE = 30;
export const MONSTER_RADIUS = 20;
export const OBSTACLE_SIZE = 40;
export const MAX_PRESETS = 3;
