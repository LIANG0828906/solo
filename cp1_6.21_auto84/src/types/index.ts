export type UnitType = 'warrior' | 'mage' | 'archer';

export interface Unit {
  id: string;
  type: UnitType;
  name: string;
  attack: number;
  health: number;
  maxHealth: number;
  skillCooldown: number;
  currentCooldown: number;
  skillTriggered: number;
  playerId: string;
}

export interface Player {
  id: string;
  name: string;
  roomId: string;
  units: Unit[];
  isReady: boolean;
  totalHealth: number;
  maxTotalHealth: number;
}

export type RoomStatus = 'waiting' | 'configuring' | 'battling' | 'finished';

export interface Room {
  id: string;
  maxPlayers: number;
  initialHealth: number;
  players: Player[];
  status: RoomStatus;
  currentRound: number;
  battleLogs: BattleLogEntry[];
  winner: string | null;
  createdAt: number;
}

export type BattleLogType = 'attack' | 'skill' | 'death';

export interface BattleLogEntry {
  round: number;
  timestamp: number;
  type: BattleLogType;
  attackerId: string;
  attackerName: string;
  targetId: string;
  targetName: string;
  damage: number;
  skillName?: string;
}

export interface CombatResult {
  round: number;
  logs: BattleLogEntry[];
  updatedUnits: Unit[];
  isFinished: boolean;
  winner: string | null;
}

export interface ToastEvent {
  id: string;
  message: string;
  timestamp: number;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface UnitPreset {
  type: UnitType;
  name: string;
  attack: number;
  health: number;
  maxHealth: number;
  skillCooldown: number;
}

export interface UnitSkill {
  name: string;
  description: string;
  damageMultiplier: number;
}

export interface AnimationState {
  type: 'attack' | 'skill' | 'death' | 'idle';
  sourceUnitId: string | null;
  targetUnitId: string | null;
  timestamp: number;
}
