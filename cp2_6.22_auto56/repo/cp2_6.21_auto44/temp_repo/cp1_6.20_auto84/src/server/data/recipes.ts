export interface Material {
  id: string;
  name: string;
  icon: string;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export interface Facility {
  id: string;
  name: string;
  icon: string;
  description: string;
  maxLevel: number;
  baseCost: number;
  costMultiplier: number;
  baseSpeed: number;
}

export interface RecipeIngredient {
  materialId: string;
  count: number;
}

export interface Recipe {
  id: string;
  name: string;
  icon: string;
  facilityId: string;
  ingredients: RecipeIngredient[];
  output: RecipeIngredient;
  baseDuration: number;
  unlockLevel: number;
}

export const MATERIALS: Material[] = [
  {
    id: 'herb',
    name: '草药',
    icon: '🌿',
    description: '森林中采集的基础草药，炼金术的入门材料。',
    rarity: 'common',
  },
  {
    id: 'water',
    name: '纯净水',
    icon: '💧',
    description: '经过净化的清澈泉水。',
    rarity: 'common',
  },
  {
    id: 'crystal',
    name: '魔法水晶',
    icon: '💎',
    description: '蕴含神秘魔力的水晶碎片。',
    rarity: 'uncommon',
  },
  {
    id: 'fire_essence',
    name: '火焰精华',
    icon: '🔥',
    description: '从火元素位面提取的灼热能量。',
    rarity: 'rare',
  },
  {
    id: 'moonstone',
    name: '月光石',
    icon: '🌙',
    description: '在满月之夜吸收了月光能量的神奇矿石。',
    rarity: 'rare',
  },
  {
    id: 'health_potion',
    name: '治疗药水',
    icon: '❤️',
    description: '能够恢复生命力的红色药剂。',
    rarity: 'common',
  },
  {
    id: 'mana_potion',
    name: '魔力药水',
    icon: '💙',
    description: '能够恢复魔法能量的蓝色药剂。',
    rarity: 'uncommon',
  },
  {
    id: 'strength_elixir',
    name: '力量秘药',
    icon: '💪',
    description: '短时间内大幅提升力量的珍贵药剂。',
    rarity: 'epic',
  },
  {
    id: 'philosopher_stone',
    name: '贤者之石',
    icon: '⭐',
    description: '传说中的终极炼金产物，拥有无穷力量。',
    rarity: 'legendary',
  },
];

export const FACILITIES: Facility[] = [
  {
    id: 'mortar',
    name: '研钵',
    icon: '⚗️',
    description: '基础的研磨工具，用于处理草药和矿石。',
    maxLevel: 10,
    baseCost: 50,
    costMultiplier: 1.5,
    baseSpeed: 1,
  },
  {
    id: 'cauldron',
    name: '炼金锅',
    icon: '🫕',
    description: '用于调配各种药水的核心设施。',
    maxLevel: 10,
    baseCost: 100,
    costMultiplier: 1.6,
    baseSpeed: 1,
  },
  {
    id: 'distiller',
    name: '蒸馏器',
    icon: '🧪',
    description: '提炼高纯度精华的精密设备。',
    maxLevel: 10,
    baseCost: 200,
    costMultiplier: 1.7,
    baseSpeed: 1,
  },
  {
    id: 'enchanter',
    name: '附魔台',
    icon: '✨',
    description: '注入魔法能量，创造传说级物品的神秘设施。',
    maxLevel: 10,
    baseCost: 500,
    costMultiplier: 2,
    baseSpeed: 1,
  },
];

export const RECIPES: Recipe[] = [
  {
    id: 'health_potion',
    name: '治疗药水',
    icon: '❤️',
    facilityId: 'cauldron',
    ingredients: [
      { materialId: 'herb', count: 2 },
      { materialId: 'water', count: 1 },
    ],
    output: { materialId: 'health_potion', count: 1 },
    baseDuration: 10,
    unlockLevel: 1,
  },
  {
    id: 'mana_potion',
    name: '魔力药水',
    icon: '💙',
    facilityId: 'cauldron',
    ingredients: [
      { materialId: 'crystal', count: 1 },
      { materialId: 'water', count: 2 },
    ],
    output: { materialId: 'mana_potion', count: 1 },
    baseDuration: 15,
    unlockLevel: 2,
  },
  {
    id: 'fire_essence_refined',
    name: '精制火焰精华',
    icon: '🔥',
    facilityId: 'distiller',
    ingredients: [
      { materialId: 'fire_essence', count: 2 },
      { materialId: 'crystal', count: 1 },
    ],
    output: { materialId: 'fire_essence', count: 3 },
    baseDuration: 30,
    unlockLevel: 4,
  },
  {
    id: 'strength_elixir',
    name: '力量秘药',
    icon: '💪',
    facilityId: 'distiller',
    ingredients: [
      { materialId: 'health_potion', count: 2 },
      { materialId: 'fire_essence', count: 1 },
      { materialId: 'crystal', count: 2 },
    ],
    output: { materialId: 'strength_elixir', count: 1 },
    baseDuration: 60,
    unlockLevel: 6,
  },
  {
    id: 'philosopher_stone',
    name: '贤者之石',
    icon: '⭐',
    facilityId: 'enchanter',
    ingredients: [
      { materialId: 'strength_elixir', count: 3 },
      { materialId: 'moonstone', count: 5 },
      { materialId: 'fire_essence', count: 10 },
    ],
    output: { materialId: 'philosopher_stone', count: 1 },
    baseDuration: 300,
    unlockLevel: 10,
  },
];
