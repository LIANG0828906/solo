export interface Material {
  id: string;
  name: string;
  color: string;
  tier: 'basic' | 'advanced';
}

export interface Facility {
  id: string;
  name: string;
  color: string;
  description: string;
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: { materialId: string; amount: number }[];
  manaCost: number;
  craftTime: number;
  requiredFacilities?: string[];
}

export const MATERIALS: Material[] = [
  { id: 'fire_essence', name: '火焰精华', color: '#ff6b35', tier: 'basic' },
  { id: 'frost_petal', name: '冰霜花瓣', color: '#a8e6ff', tier: 'basic' },
  { id: 'moonlight_dust', name: '月光尘', color: '#e8d5ff', tier: 'basic' },
  { id: 'thunder_stone', name: '雷电石', color: '#ffd700', tier: 'basic' },
  { id: 'life_elixir', name: '生命药剂', color: '#32cd32', tier: 'advanced' },
  { id: 'mana_elixir', name: '魔力药剂', color: '#9966ff', tier: 'advanced' },
  { id: 'harmony_essence', name: '调和灵液', color: '#ff88ff', tier: 'advanced' },
];

export const FACILITIES: Facility[] = [
  { id: 'alchemy_table', name: '炼金台', color: '#d4a574', description: '基础炼金设施，用于合成各种材料与药剂' },
  { id: 'material_rack', name: '材料架', color: '#8b7355', description: '存放各类基础材料，方便随时取用' },
  { id: 'furnace', name: '熔炉', color: '#c0392b', description: '高温冶炼设备，用于合成需要加热的药剂' },
  { id: 'potion_rack', name: '药水架', color: '#2980b9', description: '专业药剂制作台，可精细调配各类药水' },
  { id: 'mana_well', name: '魔力井', color: '#6c5ce7', description: '汲取大地魔力的神秘井泉，提供持续魔力' },
];

export const RECIPES: Recipe[] = [
  {
    id: 'harmony_essence',
    name: '调和灵液',
    ingredients: [
      { materialId: 'fire_essence', amount: 1 },
      { materialId: 'frost_petal', amount: 1 },
    ],
    manaCost: 10,
    craftTime: 2,
  },
  {
    id: 'life_elixir',
    name: '生命药剂',
    ingredients: [
      { materialId: 'harmony_essence', amount: 1 },
      { materialId: 'moonlight_dust', amount: 1 },
    ],
    manaCost: 15,
    craftTime: 2,
  },
  {
    id: 'mana_elixir',
    name: '魔力药剂',
    ingredients: [
      { materialId: 'harmony_essence', amount: 1 },
      { materialId: 'thunder_stone', amount: 1 },
    ],
    manaCost: 15,
    craftTime: 2,
  },
  {
    id: 'healing_potion',
    name: '回复药水',
    ingredients: [
      { materialId: 'life_elixir', amount: 1 },
      { materialId: 'moonlight_dust', amount: 1 },
    ],
    manaCost: 20,
    craftTime: 2,
    requiredFacilities: ['furnace', 'potion_rack'],
  },
  {
    id: 'strength_potion',
    name: '力量药水',
    ingredients: [
      { materialId: 'life_elixir', amount: 1 },
      { materialId: 'fire_essence', amount: 1 },
    ],
    manaCost: 20,
    craftTime: 2,
  },
  {
    id: 'invisibility_potion',
    name: '隐身药水',
    ingredients: [
      { materialId: 'mana_elixir', amount: 1 },
      { materialId: 'frost_petal', amount: 1 },
    ],
    manaCost: 20,
    craftTime: 2,
  },
];
