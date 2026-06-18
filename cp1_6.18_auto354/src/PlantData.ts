import { v4 as uuidv4 } from 'uuid';

export type PlantElement = 'fire' | 'water' | 'earth' | 'wind' | 'light';
export type PlantType = 'sunflower' | 'peashooter' | 'iceshooter' | 'wallnut' | 'cherrybomb';
export type BugType = 'worker' | 'soldier' | 'queen';
export type TerrainType = 'normal' | 'water' | 'rock';
export type GamePhase = 'placement' | 'playerTurn' | 'enemyTurn' | 'victory' | 'defeat';

export interface Position {
  row: number;
  col: number;
}

export interface PlantConfig {
  type: PlantType;
  name: string;
  element: PlantElement;
  hp: number;
  attack: number;
  range: number;
  radius: number;
  color: string;
  skillCooldown: number;
  skillDescription: string;
  icon: string;
}

export interface BugConfig {
  type: BugType;
  name: string;
  hp: number;
  attack: number;
}

export interface PlantUnit {
  id: string;
  type: PlantType;
  position: Position;
  hp: number;
  maxHp: number;
  attack: number;
  range: number;
  skillCooldown: number;
  currentCooldown: number;
  hasMoved: boolean;
  hasActed: boolean;
}

export interface BugUnit {
  id: string;
  type: BugType;
  position: Position;
  hp: number;
  maxHp: number;
  attack: number;
  slowed: boolean;
  summonCounter: number;
}

export interface Cell {
  position: Position;
  terrain: TerrainType;
  terrainTimer: number;
}

export interface Notification {
  id: string;
  text: string;
  position: Position;
  createdAt: number;
}

export const PLANT_CONFIGS: Record<PlantType, PlantConfig> = {
  sunflower: {
    type: 'sunflower',
    name: '向日葵',
    element: 'light',
    hp: 100,
    attack: 0,
    range: 0,
    radius: 18,
    color: '#FFD600',
    skillCooldown: 0,
    skillDescription: '每回合恢复相邻植物20%生命值',
    icon: '🌻',
  },
  peashooter: {
    type: 'peashooter',
    name: '豌豆射手',
    element: 'earth',
    hp: 100,
    attack: 30,
    range: 3,
    radius: 15,
    color: '#4CAF50',
    skillCooldown: 0,
    skillDescription: '直线攻击射程3格，伤害30',
    icon: '🌱',
  },
  iceshooter: {
    type: 'iceshooter',
    name: '寒冰射手',
    element: 'water',
    hp: 100,
    attack: 15,
    range: 2,
    radius: 15,
    color: '#2196F3',
    skillCooldown: 0,
    skillDescription: '直线攻击射程2格，伤害15，减速50%移动速度1回合',
    icon: '❄️',
  },
  wallnut: {
    type: 'wallnut',
    name: '坚果墙',
    element: 'earth',
    hp: 200,
    attack: 0,
    range: 0,
    radius: 22,
    color: '#795548',
    skillCooldown: 0,
    skillDescription: '高血量防御单位，血量200',
    icon: '🥜',
  },
  cherrybomb: {
    type: 'cherrybomb',
    name: '樱桃炸弹',
    element: 'fire',
    hp: 100,
    attack: 80,
    range: 1,
    radius: 14,
    color: '#F44336',
    skillCooldown: 2,
    skillDescription: '牺牲自身对2x2范围造成80伤害',
    icon: '🍒',
  },
};

export const BUG_CONFIGS: Record<BugType, BugConfig> = {
  worker: {
    type: 'worker',
    name: '工蜂',
    hp: 50,
    attack: 10,
  },
  soldier: {
    type: 'soldier',
    name: '兵蜂',
    hp: 80,
    attack: 25,
  },
  queen: {
    type: 'queen',
    name: '女王蜂',
    hp: 200,
    attack: 15,
  },
};

export function createPlantUnit(type: PlantType, position: Position): PlantUnit {
  const config = PLANT_CONFIGS[type];
  return {
    id: uuidv4(),
    type,
    position: { ...position },
    hp: config.hp,
    maxHp: config.hp,
    attack: config.attack,
    range: config.range,
    skillCooldown: config.skillCooldown,
    currentCooldown: 0,
    hasMoved: false,
    hasActed: false,
  };
}

export function createBugUnit(type: BugType, position: Position): BugUnit {
  const config = BUG_CONFIGS[type];
  return {
    id: uuidv4(),
    type,
    position: { ...position },
    hp: config.hp,
    maxHp: config.hp,
    attack: config.attack,
    slowed: false,
    summonCounter: type === 'queen' ? 0 : -1,
  };
}
