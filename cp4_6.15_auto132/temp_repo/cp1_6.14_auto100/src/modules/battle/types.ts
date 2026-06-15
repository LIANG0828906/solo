export type UnitClass = 'warrior' | 'mage' | 'archer';

export type TerrainType = 'grass' | 'rock' | 'swamp';

export interface GridPosition {
  q: number;
  r: number;
}

export interface UnitStats {
  strength: number;
  agility: number;
  intelligence: number;
}

export interface Unit {
  id: string;
  name: string;
  unitClass: UnitClass;
  position: GridPosition;
  stats: UnitStats;
  maxHp: number;
  currentHp: number;
  moveRange: number;
  attackRange: number;
  isPlayer: boolean;
  hasActed: boolean;
}

export interface Terrain {
  type: TerrainType;
  defenseBonus: number;
  moveCostMultiplier: number;
}

export type LogType = 'move' | 'attack' | 'damage' | 'death' | 'info';

export interface BattleLogEntry {
  id: string;
  timestamp: number;
  message: string;
  type: LogType;
}

export interface TurnState {
  currentUnitIndex: number;
  turnOrder: string[];
  phase: 'idle' | 'selecting' | 'moving' | 'attacking' | 'ended';
  turnNumber: number;
}

export interface GridCell {
  position: GridPosition;
  terrain: TerrainType;
}

export interface MoveResult {
  path: GridPosition[];
  cost: number;
}

export interface AttackResult {
  damage: number;
  isCritical: boolean;
  targetDied: boolean;
}

export const UNIT_CLASS_COLORS: Record<UnitClass, string> = {
  warrior: '#ff6b6b',
  mage: '#5c9eff',
  archer: '#6bdb6b',
};

export const TERRAIN_COLORS: Record<TerrainType, string> = {
  grass: '#3d5c3d',
  rock: '#5a5a6a',
  swamp: '#2d4a3d',
};

export const TERRAIN_INFO: Record<TerrainType, Terrain> = {
  grass: { type: 'grass', defenseBonus: 0, moveCostMultiplier: 1 },
  rock: { type: 'rock', defenseBonus: 0.2, moveCostMultiplier: 1 },
  swamp: { type: 'swamp', defenseBonus: 0, moveCostMultiplier: 2 },
};

export const CLASS_BASE_STATS: Record<UnitClass, { hp: number; move: number; attack: number }> = {
  warrior: { hp: 100, move: 3, attack: 1 },
  mage: { hp: 60, move: 2, attack: 2 },
  archer: { hp: 70, move: 3, attack: 3 },
};
