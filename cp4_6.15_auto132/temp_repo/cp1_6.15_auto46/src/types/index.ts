export type PartType = 'head' | 'torso' | 'arms' | 'legs';

export interface PartStats {
  attack: number;
  defense: number;
  speed: number;
  energy: number;
}

export interface Part {
  id: string;
  type: PartType;
  name: string;
  stats: PartStats;
  color: number;
  shape: PartShape;
}

export interface PartShape {
  head: HeadShape;
  torso: TorsoShape;
  arms: ArmsShape;
  legs: LegsShape;
}

export type HeadShape = 'round' | 'angular' | 'visor';
export type TorsoShape = 'bulky' | 'slim' | 'titan';
export type ArmsShape = 'cannon' | 'blade' | 'shield';
export type LegsShape = 'tank' | 'spider' | 'bipedal';

export interface AssembledMech {
  head: Part;
  torso: Part;
  arms: Part;
  legs: Part;
  totalStats: PartStats;
  powerScore: number;
}

export interface BattleMech {
  name: string;
  stats: PartStats;
  hp: number;
  maxHp: number;
}

export interface BattleLogEntry {
  round: number;
  attacker: 'player' | 'enemy';
  action: string;
  damage: number;
  defenderHp: number;
}

export interface BattleResult {
  playerMech: BattleMech;
  enemyMech: BattleMech;
  logs: BattleLogEntry[];
  winner: 'player' | 'enemy' | 'draw';
  rounds: number;
  timestamp: number;
}

export interface BattleHistoryCard {
  id: string;
  enemyConfig: PartStats;
  rounds: number;
  winner: 'player' | 'enemy' | 'draw';
  timestamp: number;
  logs: BattleLogEntry[];
}
