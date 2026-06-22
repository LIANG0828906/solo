export type ResourceType = 'iron' | 'crystal' | 'energy';

export interface Resources {
  iron: number;
  crystal: number;
  energy: number;
}

export type ShipType = 'fighter' | 'corvette' | 'destroyer' | 'cruiser';

export interface Shield {
  value: number;
  maxValue: number;
  regenRate: number;
}

export interface ShipStats {
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  accuracy: number;
  critRate: number;
  weaponPrecision: number;
  shield: Shield;
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
  attackAnimations: AttackAnimation[];
}

export interface AttackAnimation {
  id: string;
  from: SpaceCoord;
  to: SpaceCoord;
  progress: number;
  damage: number;
  isCrit: boolean;
}

export interface BattleLogEntry {
  id: string;
  timestamp: number;
  turn: number;
  attacker: string;
  attackerId: string;
  target: string;
  targetId: string;
  damage: number;
  shieldAbsorbed: number;
  remainingHp: number;
  remainingShield: number;
  isCrit: boolean;
  isHit: boolean;
  message: string;
}

export type BuildResultCode =
  | 'SUCCESS'
  | 'ERR_INSUFFICIENT_IRON'
  | 'ERR_INSUFFICIENT_CRYSTAL'
  | 'ERR_INSUFFICIENT_ENERGY'
  | 'ERR_INSUFFICIENT_RESOURCES'
  | 'ERR_FORMATION_FULL'
  | 'ERR_SLOT_OCCUPIED'
  | 'ERR_SHIP_IN_FORMATION'
  | 'ERR_SHIP_NOT_FOUND';

export interface BuildResult {
  success: boolean;
  code: BuildResultCode;
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
  totalDamageDealt: number;
  totalDamageTaken: number;
  duration: number;
  startTimestamp: number;
}

export interface WaveState {
  currentWave: number;
  enemyCount: number;
  hasCruiser: boolean;
  waveMultiplier: number;
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
    description: '轻型快速单位，高命中率低防御，机动性极强',
    cost: { iron: 15, crystal: 10, energy: 5 },
    baseStats: {
      hp: 50,
      maxHp: 50,
      attack: 12,
      defense: 3,
      speed: 8,
      accuracy: 0.9,
      critRate: 0.15,
      weaponPrecision: 1.2,
      shield: { value: 10, maxValue: 10, regenRate: 1 }
    },
    bridgeSlots: 1
  },
  corvette: {
    type: 'corvette',
    name: '护卫舰',
    description: '中型均衡单位，攻防兼备，护盾强度中等',
    cost: { iron: 30, crystal: 20, energy: 15 },
    baseStats: {
      hp: 100,
      maxHp: 100,
      attack: 20,
      defense: 10,
      speed: 5,
      accuracy: 0.8,
      critRate: 0.1,
      weaponPrecision: 1.0,
      shield: { value: 30, maxValue: 30, regenRate: 2 }
    },
    bridgeSlots: 2
  },
  destroyer: {
    type: 'destroyer',
    name: '驱逐舰',
    description: '重型火力单位，高攻击低速度，重型护盾',
    cost: { iron: 50, crystal: 35, energy: 25 },
    baseStats: {
      hp: 150,
      maxHp: 150,
      attack: 35,
      defense: 15,
      speed: 3,
      accuracy: 0.75,
      critRate: 0.12,
      weaponPrecision: 0.9,
      shield: { value: 60, maxValue: 60, regenRate: 3 }
    },
    bridgeSlots: 3
  },
  cruiser: {
    type: 'cruiser',
    name: '巡洋舰',
    description: '旗舰级单位，高血量高火力，最强护盾',
    cost: { iron: 80, crystal: 60, energy: 45 },
    baseStats: {
      hp: 220,
      maxHp: 220,
      attack: 50,
      defense: 25,
      speed: 2,
      accuracy: 0.7,
      critRate: 0.18,
      weaponPrecision: 1.1,
      shield: { value: 100, maxValue: 100, regenRate: 5 }
    },
    bridgeSlots: 4
  }
};

export const GRID_WIDTH = 8;
export const GRID_HEIGHT = 8;
export const MAX_FORMATION_SLOTS = 6;
export const MAX_WEAPON_RANGE = 12;
