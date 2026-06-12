export interface Position {
  x: number;
  y: number;
}

export type BuildingType = 'wall_wood' | 'wall_stone' | 'wall_reinforced' | 'tower' | 'gate' | 'barracks';

export type UnitType = 'soldier' | 'infantry' | 'battering_ram' | 'siege_ladder';

export type ProjectileType = 'arrow' | 'stone' | 'fire_jar';

export type GamePhase = 'building' | 'combat' | 'ended';

export interface Building {
  id: string;
  type: BuildingType;
  position: Position;
  durability: number;
  maxDurability: number;
  level: number;
  isOpen?: boolean;
  attackCooldown?: number;
  productionProgress?: number;
}

export interface Unit {
  id: string;
  type: UnitType;
  position: Position;
  health: number;
  maxHealth: number;
  morale: number;
  speed: number;
  attack: number;
  isEnemy: boolean;
  targetPosition?: Position;
  moveProgress: number;
  path?: Position[];
  pathIndex?: number;
  attackCooldown?: number;
  hasLadder?: boolean;
}

export interface Projectile {
  id: string;
  type: ProjectileType;
  startPos: Position;
  endPos: Position;
  currentPos: Position;
  progress: number;
  speed: number;
  damage: number;
  arcHeight: number;
  trail: Particle[];
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'trail' | 'explosion' | 'debris' | 'fire';
}

export interface Resources {
  wood: number;
  stone: number;
  gold: number;
}

export interface BuildingConfig {
  type: BuildingType;
  name: string;
  cost: Resources;
  durability: number;
  attackRange?: number;
  attackDamage?: number;
  description: string;
}

export interface UnitConfig {
  type: UnitType;
  name: string;
  health: number;
  speed: number;
  attack: number;
  morale: number;
}

export interface GameState {
  turn: number;
  phase: GamePhase;
  gridSize: number;
  buildings: Building[];
  units: Unit[];
  projectiles: Projectile[];
  particles: Particle[];
  resources: Resources;
  selectedUnitId: string | null;
  selectedBuildingId: string | null;
  selectedBuildType: BuildingType | null;
  score: number;
  enemiesKilled: number;
  soldiersProduced: number;
  maxSoldiers: number;
  gameResult: 'victory' | 'defeat' | null;
  turnHistory: TurnSnapshot[];
}

export interface TurnSnapshot {
  turn: number;
  buildings: Building[];
  units: Unit[];
  resources: Resources;
  enemiesKilled: number;
  score: number;
}

export const BUILDING_CONFIGS: Record<BuildingType, BuildingConfig> = {
  wall_wood: {
    type: 'wall_wood',
    name: '木栅栏',
    cost: { wood: 10, stone: 0, gold: 0 },
    durability: 50,
    description: '基础防御，耐久度50',
  },
  wall_stone: {
    type: 'wall_stone',
    name: '石墙',
    cost: { wood: 5, stone: 15, gold: 0 },
    durability: 100,
    description: '坚固石墙，耐久度100',
  },
  wall_reinforced: {
    type: 'wall_reinforced',
    name: '强化石墙',
    cost: { wood: 10, stone: 25, gold: 5 },
    durability: 200,
    description: '最强防御，耐久度200',
  },
  tower: {
    type: 'tower',
    name: '箭塔',
    cost: { wood: 20, stone: 10, gold: 5 },
    durability: 80,
    attackRange: 4,
    attackDamage: 15,
    description: '攻击范围2-4格，每回合射击一次',
  },
  gate: {
    type: 'gate',
    name: '城门',
    cost: { wood: 15, stone: 10, gold: 0 },
    durability: 150,
    description: '可开关，允许己方单位进出',
  },
  barracks: {
    type: 'barracks',
    name: '兵营',
    cost: { wood: 25, stone: 15, gold: 10 },
    durability: 120,
    description: '每回合生产2名士兵，上限20名',
  },
};

export const UNIT_CONFIGS: Record<UnitType, UnitConfig> = {
  soldier: {
    type: 'soldier',
    name: '士兵',
    health: 50,
    speed: 2,
    attack: 10,
    morale: 100,
  },
  infantry: {
    type: 'infantry',
    name: '敌方步兵',
    health: 40,
    speed: 1.5,
    attack: 8,
    morale: 80,
  },
  battering_ram: {
    type: 'battering_ram',
    name: '冲车',
    health: 100,
    speed: 0.8,
    attack: 30,
    morale: 100,
  },
  siege_ladder: {
    type: 'siege_ladder',
    name: '云梯',
    health: 60,
    speed: 1,
    attack: 5,
    morale: 90,
  },
};

export const GRID_SIZE = 10;
export const MAX_PARTICLES = 500;
export const INITIAL_RESOURCES: Resources = { wood: 100, stone: 100, gold: 100 };
export const RESOURCE_GROWTH: Resources = { wood: 5, stone: 5, gold: 5 };
