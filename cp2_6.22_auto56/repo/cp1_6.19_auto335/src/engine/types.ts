export type CardType = 'attack' | 'defense' | 'heal' | 'buff' | 'debuff';
export type CardRarity = 'common' | 'rare' | 'epic';
export type StatusEffectType = 'poison' | 'freeze' | 'burn' | 'rage';

export interface SkillEffect {
  damage?: number;
  damagePerStack?: number;
  heal?: number;
  healPerStack?: number;
  shield?: number;
  shieldPerStack?: number;
  statusEffect?: StatusEffectType;
  statusDuration?: number;
  lifeDrain?: boolean;
}

export interface Card {
  id: string;
  name: string;
  type: CardType;
  rarity: CardRarity;
  mpCost: number;
  description: string;
  effect: SkillEffect;
  stackType?: StatusEffectType;
}

export interface StatusEffect {
  type: StatusEffectType;
  duration: number;
  stacks: number;
}

export interface Fighter {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  shield: number;
  baseAttack: number;
  attack: number;
  statusEffects: StatusEffect[];
  isFrozen: boolean;
}

export interface FloatingNumber {
  id: string;
  value: number;
  type: 'damage' | 'heal' | 'shield';
  target: 'player' | 'enemy';
  timestamp: number;
}

export interface HistoryPoint {
  turn: number;
  playerValue: number;
  enemyValue: number;
}

export const STATUS_CONFIG: Record<StatusEffectType, { name: string; icon: string; color: string; dotDamage?: number }> = {
  poison: { name: '中毒', icon: '☠️', color: '#AB47BC', dotDamage: 5 },
  freeze: { name: '冰冻', icon: '❄️', color: '#42A5F5' },
  burn: { name: '灼烧', icon: '🔥', color: '#FF7043', dotDamage: 8 },
  rage: { name: '狂暴', icon: '💪', color: '#FFCA28' },
};

export const CARD_DEFINITIONS: Omit<Card, 'id'>[] = [
  {
    name: '火球术',
    type: 'attack',
    rarity: 'rare',
    mpCost: 4,
    description: '造成15+5×灼烧层数伤害，施加灼烧',
    effect: { damage: 15, damagePerStack: 5, statusEffect: 'burn', statusDuration: 2 },
    stackType: 'burn',
  },
  {
    name: '治疗波',
    type: 'heal',
    rarity: 'common',
    mpCost: 3,
    description: '恢复10+3×增益层数HP',
    effect: { heal: 10, healPerStack: 3 },
    stackType: 'rage',
  },
  {
    name: '护盾术',
    type: 'defense',
    rarity: 'common',
    mpCost: 2,
    description: '提供10+2×增益层数护盾',
    effect: { shield: 10, shieldPerStack: 2 },
    stackType: 'rage',
  },
  {
    name: '冰冻陷阱',
    type: 'debuff',
    rarity: 'epic',
    mpCost: 4,
    description: '冰冻对手，跳过下回合行动',
    effect: { statusEffect: 'freeze', statusDuration: 1 },
    stackType: 'freeze',
  },
  {
    name: '狂暴之力',
    type: 'buff',
    rarity: 'rare',
    mpCost: 3,
    description: '攻击力提升50%，持续2回合',
    effect: { statusEffect: 'rage', statusDuration: 2 },
    stackType: 'rage',
  },
  {
    name: '暗影箭',
    type: 'attack',
    rarity: 'common',
    mpCost: 3,
    description: '造成12+4×中毒层数伤害，施加中毒',
    effect: { damage: 12, damagePerStack: 4, statusEffect: 'poison', statusDuration: 3 },
    stackType: 'poison',
  },
  {
    name: '生命汲取',
    type: 'attack',
    rarity: 'epic',
    mpCost: 5,
    description: '造成10+3×减益层数伤害，恢复等量HP',
    effect: { damage: 10, damagePerStack: 3, lifeDrain: true },
    stackType: 'poison',
  },
  {
    name: '旋风斩',
    type: 'attack',
    rarity: 'common',
    mpCost: 2,
    description: '造成10+2×减益层数伤害',
    effect: { damage: 10, damagePerStack: 2 },
    stackType: 'burn',
  },
];

export const RARITY_COLORS: Record<CardRarity, string> = {
  common: '#A5D6A7',
  rare: '#FFD54F',
  epic: '#CE93D8',
};

export const TYPE_COLORS: Record<CardType, string> = {
  attack: '#EF5350',
  heal: '#66BB6A',
  defense: '#42A5F5',
  buff: '#FFCA28',
  debuff: '#AB47BC',
};
