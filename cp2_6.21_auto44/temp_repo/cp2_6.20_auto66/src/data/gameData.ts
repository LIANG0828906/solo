import type { CharacterClass, Item, Enemy, Attributes, Skill } from '../types';

export const CLASS_DATA: Record<CharacterClass, {
  name: string;
  description: string;
  baseAttributes: Attributes;
  baseHealth: number;
  baseMana: number;
  icon: string;
}> = {
  warrior: {
    name: '战士',
    description: '精通近战格斗的勇士，拥有高生命值和防御力。',
    baseAttributes: {
      strength: 16,
      dexterity: 12,
      constitution: 14,
      intelligence: 8,
      wisdom: 10,
      charisma: 10,
    },
    baseHealth: 120,
    baseMana: 20,
    icon: '⚔️',
  },
  mage: {
    name: '法师',
    description: '掌握奥术魔法的使用者，拥有强大的法术伤害但体质较弱。',
    baseAttributes: {
      strength: 8,
      dexterity: 12,
      constitution: 10,
      intelligence: 16,
      wisdom: 14,
      charisma: 10,
    },
    baseHealth: 60,
    baseMana: 100,
    icon: '🔮',
  },
  rogue: {
    name: '盗贼',
    description: '敏捷的暗影行者，擅长潜行和暴击。',
    baseAttributes: {
      strength: 10,
      dexterity: 16,
      constitution: 12,
      intelligence: 12,
      wisdom: 10,
      charisma: 10,
    },
    baseHealth: 80,
    baseMana: 40,
    icon: '🗡️',
  },
  cleric: {
    name: '牧师',
    description: '神圣力量的信徒，能够治疗和祝福队友。',
    baseAttributes: {
      strength: 12,
      dexterity: 10,
      constitution: 12,
      intelligence: 10,
      wisdom: 16,
      charisma: 10,
    },
    baseHealth: 90,
    baseMana: 80,
    icon: '✨',
  },
};

export const SKILL_TREES: Record<CharacterClass, Skill[]> = {
  warrior: [
    { id: 'w1', name: '强力打击', description: '造成额外25%伤害', cost: 1, unlocked: false },
    { id: 'w2', name: '坚韧', description: '生命值上限+20', cost: 1, unlocked: false },
    { id: 'w3', name: '战斗姿态', description: '防御力+5', cost: 2, unlocked: false },
    { id: 'w4', name: '狂暴', description: '力量+3', cost: 2, unlocked: false },
    { id: 'w5', name: '战神降临', description: '暴击率+15%', cost: 3, unlocked: false },
  ],
  mage: [
    { id: 'm1', name: '魔法飞弹', description: '基础法术伤害+10', cost: 1, unlocked: false },
    { id: 'm2', name: '魔力涌动', description: '法力值上限+20', cost: 1, unlocked: false },
    { id: 'm3', name: '奥术专注', description: '智力+3', cost: 2, unlocked: false },
    { id: 'm4', name: '法术穿透', description: '忽略20%魔法抗性', cost: 2, unlocked: false },
    { id: 'm5', name: '元素大师', description: '法术暴击率+20%', cost: 3, unlocked: false },
  ],
  rogue: [
    { id: 'r1', name: '精准打击', description: '暴击伤害+50%', cost: 1, unlocked: false },
    { id: 'r2', name: '灵巧', description: '敏捷+2', cost: 1, unlocked: false },
    { id: 'r3', name: '潜行', description: '闪避率+10%', cost: 2, unlocked: false },
    { id: 'r4', name: '背刺', description: '从背后攻击造成双倍伤害', cost: 2, unlocked: false },
    { id: 'r5', name: '暗影大师', description: '暴击率+25%', cost: 3, unlocked: false },
  ],
  cleric: [
    { id: 'c1', name: '治愈之光', description: '治疗量+25%', cost: 1, unlocked: false },
    { id: 'c2', name: '神圣护盾', description: '防御力+3', cost: 1, unlocked: false },
    { id: 'c3', name: '智慧祝福', description: '全属性+1', cost: 2, unlocked: false },
    { id: 'c4', name: '神圣打击', description: '攻击附加神圣伤害', cost: 2, unlocked: false },
    { id: 'c5', name: '神圣化身', description: '治疗和伤害+50%', cost: 3, unlocked: false },
  ],
};

export const STARTER_ITEMS: Item[] = [
  {
    id: 'starter-sword',
    name: '铁剑',
    description: '一把普通的铁剑。',
    icon: '⚔️',
    type: 'weapon',
    slot: 'weapon',
    attributes: { strength: 2 },
    effects: { damage: 5 },
  },
  {
    id: 'starter-armor',
    name: '皮甲',
    description: '轻便的皮制护甲。',
    icon: '🛡️',
    type: 'armor',
    slot: 'body',
    attributes: { constitution: 1 },
    effects: { defense: 3 },
  },
  {
    id: 'health-potion-1',
    name: '小型生命药水',
    description: '恢复30点生命值。',
    icon: '🧪',
    type: 'consumable',
    effects: { health: 30 },
    quantity: 3,
  },
  {
    id: 'mana-potion-1',
    name: '小型法力药水',
    description: '恢复20点法力值。',
    icon: '💧',
    type: 'consumable',
    effects: { mana: 20 },
    quantity: 2,
  },
];

export const ENEMY_TEMPLATES: Omit<Enemy, 'id' | 'currentHealth'>[] = [
  {
    name: '哥布林',
    maxHealth: 30,
    damage: 6,
    defense: 2,
    experienceReward: 20,
    lootTable: [
      { itemId: 'health-potion-1', chance: 0.3 },
      { itemId: 'gold-sack-small', chance: 0.5 },
    ],
    icon: '👺',
  },
  {
    name: '骷髅兵',
    maxHealth: 40,
    damage: 8,
    defense: 3,
    experienceReward: 30,
    lootTable: [
      { itemId: 'mana-potion-1', chance: 0.2 },
      { itemId: 'gold-sack-small', chance: 0.6 },
    ],
    icon: '💀',
  },
  {
    name: '巨型蜘蛛',
    maxHealth: 25,
    damage: 10,
    defense: 1,
    experienceReward: 25,
    lootTable: [
      { itemId: 'spider-silk', chance: 0.4 },
      { itemId: 'gold-sack-small', chance: 0.3 },
    ],
    icon: '🕷️',
  },
  {
    name: '兽人战士',
    maxHealth: 60,
    damage: 12,
    defense: 5,
    experienceReward: 50,
    lootTable: [
      { itemId: 'health-potion-1', chance: 0.4 },
      { itemId: 'gold-sack-medium', chance: 0.5 },
    ],
    icon: '👹',
  },
  {
    name: '暗影刺客',
    maxHealth: 45,
    damage: 15,
    defense: 2,
    experienceReward: 60,
    lootTable: [
      { itemId: 'dagger-sharp', chance: 0.2 },
      { itemId: 'gold-sack-medium', chance: 0.6 },
    ],
    icon: '🥷',
  },
];

export const BOSS_TEMPLATES: Omit<Enemy, 'id' | 'currentHealth'>[] = [
  {
    name: '地牢守护者',
    maxHealth: 200,
    damage: 20,
    defense: 8,
    experienceReward: 200,
    lootTable: [
      { itemId: 'gold-sack-large', chance: 1.0 },
      { itemId: 'rare-weapon-random', chance: 0.5 },
    ],
    icon: '👑',
  },
];

export const LOOT_ITEMS: Record<string, Item> = {
  'health-potion-1': {
    id: 'health-potion-1',
    name: '小型生命药水',
    description: '恢复30点生命值。',
    icon: '🧪',
    type: 'consumable',
    effects: { health: 30 },
  },
  'mana-potion-1': {
    id: 'mana-potion-1',
    name: '小型法力药水',
    description: '恢复20点法力值。',
    icon: '💧',
    type: 'consumable',
    effects: { mana: 20 },
  },
  'gold-sack-small': {
    id: 'gold-sack-small',
    name: '小袋金币',
    description: '装有10-30枚金币。',
    icon: '💰',
    type: 'misc',
  },
  'gold-sack-medium': {
    id: 'gold-sack-medium',
    name: '中袋金币',
    description: '装有30-60枚金币。',
    icon: '💰',
    type: 'misc',
  },
  'gold-sack-large': {
    id: 'gold-sack-large',
    name: '大袋金币',
    description: '装有80-150枚金币。',
    icon: '💰',
    type: 'misc',
  },
  'spider-silk': {
    id: 'spider-silk',
    name: '蜘蛛丝',
    description: '坚韧的蜘蛛丝。',
    icon: '🕸️',
    type: 'misc',
  },
  'dagger-sharp': {
    id: 'dagger-sharp',
    name: '锋利匕首',
    description: '一把锋利的匕首。',
    icon: '🗡️',
    type: 'weapon',
    slot: 'weapon',
    attributes: { dexterity: 3 },
    effects: { damage: 8 },
  },
  'iron-helmet': {
    id: 'iron-helmet',
    name: '铁头盔',
    description: '坚固的铁制头盔。',
    icon: '⛑️',
    type: 'armor',
    slot: 'head',
    attributes: { constitution: 2 },
    effects: { defense: 4 },
  },
  'ring-of-power': {
    id: 'ring-of-power',
    name: '力量之戒',
    description: '增加力量的魔法戒指。',
    icon: '💍',
    type: 'accessory',
    slot: 'ring',
    attributes: { strength: 3 },
  },
};

export const AVATAR_COLORS = [
  '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71',
  '#3498db', '#9b59b6', '#1abc9c', '#e91e63',
];

export const AVATAR_SHAPES: Array<'circle' | 'square' | 'diamond'> = ['circle', 'square', 'diamond'];

export const getAttributeNames: Record<keyof Attributes, string> = {
  strength: '力量',
  dexterity: '敏捷',
  constitution: '体质',
  intelligence: '智力',
  wisdom: '感知',
  charisma: '魅力',
};
