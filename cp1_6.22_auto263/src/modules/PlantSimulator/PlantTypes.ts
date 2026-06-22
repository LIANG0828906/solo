export enum PlantCategory {
  ATTACK = 'attack',
  DEFENSE = 'defense',
  SUPPORT = 'support',
}

export enum PlantType {
  PEA_SHOOTER = 'pea_shooter',
  CHERRY_BOMB = 'cherry_bomb',
  ICE_SHOOTER = 'ice_shooter',
  SUNFLOWER = 'sunflower',
}

export interface GrowthParams {
  initialAttack: number;
  attackGrowth: number;
  initialRange: number;
  rangeGrowth: number;
  growthDuration: number;
}

export interface PlantInstance {
  id: string;
  type: PlantType;
  category: PlantCategory;
  gridX: number;
  gridY: number;
  params: GrowthParams;
  currentAttack: number;
  currentRange: number;
  growthProgress: number;
  lastAttackTime: number;
  attackCooldown: number;
  playerId?: number;
}

export interface Preset {
  id: string;
  name: string;
  createdAt: number;
  plantConfigs: Record<PlantType, GrowthParams>;
}

export interface Enemy {
  id: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  pathIndex: number;
  pathPointIndex: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  targetId: string;
  damage: number;
  speed: number;
  color: string;
  playerSide?: number;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  createdAt: number;
  duration: number;
}

export enum GameMode {
  SINGLE = 'single',
  COMPARE = 'compare',
  DUEL = 'duel',
}

export interface LogEntry {
  timestamp: string;
  message: string;
}

export interface PlayerSelection {
  selectedPlantType: PlantType;
  selectedGridX: number;
  selectedGridY: number;
}

export interface PlantInfo {
  name: string;
  category: PlantCategory;
  color: string;
  defaultParams: GrowthParams;
  attackCooldown: number;
}

export const PLANT_INFO: Record<PlantType, PlantInfo> = {
  [PlantType.PEA_SHOOTER]: {
    name: '豌豆射手',
    category: PlantCategory.ATTACK,
    color: '#22C55E',
    defaultParams: {
      initialAttack: 20,
      attackGrowth: 10,
      initialRange: 4,
      rangeGrowth: 1,
      growthDuration: 10,
    },
    attackCooldown: 1500,
  },
  [PlantType.CHERRY_BOMB]: {
    name: '樱桃炸弹',
    category: PlantCategory.ATTACK,
    color: '#EF4444',
    defaultParams: {
      initialAttack: 50,
      attackGrowth: 30,
      initialRange: 2,
      rangeGrowth: 0,
      growthDuration: 15,
    },
    attackCooldown: 5000,
  },
  [PlantType.ICE_SHOOTER]: {
    name: '寒冰射手',
    category: PlantCategory.DEFENSE,
    color: '#3B82F6',
    defaultParams: {
      initialAttack: 15,
      attackGrowth: 8,
      initialRange: 5,
      rangeGrowth: 1,
      growthDuration: 12,
    },
    attackCooldown: 2000,
  },
  [PlantType.SUNFLOWER]: {
    name: '向日葵',
    category: PlantCategory.SUPPORT,
    color: '#F59E0B',
    defaultParams: {
      initialAttack: 5,
      attackGrowth: 3,
      initialRange: 3,
      rangeGrowth: 0,
      growthDuration: 8,
    },
    attackCooldown: 3000,
  },
};

export const CATEGORY_COLORS: Record<PlantCategory, string> = {
  [PlantCategory.ATTACK]: '#EF4444',
  [PlantCategory.DEFENSE]: '#3B82F6',
  [PlantCategory.SUPPORT]: '#10B981',
};
