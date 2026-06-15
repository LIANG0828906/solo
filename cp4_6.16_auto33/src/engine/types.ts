export type ResourceType = 'iron' | 'crystal' | 'energy';

export interface Resources {
  iron: number;
  crystal: number;
  energy: number;
}

export type ShipType = 'fighter' | 'corvette' | 'destroyer' | 'cruiser';

export interface ShipStats {
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  accuracy: number;
  critRate: number;
}

export interface ShipConfig {
  type: ShipType;
  name: string;
  description: string;
  cost: Resources;
  baseStats: ShipStats;
  bridgeSlots: number;
}

export interface Ship {
  id: string;
  type: ShipType;
  name: string;
  stats: ShipStats;
  bridgeSlots: number;
  position: SpaceCoord;
  isEnemy: boolean;
  hasActed: boolean;
}

export interface SpaceCoord {
  x: number;
  y: number;
}

export type BattlePhase = 'player' | 'enemy' | 'ended';

export type TurnPhase = 'select' | 'target' | 'animating';

export interface BattleState {
  grid: (Ship | null)[][];
  playerShips: Ship[];
  enemyShips: Ship[];
  currentTurn: number;
  phase: BattlePhase;
  turnPhase: TurnPhase;
  selectedShipId: string | null;
  log: BattleLogEntry[];
  waveNumber: number;
  isResting: boolean;
}

export interface BattleLogEntry {
  id: string;
  timestamp: number;
  turn: number;
  attacker: string;
  target: string;
  damage: number;
  isCrit: boolean;
  isHit: boolean;
  message: string;
}

export interface BuildQueueItem {
  shipType: ShipType;
  timeLeft: number;
}

export interface FleetState {
  formationSlots: (Ship | null)[];
  availableShips: Ship[];
  buildQueue: BuildQueueItem[];
}

export interface BattleStats {
  enemiesDestroyed: number;
  shipsLost: number;
  duration: number;
  startTimestamp: number;
}

export interface SaveSlot {
  id: string;
  timestamp: number;
  waveNumber: number;
  playerName: string;
}

export const SHIP_CONFIGS: Record<ShipType, ShipConfig> = {
  fighter: {
    type: 'fighter',
    name: '战斗机',
    description: '轻型快速单位，高命中率低防御',
    cost: { iron: 15, crystal: 10, energy: 5 },
    baseStats: { hp: 50, maxHp: 50, attack: 12, defense: 3, speed: 8, accuracy: 0.9, critRate: 0.15 },
    bridgeSlots: 1
  },
  corvette: {
    type: 'corvette',
    name: '护卫舰',
    description: '中型均衡单位，攻防兼备',
    cost: { iron: 30, crystal: 20, energy: 15 },
    baseStats: { hp: 100, maxHp: 100, attack: 20, defense: 10, speed: 5, accuracy: 0.8, critRate: 0.1 },
    bridgeSlots: 2
  },
  destroyer: {
    type: 'destroyer',
    name: '驱逐舰',
    description: '重型火力单位，高攻击低速度',
    cost: { iron: 50, crystal: 35, energy: 25 },
    baseStats: { hp: 150, maxHp: 150, attack: 35, defense: 15, speed: 3, accuracy: 0.75, critRate: 0.12 },
    bridgeSlots: 3
  },
  cruiser: {
    type: 'cruiser',
    name: '巡洋舰',
    description: '旗舰级单位，高血量高火力',
    cost: { iron: 80, crystal: 60, energy: 45 },
    baseStats: { hp: 220, maxHp: 220, attack: 50, defense: 25, speed: 2, accuracy: 0.7, critRate: 0.18 },
    bridgeSlots: 4
  }
};

export const GRID_WIDTH = 8;
export const GRID_HEIGHT = 8;
export const MAX_FORMATION_SLOTS = 6;
