export type CropType = 'firePepper' | 'iceRadish' | 'windWheat';
export type CropStage = 'seed' | 'sprout' | 'growing' | 'mature';
export type CreatureType = 'flameChicken' | 'frostSheep' | 'thunderBird';
export type CreatureAction = 'idle' | 'flapJump' | 'graze' | 'soarCry';
export type EventType = 'acidRain' | 'monsterRaid' | 'harvestWind';
export type ShopItemType = 'seed' | 'fenceUpgrade' | 'defenseTower' | 'flameChicken' | 'frostSheep' | 'thunderBird';

export interface Crop {
  id: string;
  type: CropType;
  stage: CropStage;
  stageEndTime: number;
  gridX: number;
  gridY: number;
  growthMultiplier: number;
}

export interface Creature {
  id: string;
  type: CreatureType;
  penIndex: number;
  lastProduceTime: number;
  currentAction: CreatureAction;
  actionEndTime: number;
  nextActionTime: number;
  produceSpeedMultiplier: number;
}

export interface Monster {
  id: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  targetCropId: string | null;
}

export interface DefenseTower {
  id: string;
  x: number;
  y: number;
  lastShootTime: number;
}

export interface Resources {
  coins: number;
  firePepper: number;
  iceRadish: number;
  windWheat: number;
  flameEgg: number;
  frostWool: number;
  thunderShard: number;
  seeds: number;
}

export interface GameState {
  resources: Resources;
  crops: Crop[];
  creatures: Creature[];
  monsters: Monster[];
  towers: DefenseTower[];
  fenceUpgradeLevel: number;
  activeEvent: EventType | null;
  eventEndTime: number;
  acidRainEndTime: number;
  lastAutoSaveTime: number;
  playerName: string;
  gameOver: boolean;
}

export interface SaveData {
  playerName: string;
  coins: number;
  timestamp: number;
  state: GameState;
}

export interface LeaderboardEntry {
  playerName: string;
  coins: number;
  timestamp: number;
}

export const CROP_CONFIG = {
  firePepper: { name: '火焰椒', color: 0xff4444, glowColor: 0xff6666, harvestAmount: 3, sellPrice: 5, seedColor: 0xcc3333 },
  iceRadish: { name: '冰晶萝卜', color: 0x44aaff, glowColor: 0x66ccff, harvestAmount: 2, sellPrice: 8, seedColor: 0x3388cc },
  windWheat: { name: '风铃麦', color: 0xffdd44, glowColor: 0xffee66, harvestAmount: 5, sellPrice: 3, seedColor: 0xccaa33 },
};

export const CREATURE_CONFIG = {
  flameChicken: { name: '闪焰鸡', color: 0xff7722, produce: 'flameEgg', produceName: '鸡蛋', produceAmount: 1, produceInterval: 20000 },
  frostSheep: { name: '霜角羊', color: 0xaaddff, produce: 'frostWool', produceName: '羊毛', produceAmount: 2, produceInterval: 20000 },
  thunderBird: { name: '鸣雷鸟', color: 0xffff66, produce: 'thunderShard', produceName: '雷电碎片', produceAmount: 1, produceInterval: 20000 },
};

export const SHOP_CONFIG: Record<ShopItemType, { name: string; price: number; description: string }> = {
  seed: { name: '魔法种子', price: 10, description: '可种植魔法作物' },
  fenceUpgrade: { name: '围栏升级', price: 50, description: '生物产出速度+20%' },
  defenseTower: { name: '防御塔', price: 100, description: '自动攻击怪物' },
  flameChicken: { name: '🐔 闪焰鸡', price: 80, description: '每20秒产出1枚鸡蛋' },
  frostSheep: { name: '🐑 霜角羊', price: 120, description: '每20秒产出2份羊毛' },
  thunderBird: { name: '🐦 鸣雷鸟', price: 150, description: '每20秒产出1枚雷电碎片' },
};
