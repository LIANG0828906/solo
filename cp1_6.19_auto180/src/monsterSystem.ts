import type { ElementType, ResistanceTier } from './elixirSystem';

export interface Monster {
  id: string;
  name: string;
  emoji: string;
  maxHp: number;
  currentHp: number;
  resistances: Record<ElementType, ResistanceTier>;
  attackDamage: number;
  wave: number;
}

const MONSTER_POOL: Array<{ name: string; emoji: string }> = [
  { name: '石像鬼', emoji: '🗿' },
  { name: '史莱姆', emoji: '🟢' },
  { name: '哥布林', emoji: '👺' },
  { name: '暗影狼', emoji: '🐺' },
  { name: '骷髅法师', emoji: '💀' },
  { name: '熔岩巨人', emoji: '🗻' },
  { name: '冰原猛犸', emoji: '🦣' },
  { name: '雷霆鹰', emoji: '🦅' },
  { name: '腐木精', emoji: '🌳' },
  { name: '幽灵骑士', emoji: '⚔️' },
  { name: '毒雾蜥蜴', emoji: '🦎' },
  { name: '深渊蝠王', emoji: '🦇' },
  { name: '炎魔领主', emoji: '😈' },
  { name: '寒霜女王', emoji: '👑' },
  { name: '虚空触手', emoji: '🐙' },
];

const ELEMENT_TYPES: ElementType[] = ['fire', 'frost', 'lightning', 'life', 'shadow'];

const TIER_WEIGHTS: Record<number, [number, number, number]> = {
  1: [3, 2, 0],
  2: [2, 2, 1],
  3: [1, 3, 1],
  4: [1, 2, 2],
  5: [0, 2, 3],
};

const TIER_DAMAGE_MULTIPLIER: Record<ResistanceTier, number> = {
  weak: 2.0,
  medium: 1.0,
  strong: 0.5,
};

const randInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const weightedPick = (weights: [number, number, number]): ResistanceTier => {
  const total = weights[0] + weights[1] + weights[2];
  const roll = Math.random() * total;
  if (roll < weights[0]) return 'weak';
  if (roll < weights[0] + weights[1]) return 'medium';
  return 'strong';
};

const BASE_HP_TABLE: Record<number, number> = {
  1: 100,
  2: 150,
  3: 210,
  4: 280,
  5: 360,
};

const BASE_ATTACK_TABLE: Record<number, number> = {
  1: 8,
  2: 12,
  3: 16,
  4: 20,
  5: 26,
};

export const generateMonster = (wave: number): Monster => {
  const safeWave = Math.max(1, Math.min(5, wave));
  const template = MONSTER_POOL[randInt(0, MONSTER_POOL.length - 1)];
  const weights = TIER_WEIGHTS[safeWave];
  const baseHp = BASE_HP_TABLE[safeWave];
  const baseAttack = BASE_ATTACK_TABLE[safeWave];

  const hpVariance = 1 + (Math.random() * 0.2 - 0.1);
  const maxHp = Math.round(baseHp * hpVariance);

  const resistances = {} as Record<ElementType, ResistanceTier>;
  for (const element of ELEMENT_TYPES) {
    resistances[element] = weightedPick(weights);
  }

  const uniqueId = `monster_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  return {
    id: uniqueId,
    name: template.name,
    emoji: template.emoji,
    maxHp,
    currentHp: maxHp,
    resistances,
    attackDamage: baseAttack,
    wave: safeWave,
  };
};

export const applyDamageToMonster = (monster: Monster, damage: number): Monster => {
  const newHp = Math.max(0, monster.currentHp - damage);
  return { ...monster, currentHp: newHp };
};

export const isMonsterDefeated = (monster: Monster): boolean => {
  return monster.currentHp <= 0;
};

export const getResistanceMultiplier = (
  monster: Monster,
  element: ElementType
): number => {
  return TIER_DAMAGE_MULTIPLIER[monster.resistances[element]];
};

export const getResistanceLabelColor = (tier: ResistanceTier): string => {
  switch (tier) {
    case 'weak':
      return '#4CAF50';
    case 'medium':
      return '#FFC107';
    case 'strong':
      return '#F44336';
    default:
      return '#FFC107';
  }
};

export const getResistanceLabelText = (tier: ResistanceTier): string => {
  switch (tier) {
    case 'weak':
      return '弱';
    case 'medium':
      return '中';
    case 'strong':
      return '强';
    default:
      return '中';
  }
};
