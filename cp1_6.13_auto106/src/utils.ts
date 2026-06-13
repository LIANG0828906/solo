import { CONFIG } from './types';

export class SeededRandom {
  private seed: number;

  constructor(seed?: number) {
    this.seed = seed ?? Date.now();
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  pick<T>(array: T[]): T {
    return array[this.nextInt(0, array.length - 1)]!;
  }

  chance(probability: number): boolean {
    return this.next() < probability;
  }
}

export const globalRandom = new SeededRandom();

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function getHpGradientColor(hp: number, maxHp: number): string {
  const ratio = Math.max(0, Math.min(1, hp / maxHp));
  const r = Math.floor(255 * (1 - ratio) + 139 * ratio);
  const g = Math.floor(0 * (1 - ratio) + 195 * ratio);
  const b = Math.floor(0 * (1 - ratio) + 74 * ratio);
  return `rgb(${r}, ${g}, ${b})`;
}

export const WEAPON_NAMES = [
  '铁剑', '钢剑', '秘银剑', '精金剑', '龙牙剑',
  '战斧', '战锤', '长矛', '匕首', '法杖'
];

export const ARMOR_NAMES = [
  '皮甲', '锁子甲', '板甲', '秘银甲', '龙鳞甲',
  '法袍', '皮靴', '护腕', '头盔', '盾牌'
];

export const MONSTER_NAMES = [
  '哥布林', '骷髅兵', '史莱姆', '蝙蝠', '狼人',
  '石像鬼', '巨魔', '幽灵', '兽人', '蜥蜴人'
];

export const WEAPON_COLORS = ['#C0C0C0', '#FFD700', '#00BFFF', '#FF4500', '#9932CC', '#32CD32'];
export const ARMOR_COLORS = ['#8B4513', '#4682B4', '#9370DB', '#20B2AA', '#CD853F', '#708090'];
export const MONSTER_COLORS = ['#228B22', '#808080', '#00CED1', '#4B0082', '#8B0000', '#556B2F'];

export function generateWeapon(rng: SeededRandom): { name: string; bonus: number; color: string } {
  return {
    name: rng.pick(WEAPON_NAMES),
    bonus: rng.nextInt(5, 15),
    color: rng.pick(WEAPON_COLORS)
  };
}

export function generateArmor(rng: SeededRandom): { name: string; bonus: number; color: string } {
  return {
    name: rng.pick(ARMOR_NAMES),
    bonus: rng.nextInt(3, 8),
    color: rng.pick(ARMOR_COLORS)
  };
}

export function generateMonster(rng: SeededRandom, floor: number): {
  name: string;
  hp: number;
  attack: number;
  defense: number;
  color: string;
} {
  const baseHp = rng.nextInt(20, 50);
  const baseAttack = rng.nextInt(5, 12);
  const baseDefense = rng.nextInt(2, 6);
  const multiplier = 1 + (floor - 1) * 0.3;

  return {
    name: rng.pick(MONSTER_NAMES),
    hp: Math.floor(baseHp * multiplier),
    attack: Math.floor(baseAttack * multiplier),
    defense: Math.floor(baseDefense * multiplier),
    color: rng.pick(MONSTER_COLORS)
  };
}
