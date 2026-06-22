export interface Element {
  id: string;
  name: string;
  symbol: string;
  colors: [string, string];
  isBasic: boolean;
  description: string;
}

const fire: Element = {
  id: 'fire',
  name: '火',
  symbol: '🔥',
  colors: ['#FF6B35', '#F7931E'],
  isBasic: true,
  description: '燃烧与热情的原始之力'
};

const water: Element = {
  id: 'water',
  name: '水',
  symbol: '💧',
  colors: ['#0077B6', '#00B4D8'],
  isBasic: true,
  description: '流动与生命的源泉'
};

const earth: Element = {
  id: 'earth',
  name: '土',
  symbol: '🌍',
  colors: ['#8B5A2B', '#A0522D'],
  isBasic: true,
  description: '稳固与根基的守护'
};

const wind: Element = {
  id: 'wind',
  name: '风',
  symbol: '💨',
  colors: ['#90E0EF', '#CAF0F8'],
  isBasic: true,
  description: '自由与变化的呼吸'
};

const steam: Element = {
  id: 'steam',
  name: '蒸汽',
  symbol: '♨️',
  colors: ['#B0C4DE', '#E6E6FA'],
  isBasic: false,
  description: '火与水交融的温暖雾气'
};

const lava: Element = {
  id: 'lava',
  name: '熔岩',
  symbol: '🌋',
  colors: ['#FF4500', '#FF8C00'],
  isBasic: false,
  description: '大地深处沸腾的炽热熔岩'
};

const dust: Element = {
  id: 'dust',
  name: '尘埃',
  symbol: '✨',
  colors: ['#D2B48C', '#F5DEB3'],
  isBasic: false,
  description: '风吹拂大地扬起的金色微尘'
};

const storm: Element = {
  id: 'storm',
  name: '风暴',
  symbol: '⛈️',
  colors: ['#4B0082', '#8A2BE2'],
  isBasic: false,
  description: '水与风碰撞咆哮的狂怒'
};

const magma: Element = {
  id: 'magma',
  name: '岩浆',
  symbol: '🔴',
  colors: ['#DC143C', '#FF6347'],
  isBasic: false,
  description: '火与土融合的灼热流动'
};

const mud: Element = {
  id: 'mud',
  name: '泥土',
  symbol: '🟤',
  colors: ['#654321', '#8B4513'],
  isBasic: false,
  description: '水与土孕育的肥沃生命'
};

const lightning: Element = {
  id: 'lightning',
  name: '闪电',
  symbol: '⚡',
  colors: ['#FFD700', '#FFFF00'],
  isBasic: false,
  description: '火与风交织的瞬间光辉'
};

const energy: Element = {
  id: 'energy',
  name: '能量',
  symbol: '🔆',
  colors: ['#FF00FF', '#FF69B4'],
  isBasic: false,
  description: '四元素合一的神秘本源'
};

export const basicElements: Element[] = [fire, water, earth, wind];

export const allElements: Element[] = [
  fire, water, earth, wind,
  steam, lava, dust, storm,
  magma, mud, lightning, energy
];

interface Recipe {
  ingredients: [string, string];
  result: string;
}

const recipes: Recipe[] = [
  { ingredients: ['fire', 'water'], result: 'steam' },
  { ingredients: ['fire', 'earth'], result: 'lava' },
  { ingredients: ['earth', 'wind'], result: 'dust' },
  { ingredients: ['water', 'wind'], result: 'storm' },
  { ingredients: ['fire', 'fire'], result: 'magma' },
  { ingredients: ['water', 'earth'], result: 'mud' },
  { ingredients: ['fire', 'wind'], result: 'lightning' },
  { ingredients: ['water', 'water'], result: 'storm' },
  { ingredients: ['earth', 'earth'], result: 'magma' },
  { ingredients: ['wind', 'wind'], result: 'dust' },
  { ingredients: ['steam', 'lava'], result: 'energy' },
  { ingredients: ['dust', 'storm'], result: 'energy' },
  { ingredients: ['lightning', 'mud'], result: 'energy' },
  { ingredients: ['magma', 'storm'], result: 'energy' }
];

export function findRecipe(elem1: string, elem2: string): Element | null {
  const recipe = recipes.find(r =>
    (r.ingredients[0] === elem1 && r.ingredients[1] === elem2) ||
    (r.ingredients[0] === elem2 && r.ingredients[1] === elem1)
  );
  if (!recipe) return null;
  return allElements.find(e => e.id === recipe.result) || null;
}

export function getElementById(id: string): Element | undefined {
  return allElements.find(e => e.id === id);
}
