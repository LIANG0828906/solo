import { Point, CELL_SIZE } from './map';

export type TowerType = 'arrow' | 'magic' | 'ice' | 'cannon' | 'heal';

export interface TowerStats {
  damage: number;
  range: number;
  attackSpeed: number;
  special?: string;
  color: string;
}

export interface Tower {
  id: number;
  type: TowerType;
  gridX: number;
  gridY: number;
  level: 1 | 2 | 3;
  stats: TowerStats;
  placementAnim: number;
  upgradeFlash: number;
  lastAttackTime: number;
  targetId: number | null;
  healAnim: number;
}

export interface TowerConfig {
  basePrice: number;
  baseStats: TowerStats;
  name: string;
}

export const TOWER_CONFIGS: Record<TowerType, TowerConfig> = {
  arrow: {
    basePrice: 100,
    name: '箭塔',
    baseStats: { damage: 15, range: 4, attackSpeed: 1.2, color: '#f39c12' }
  },
  magic: {
    basePrice: 200,
    name: '魔法塔',
    baseStats: { damage: 25, range: 3.5, attackSpeed: 0.8, color: '#9b59b6' }
  },
  ice: {
    basePrice: 200,
    name: '冰冻塔',
    baseStats: { damage: 8, range: 3, attackSpeed: 1.0, special: 'slow', color: '#3498db' }
  },
  cannon: {
    basePrice: 300,
    name: '火炮塔',
    baseStats: { damage: 50, range: 3, attackSpeed: 0.5, special: 'aoe', color: '#e74c3c' }
  },
  heal: {
    basePrice: 150,
    name: '治疗塔',
    baseStats: { damage: 0, range: 4, attackSpeed: 0.5, special: 'heal', color: '#2ecc71' }
  }
};

export const TOWER_ORDER: TowerType[] = ['arrow', 'magic', 'ice', 'cannon', 'heal'];

let nextTowerId = 1;

export function getUpgradePrice(type: TowerType, currentLevel: number): number | null {
  if (currentLevel >= 3) return null;
  const base = TOWER_CONFIGS[type].basePrice;
  if (currentLevel === 1) return Math.floor(base * 0.5);
  if (currentLevel === 2) return base;
  return null;
}

export function createTower(type: TowerType, gridX: number, gridY: number): Tower {
  const config = TOWER_CONFIGS[type];
  return {
    id: nextTowerId++,
    type,
    gridX,
    gridY,
    level: 1,
    stats: { ...config.baseStats },
    placementAnim: 0,
    upgradeFlash: 0,
    lastAttackTime: 0,
    targetId: null,
    healAnim: 0
  };
}

export function upgradeTower(tower: Tower): void {
  if (tower.level >= 3) return;
  tower.level = (tower.level + 1) as 1 | 2 | 3;
  const multiplier = 1 + (tower.level - 1) * 0.6;
  tower.stats.damage = Math.floor(TOWER_CONFIGS[tower.type].baseStats.damage * multiplier);
  tower.stats.range = TOWER_CONFIGS[tower.type].baseStats.range * (1 + (tower.level - 1) * 0.15);
  tower.stats.attackSpeed = TOWER_CONFIGS[tower.type].baseStats.attackSpeed * (1 + (tower.level - 1) * 0.2);
  tower.upgradeFlash = 0.5;
}

export function distance(ax: number, ay: number, bx: number, by: number): number {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

export function getTowerCenter(tower: Tower): Point {
  return {
    x: tower.gridX * CELL_SIZE + CELL_SIZE / 2,
    y: tower.gridY * CELL_SIZE + CELL_SIZE / 2
  };
}

export interface Target {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
}

export function findTarget(tower: Tower, targets: Target[]): Target | null {
  const center = getTowerCenter(tower);
  const rangePx = tower.stats.range * CELL_SIZE;
  let closest: Target | null = null;
  let closestDist = Infinity;
  for (const t of targets) {
    const d = distance(center.x, center.y, t.x, t.y);
    if (d <= rangePx && d < closestDist) {
      closest = t;
      closestDist = d;
    }
  }
  return closest;
}

export function updateTowerAnimations(tower: Tower, dt: number): void {
  if (tower.placementAnim < 1) {
    tower.placementAnim = Math.min(1, tower.placementAnim + dt / 0.3);
  }
  if (tower.upgradeFlash > 0) {
    tower.upgradeFlash = Math.max(0, tower.upgradeFlash - dt);
  }
  if (tower.healAnim > 0) {
    tower.healAnim = Math.max(0, tower.healAnim - dt);
  }
}
