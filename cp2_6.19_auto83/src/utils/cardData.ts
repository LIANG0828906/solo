export type ElementType = 'fire' | 'water' | 'wind' | 'earth' | 'light' | 'dark' | 'composite';

export type RarityType = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Card {
  id: string;
  name: string;
  element: ElementType;
  rarity: RarityType;
  attack: number;
  defense: number;
  description: string;
  lore: string;
  formula?: [string, string];
}

export const ALL_CARDS: Card[] = [
  {
    id: 'fire',
    name: '火',
    element: 'fire',
    rarity: 'common',
    attack: 10,
    defense: 5,
    description: '最原始的元素之力，燃烧一切',
    lore: '自太初之始，火焰便在世界中心燃烧，温暖万物，也焚毁万物。',
  },
  {
    id: 'water',
    name: '水',
    element: 'water',
    rarity: 'common',
    attack: 8,
    defense: 8,
    description: '流动的元素，以柔克刚',
    lore: '水是万物的起源，它在山川间流淌，赋予大地生机。',
  },
  {
    id: 'wind',
    name: '风',
    element: 'wind',
    rarity: 'common',
    attack: 12,
    defense: 3,
    description: '自由的元素，无拘无束',
    lore: '风从不为谁停留，它掠过天际，带来远方的消息。',
  },
  {
    id: 'earth',
    name: '土',
    element: 'earth',
    rarity: 'common',
    attack: 5,
    defense: 12,
    description: '坚固的元素，守护大地',
    lore: '大地沉默而坚定，承载着一切生灵的重量。',
  },
  {
    id: 'light',
    name: '光',
    element: 'light',
    rarity: 'common',
    attack: 15,
    defense: 2,
    description: '神圣的元素，驱散黑暗',
    lore: '光明来自星辰，它是希望的化身，永远照耀前方。',
  },
  {
    id: 'dark',
    name: '暗',
    element: 'dark',
    rarity: 'common',
    attack: 14,
    defense: 4,
    description: '神秘的元素，吞噬一切',
    lore: '暗影并非邪恶，它只是光的另一面，在深渊中沉默等待。',
  },
  {
    id: 'steam',
    name: '蒸汽',
    element: 'composite',
    rarity: 'uncommon',
    attack: 15,
    defense: 12,
    formula: ['fire', 'water'],
    description: '水火交融，蒸汽升腾',
    lore: '当烈焰遇上深水，蒸汽弥漫于天地之间，模糊了视野。',
  },
  {
    id: 'mud',
    name: '泥沼',
    element: 'composite',
    rarity: 'uncommon',
    attack: 12,
    defense: 16,
    formula: ['water', 'earth'],
    description: '水土混合，困敌于泥',
    lore: '泥沼吞噬一切莽撞者，唯有耐心者方能穿越。',
  },
  {
    id: 'dust_storm',
    name: '沙尘',
    element: 'composite',
    rarity: 'uncommon',
    attack: 18,
    defense: 10,
    formula: ['wind', 'earth'],
    description: '狂风卷沙，遮天蔽日',
    lore: '沙尘暴来临之时，天地一色，万物皆被覆盖。',
  },
  {
    id: 'flamestorm',
    name: '烈焰风暴',
    element: 'composite',
    rarity: 'rare',
    attack: 25,
    defense: 8,
    formula: ['fire', 'wind'],
    description: '火焰借风势，燎原万里',
    lore: '当火遇风，烈焰化为风暴，焚烧沿途一切。',
  },
  {
    id: 'lava',
    name: '熔岩',
    element: 'composite',
    rarity: 'rare',
    attack: 20,
    defense: 18,
    formula: ['fire', 'earth'],
    description: '熔岩奔流，所过皆灰',
    lore: '大地深处的火焰突破地壳，化为赤红的熔岩之河。',
  },
  {
    id: 'storm',
    name: '暴风',
    element: 'composite',
    rarity: 'rare',
    attack: 22,
    defense: 14,
    formula: ['water', 'wind'],
    description: '风雨交加，雷霆万钧',
    lore: '水汽升腾至天穹，化为暴风骤雨，雷鸣电闪。',
  },
  {
    id: 'abyss',
    name: '深渊',
    element: 'composite',
    rarity: 'rare',
    attack: 26,
    defense: 12,
    formula: ['water', 'dark'],
    description: '暗流涌动，深不可测',
    lore: '深渊之下，是光无法触及的永恒寂静。',
  },
  {
    id: 'crystal',
    name: '水晶',
    element: 'composite',
    rarity: 'rare',
    attack: 16,
    defense: 28,
    formula: ['earth', 'light'],
    description: '地之精华，光之凝结',
    lore: '大地中蕴含的光明凝结为水晶，映射出七彩光芒。',
  },
  {
    id: 'necrosis',
    name: '腐朽',
    element: 'composite',
    rarity: 'rare',
    attack: 24,
    defense: 20,
    formula: ['earth', 'dark'],
    description: '大地侵蚀，万物凋零',
    lore: '暗影侵蚀大地，曾经丰饶的土地化为荒芜。',
  },
  {
    id: 'solar_flare',
    name: '日冕',
    element: 'composite',
    rarity: 'epic',
    attack: 35,
    defense: 10,
    formula: ['fire', 'light'],
    description: '烈阳之冠，光芒万丈',
    lore: '太阳最炽烈的爆发，将火焰与光明融为一体。',
  },
  {
    id: 'hellfire',
    name: '炼狱之火',
    element: 'composite',
    rarity: 'epic',
    attack: 32,
    defense: 15,
    formula: ['fire', 'dark'],
    description: '地狱之火，焚尽灵魂',
    lore: '黑暗中燃起的并非凡火，它焚烧的不是肉体，而是灵魂。',
  },
  {
    id: 'holy_water',
    name: '圣水',
    element: 'composite',
    rarity: 'epic',
    attack: 28,
    defense: 22,
    formula: ['water', 'light'],
    description: '圣洁之水，净化邪祟',
    lore: '光明祝福的清泉，洗去一切污秽与诅咒。',
  },
  {
    id: 'aurora',
    name: '极光',
    element: 'composite',
    rarity: 'epic',
    attack: 30,
    defense: 16,
    formula: ['wind', 'light'],
    description: '风中之光，绚丽天幕',
    lore: '高天之上的风与光交织，化为最梦幻的天幕。',
  },
  {
    id: 'void',
    name: '虚空',
    element: 'composite',
    rarity: 'epic',
    attack: 34,
    defense: 8,
    formula: ['wind', 'dark'],
    description: '虚无之风，万物归零',
    lore: '当风归于黑暗，连空间本身也被撕裂为虚无。',
  },
  {
    id: 'eclipse',
    name: '日蚀',
    element: 'composite',
    rarity: 'legendary',
    attack: 50,
    defense: 30,
    formula: ['light', 'dark'],
    description: '光暗交蚀，天地变色',
    lore: '光明与黑暗的终极交汇，在这一刻，太阳被吞噬，世界陷入永恒的一瞬。',
  },
];

export function generateInitialCardList(): Card[] {
  return JSON.parse(JSON.stringify(ALL_CARDS));
}

export function getCardById(id: string): Card | undefined {
  return ALL_CARDS.find((card) => card.id === id);
}

export const ELEMENT_COLORS: Record<string, string> = {
  fire: '#ff4d2e',
  water: '#2e9bff',
  wind: '#7ee8fa',
  earth: '#c8a24e',
  light: '#ffe066',
  dark: '#8b5cf6',
};

export const RARITY_COLORS: Record<string, string> = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
};
