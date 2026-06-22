export const TILE_SIZE = 64;
export const MAP_WIDTH = 16;
export const MAP_HEIGHT = 10;
export const SIDEBAR_WIDTH = 220;

export const COLORS = {
  BACKGROUND: 0x121830,
  GRID_LINE: 0x3A5F8A,
  PATH: 0x7DD3FC,
  TOWER_ARROW: 0x94A3B8,
  TOWER_FROST: 0x67E8F9,
  TOWER_FIRE: 0xFB923C,
  TOWER_ELECTRIC: 0xA78BFA,
  UI_PRIMARY: 0x7DD3FC,
  UI_SECONDARY: 0xA78BFA,
  DAMAGE: 0xEF4444,
  HEAL: 0x22C55E,
  GOLD: 0xFBBF24,
  PLACE_VALID: 0x22C55E,
  PLACE_INVALID: 0xEF4444,
};

export type TowerType = 'arrow' | 'frost' | 'fire' | 'electric';

export interface TowerConfig {
  type: TowerType;
  name: string;
  cost: number;
  damage: number;
  range: number;
  fireRate: number;
  color: number;
  projectileSpeed: number;
  description: string;
}

export const TOWER_CONFIGS: Record<TowerType, TowerConfig> = {
  arrow: {
    type: 'arrow',
    name: '箭塔',
    cost: 50,
    damage: 15,
    range: 180,
    fireRate: 800,
    color: COLORS.TOWER_ARROW,
    projectileSpeed: 600,
    description: '基础防御塔，攻速快'
  },
  frost: {
    type: 'frost',
    name: '冰霜塔',
    cost: 80,
    damage: 10,
    range: 160,
    fireRate: 1200,
    color: COLORS.TOWER_FROST,
    projectileSpeed: 500,
    description: '减速敌人移动速度'
  },
  fire: {
    type: 'fire',
    name: '火焰塔',
    cost: 100,
    damage: 35,
    range: 140,
    fireRate: 1500,
    color: COLORS.TOWER_FIRE,
    projectileSpeed: 450,
    description: '造成灼烧持续伤害'
  },
  electric: {
    type: 'electric',
    name: '电击塔',
    cost: 120,
    damage: 25,
    range: 200,
    fireRate: 1000,
    color: COLORS.TOWER_ELECTRIC,
    projectileSpeed: 700,
    description: '攻击可链式跳跃'
  }
};

export type EnemyType = 'grunt' | 'fast' | 'tank' | 'boss';

export interface EnemyConfig {
  type: EnemyType;
  name: string;
  health: number;
  speed: number;
  reward: number;
  color: number;
  size: number;
}

export const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
  grunt: { type: 'grunt', name: '步兵', health: 60, speed: 50, reward: 10, color: 0x64748B, size: 16 },
  fast: { type: 'fast', name: '疾行者', health: 40, speed: 100, reward: 15, color: 0x22D3EE, size: 12 },
  tank: { type: 'tank', name: '重甲', health: 200, speed: 30, reward: 25, color: 0x92400E, size: 22 },
  boss: { type: 'boss', name: 'Boss', health: 500, speed: 25, reward: 100, color: 0x7C3AED, size: 28 }
};

export type RuneType = 'slow' | 'splash' | 'burn' | 'critical' | 'range' | 'speed';

export interface RuneConfig {
  type: RuneType;
  name: string;
  description: string;
  color: number;
  dropChance: number;
  effect: number;
}

export const RUNE_CONFIGS: Record<RuneType, RuneConfig> = {
  slow: { type: 'slow', name: '减速符文', description: '攻击附带30%减速', color: 0x67E8F9, dropChance: 0.25, effect: 0.3 },
  splash: { type: 'splash', name: '溅射符文', description: '造成范围伤害', color: 0xFB923C, dropChance: 0.2, effect: 60 },
  burn: { type: 'burn', name: '灼烧符文', description: '持续灼烧伤害', color: 0xEF4444, dropChance: 0.2, effect: 5 },
  critical: { type: 'critical', name: '暴击符文', description: '20%概率双倍伤害', color: 0xFBBF24, dropChance: 0.15, effect: 2 },
  range: { type: 'range', name: '射程符文', description: '增加20%攻击范围', color: 0x22C55E, dropChance: 0.1, effect: 0.2 },
  speed: { type: 'speed', name: '攻速符文', description: '增加25%攻击速度', color: 0xA78BFA, dropChance: 0.1, effect: 0.25 }
};

export interface Rune {
  id: string;
  type: RuneType;
  name: string;
  description: string;
  color: number;
  effect: number;
}

export interface TowerData {
  id: string;
  type: TowerType;
  gridX: number;
  gridY: number;
  level: number;
  runeSlots: (Rune | null)[];
}

export interface EnemyData {
  id: string;
  type: EnemyType;
  health: number;
  maxHealth: number;
  x: number;
  y: number;
  pathIndex: number;
  slowEffect: number;
  burnDamage: number;
}

export interface ProjectileData {
  id: string;
  x: number;
  y: number;
  targetId: string;
  damage: number;
  speed: number;
  towerType: TowerType;
  runes: Rune[];
}

export interface WaveConfig {
  enemies: { type: EnemyType; count: number; delay: number }[];
}

export const WAVES: WaveConfig[] = [
  { enemies: [{ type: 'grunt', count: 5, delay: 1000 }] },
  { enemies: [{ type: 'grunt', count: 8, delay: 800 }, { type: 'fast', count: 3, delay: 600 }] },
  { enemies: [{ type: 'grunt', count: 10, delay: 700 }, { type: 'fast', count: 5, delay: 500 }] },
  { enemies: [{ type: 'tank', count: 3, delay: 2000 }, { type: 'grunt', count: 8, delay: 800 }] },
  { enemies: [{ type: 'boss', count: 1, delay: 0 }, { type: 'grunt', count: 10, delay: 600 }] }
];

export const PATH_POINTS: { x: number; y: number }[] = [
  { x: MAP_WIDTH * TILE_SIZE + SIDEBAR_WIDTH + 50, y: 5 * TILE_SIZE + TILE_SIZE / 2 },
  { x: 12 * TILE_SIZE + SIDEBAR_WIDTH + TILE_SIZE / 2, y: 5 * TILE_SIZE + TILE_SIZE / 2 },
  { x: 12 * TILE_SIZE + SIDEBAR_WIDTH + TILE_SIZE / 2, y: 2 * TILE_SIZE + TILE_SIZE / 2 },
  { x: 6 * TILE_SIZE + SIDEBAR_WIDTH + TILE_SIZE / 2, y: 2 * TILE_SIZE + TILE_SIZE / 2 },
  { x: 6 * TILE_SIZE + SIDEBAR_WIDTH + TILE_SIZE / 2, y: 7 * TILE_SIZE + TILE_SIZE / 2 },
  { x: 2 * TILE_SIZE + SIDEBAR_WIDTH + TILE_SIZE / 2, y: 7 * TILE_SIZE + TILE_SIZE / 2 },
  { x: 2 * TILE_SIZE + SIDEBAR_WIDTH + TILE_SIZE / 2, y: 4 * TILE_SIZE + TILE_SIZE / 2 },
  { x: SIDEBAR_WIDTH - 30, y: 4 * TILE_SIZE + TILE_SIZE / 2 }
];
