export type TowerType = 'machine' | 'laser' | 'cannon';
export type EnemyType = 'normal' | 'fast' | 'heavy';
export type ParticleType = 'spark' | 'debris' | 'explosion';
export type WaveState = 'countdown' | 'spawning' | 'active' | 'waiting' | 'complete' | 'gameover' | 'victory';

export interface Position {
  x: number;
  y: number;
}

export interface TowerConfig {
  type: TowerType;
  name: string;
  description: string;
  damage: number;
  range: number;
  fireRate: number;
  cost: number;
  color: string;
  accentColor: string;
  bulletSpeed: number;
  isPiercing: boolean;
  splashRadius: number;
}

export interface EnemyConfig {
  type: EnemyType;
  name: string;
  health: number;
  speed: number;
  gold: number;
  color: string;
}

export interface ParticleData {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  type: ParticleType;
  color: string;
  size: number;
}

export interface BulletData {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  speed: number;
  towerType: TowerType;
  isPiercing: boolean;
  splashRadius: number;
  hitEnemies: Set<number>;
  life: number;
}

export const GRID_WIDTH = 20;
export const GRID_HEIGHT = 15;
export const CELL_SIZE = 32;
export const CANVAS_WIDTH = GRID_WIDTH * CELL_SIZE;
export const CANVAS_HEIGHT = GRID_HEIGHT * CELL_SIZE;
export const TOTAL_WAVES = 5;
export const WAVE_INTERVAL = 5000;
export const COUNTDOWN_TIME = 3000;
export const MAX_ENEMIES = 30;
export const MAX_PARTICLES = 200;
export const INITIAL_GOLD = 200;
export const INITIAL_LIVES = 20;
export const MAX_TOWER_LEVEL = 3;

export const PATH_POINTS: Position[] = [
  { x: -1, y: 7 },
  { x: 4, y: 7 },
  { x: 4, y: 3 },
  { x: 10, y: 3 },
  { x: 10, y: 11 },
  { x: 15, y: 11 },
  { x: 15, y: 7 },
  { x: 20, y: 7 }
];

export const TOWER_CONFIGS: Record<TowerType, TowerConfig> = {
  machine: {
    type: 'machine',
    name: '机枪塔',
    description: '射速快，伤害低，适合对付大量敌人',
    damage: 10,
    range: 120,
    fireRate: 200,
    cost: 50,
    color: '#8B8B8B',
    accentColor: '#FFD700',
    bulletSpeed: 8,
    isPiercing: false,
    splashRadius: 0
  },
  laser: {
    type: 'laser',
    name: '激光塔',
    description: '穿透攻击，伤害中等，可同时伤害多个敌人',
    damage: 25,
    range: 150,
    fireRate: 800,
    cost: 100,
    color: '#4A90D9',
    accentColor: '#00FFFF',
    bulletSpeed: 15,
    isPiercing: true,
    splashRadius: 0
  },
  cannon: {
    type: 'cannon',
    name: '炮塔',
    description: '范围伤害，攻速慢，适合对付密集敌人',
    damage: 40,
    range: 100,
    fireRate: 1500,
    cost: 150,
    color: '#8B4513',
    accentColor: '#FF6600',
    bulletSpeed: 6,
    isPiercing: false,
    splashRadius: 40
  }
};

export const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
  normal: {
    type: 'normal',
    name: '普通敌人',
    health: 100,
    speed: 0.5,
    gold: 10,
    color: '#3a7a2a'
  },
  fast: {
    type: 'fast',
    name: '快速敌人',
    health: 50,
    speed: 1.0,
    gold: 15,
    color: '#4A90D9'
  },
  heavy: {
    type: 'heavy',
    name: '重甲敌人',
    health: 300,
    speed: 0.25,
    gold: 25,
    color: '#D94A4A'
  }
};

export const WAVE_ENEMY_COUNTS: Array<Array<{ type: EnemyType; count: number }>> = [
  [{ type: 'normal', count: 8 }],
  [{ type: 'normal', count: 10 }, { type: 'fast', count: 4 }],
  [{ type: 'normal', count: 12 }, { type: 'fast', count: 6 }, { type: 'heavy', count: 2 }],
  [{ type: 'normal', count: 15 }, { type: 'fast', count: 8 }, { type: 'heavy', count: 4 }],
  [{ type: 'normal', count: 20 }, { type: 'fast', count: 12 }, { type: 'heavy', count: 6 }]
];

export const COLORS = {
  DARK_BROWN: '#2a1a0a',
  GRASS_GREEN: '#3a7a2a',
  EARTH_YELLOW: '#d4a843',
  DARK_GREEN: '#2d5a1e',
  LIGHT_GREEN: '#3d7a2e',
  PATH_BROWN: '#8B6914',
  PATH_BORDER: '#5C4A0A',
  BLACK: '#000000',
  WHITE: '#FFFFFF',
  GOLD: '#FFD700',
  RED: '#FF4444',
  HEART_RED: '#FF6B6B'
};
