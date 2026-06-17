export const MAP_WIDTH = 800;
export const MAP_HEIGHT = 600;
export const GRID_SIZE = 40;
export const COLS = MAP_WIDTH / GRID_SIZE;
export const ROWS = MAP_HEIGHT / GRID_SIZE;

export type TowerType = 'archer' | 'cannon' | 'mage';
export type EnemyType = 'normal' | 'fast' | 'heavy' | 'boss';
export type GameStateType = 'playing' | 'paused' | 'won' | 'lost';

export interface TowerConfig {
  type: TowerType;
  name: string;
  cost: number;
  range: number;
  damage: number;
  attackSpeed: number;
  color: string;
  upgradeCost: number;
  description: string;
}

export const TOWER_CONFIGS: Record<TowerType, TowerConfig> = {
  archer: {
    type: 'archer',
    name: '射手塔',
    cost: 50,
    range: 3,
    damage: 15,
    attackSpeed: 1,
    color: '#00BFFF',
    upgradeCost: 100,
    description: '远程单体攻击',
  },
  cannon: {
    type: 'cannon',
    name: '炮塔',
    cost: 100,
    range: 2,
    damage: 80,
    attackSpeed: 3,
    color: '#FF4500',
    upgradeCost: 100,
    description: '范围爆炸伤害',
  },
  mage: {
    type: 'mage',
    name: '魔法塔',
    cost: 75,
    range: 4,
    damage: 30,
    attackSpeed: 1.5,
    color: '#9B59B6',
    upgradeCost: 100,
    description: '减速魔法攻击',
  },
};

export interface EnemyConfig {
  type: EnemyType;
  hp: number;
  speed: number;
  reward: number;
  color: string;
  radius: number;
}

export const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
  normal: {
    type: 'normal',
    hp: 50,
    speed: 1,
    reward: 10,
    color: '#2ECC71',
    radius: 12,
  },
  fast: {
    type: 'fast',
    hp: 50,
    speed: 2,
    reward: 15,
    color: '#F1C40F',
    radius: 10,
  },
  heavy: {
    type: 'heavy',
    hp: 100,
    speed: 0.5,
    reward: 20,
    color: '#E74C3C',
    radius: 16,
  },
  boss: {
    type: 'boss',
    hp: 500,
    speed: 0.4,
    reward: 50,
    color: '#8E44AD',
    radius: 24,
  },
};

export const PATH_POINTS: { x: number; y: number }[] = [
  { x: -40, y: 300 },
  { x: 200, y: 300 },
  { x: 200, y: 100 },
  { x: 400, y: 100 },
  { x: 400, y: 500 },
  { x: 600, y: 500 },
  { x: 600, y: 300 },
  { x: 840, y: 300 },
];

export const INITIAL_GOLD = 200;
export const INITIAL_LIVES = 5;
export const WAVE_COMPLETE_BONUS = 30;
export const MAX_TOWER_LEVEL = 3;
export const DAMAGE_UPGRADE_MULTIPLIER = 1.5;
export const RANGE_UPGRADE_INCREMENT = 0.5;
export const SLOW_EFFECT_DURATION = 2;
export const SLOW_EFFECT_PERCENT = 0.3;
