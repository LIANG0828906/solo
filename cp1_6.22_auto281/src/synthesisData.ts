export interface Element {
  id: string;
  name: string;
  rarity: 1 | 2 | 3 | 4 | 5;
  color: string;
}

export interface Recipe {
  inputs: string[];
  output: string;
}

export const RARITY_MULTIPLIER: Record<number, number> = {
  1: 1,
  2: 2,
  3: 4,
  4: 8,
  5: 16,
};

export const BASE_GOLD_PER_SECOND = 1;

export const ALL_ELEMENTS: Record<string, Element> = {
  fire: { id: 'fire', name: '火', rarity: 1, color: '#FF5722' },
  water: { id: 'water', name: '水', rarity: 1, color: '#2196F3' },
  earth: { id: 'earth', name: '土', rarity: 1, color: '#8D6E63' },
  air: { id: 'air', name: '气', rarity: 1, color: '#9C27B0' },
  pottery: { id: 'pottery', name: '陶器', rarity: 1, color: '#A1887F' },
  cloud: { id: 'cloud', name: '云', rarity: 1, color: '#B0BEC5' },
  energy: { id: 'energy', name: '能量', rarity: 2, color: '#FFEB3B' },
  mud: { id: 'mud', name: '泥浆', rarity: 1, color: '#6D4C41' },
  porcelain: { id: 'porcelain', name: '瓷器', rarity: 2, color: '#ECEFF1' },
  lightning: { id: 'lightning', name: '闪电', rarity: 3, color: '#FFC107' },
  brick: { id: 'brick', name: '砖头', rarity: 1, color: '#B71C1C' },
  magic_crystal: { id: 'magic_crystal', name: '魔法水晶', rarity: 4, color: '#E040FB' },
  furnace: { id: 'furnace', name: '熔炉', rarity: 3, color: '#FF7043' },
  philosopher_stone: { id: 'philosopher_stone', name: '贤者之石', rarity: 5, color: '#FF4081' },
  steam: { id: 'steam', name: '蒸汽', rarity: 1, color: '#CFD8DC' },
  storm: { id: 'storm', name: '风暴', rarity: 3, color: '#5C6BC0' },
};

export const INITIAL_ELEMENT_IDS: string[] = ['fire', 'water', 'earth', 'air'];

export const RECIPES: Recipe[] = [
  { inputs: ['earth', 'fire'], output: 'pottery' },
  { inputs: ['water', 'air'], output: 'cloud' },
  { inputs: ['fire', 'air'], output: 'energy' },
  { inputs: ['water', 'earth'], output: 'mud' },
  { inputs: ['pottery', 'water'], output: 'porcelain' },
  { inputs: ['cloud', 'energy'], output: 'lightning' },
  { inputs: ['mud', 'fire'], output: 'brick' },
  { inputs: ['porcelain', 'lightning'], output: 'magic_crystal' },
  { inputs: ['brick', 'energy'], output: 'furnace' },
  { inputs: ['magic_crystal', 'furnace'], output: 'philosopher_stone' },
  { inputs: ['water', 'fire'], output: 'steam' },
  { inputs: ['steam', 'air'], output: 'storm' },
];

export const buildRecipeMap = (): Map<string, string> => {
  const map = new Map<string, string>();
  for (const recipe of RECIPES) {
    const key = [...recipe.inputs].sort().join(',');
    map.set(key, recipe.output);
  }
  return map;
};
