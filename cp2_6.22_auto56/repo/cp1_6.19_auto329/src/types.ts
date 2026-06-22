export type ModuleType = 'engine' | 'shield' | 'weapon';

export type Rarity = 'common' | 'rare' | 'legendary';

export type LogType = 'playerAttack' | 'enemyAttack' | 'turnEnd' | 'battleEnd';

export interface ShipModule {
  id: string;
  name: string;
  type: ModuleType;
  value: number;
  rarity: Rarity;
  description: string;
}

export interface Slot {
  id: string;
  type: ModuleType;
  position: { x: number; y: number };
  equippedModule: ShipModule | null;
}

export interface Ship {
  name: string;
  maxHp: number;
  currentHp: number;
  baseShield: number;
  baseWeapon: number;
  slots: Slot[];
}

export interface BattleState {
  isActive: boolean;
  currentTurn: number;
  maxTurns: number;
  playerShip: Ship;
  enemyShip: Ship;
  logs: BattleLogEntry[];
  winner: 'player' | 'enemy' | null;
  lastHitShip: 'player' | 'enemy' | null;
}

export interface BattleLogEntry {
  id: string;
  turn: number;
  type: LogType;
  message: string;
  timestamp: number;
}

export interface GameState {
  warehouse: ShipModule[];
  playerShip: Ship;
  battleState: BattleState | null;
  draggedModule: ShipModule | null;
}

export interface GameActions {
  assembleModule: (slotId: string, moduleId: string) => boolean;
  disassembleModule: (slotId: string) => void;
  startBattle: () => void;
  executeTurn: () => void;
  resetBattle: () => void;
  setDraggedModule: (module: ShipModule | null) => void;
  getTotalThrust: () => number;
  getTotalShield: () => number;
  getTotalWeapon: () => number;
  clearLastHit: () => void;
}

export type GameStore = GameState & GameActions;
