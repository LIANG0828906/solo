export type UnitType = 'warrior' | 'archer' | 'cavalry';

export type Team = 'player' | 'ai';

export interface UnitStats {
  hp: number;
  attack: number;
  move: number;
  range: number;
}

export interface Unit {
  id: string;
  type: UnitType;
  team: Team;
  hp: number;
  maxHp: number;
  attack: number;
  move: number;
  range: number;
  col: number;
  row: number;
  hasMoved: boolean;
  hasAttacked: boolean;
}

export interface HexCoord {
  col: number;
  row: number;
}

export interface BattleLogEntry {
  id: string;
  turn: number;
  team: Team;
  message: string;
  timestamp: number;
}

export type GamePhase = 'deploy' | 'battle' | 'ended';

export interface Settings {
  aiRandomFactor: number;
  warriorStats: UnitStats;
  archerStats: UnitStats;
  cavalryStats: UnitStats;
}

export interface ReplayStep {
  units: Unit[];
  currentTurn: Team;
  turnNumber: number;
  log: BattleLogEntry;
  animationType?: 'move' | 'attack' | 'damage';
  targetCoord?: HexCoord;
}
