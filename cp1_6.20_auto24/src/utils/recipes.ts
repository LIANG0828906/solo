export type ElementType = 'fire' | 'water' | 'earth' | 'air';

export type PotionType =
  | 'magma'
  | 'storm'
  | 'steam'
  | 'mud'
  | 'lightning'
  | 'dust'
  | 'philosopher';

export interface ElementInfo {
  type: ElementType;
  name: string;
  color: string;
  glowColor: string;
  icon: string;
}

export interface PotionInfo {
  type: PotionType;
  name: string;
  color: string;
  glowColor: string;
  score: number;
  recipe: ElementType[];
}

export const ELEMENTS: Record<ElementType, ElementInfo> = {
  fire: {
    type: 'fire',
    name: '火',
    color: '#FF6B35',
    glowColor: 'rgba(255, 107, 53, 0.6)',
    icon: '🔥',
  },
  water: {
    type: 'water',
    name: '水',
    color: '#4FC3F7',
    glowColor: 'rgba(79, 195, 247, 0.6)',
    icon: '💧',
  },
  earth: {
    type: 'earth',
    name: '土',
    color: '#8D6E63',
    glowColor: 'rgba(141, 110, 99, 0.6)',
    icon: '🪨',
  },
  air: {
    type: 'air',
    name: '气',
    color: '#B3E5FC',
    glowColor: 'rgba(179, 229, 252, 0.6)',
    icon: '💨',
  },
};

export const POTIONS: Record<PotionType, PotionInfo> = {
  magma: {
    type: 'magma',
    name: '岩浆药水',
    color: '#FF5722',
    glowColor: 'rgba(255, 87, 34, 0.7)',
    score: 100,
    recipe: ['fire', 'earth'],
  },
  storm: {
    type: 'storm',
    name: '风暴药水',
    color: '#7C4DFF',
    glowColor: 'rgba(124, 77, 255, 0.7)',
    score: 100,
    recipe: ['water', 'air'],
  },
  steam: {
    type: 'steam',
    name: '蒸汽药水',
    color: '#E0E0E0',
    glowColor: 'rgba(224, 224, 224, 0.7)',
    score: 80,
    recipe: ['fire', 'water'],
  },
  mud: {
    type: 'mud',
    name: '泥土药水',
    color: '#6D4C41',
    glowColor: 'rgba(109, 76, 65, 0.7)',
    score: 80,
    recipe: ['water', 'earth'],
  },
  lightning: {
    type: 'lightning',
    name: '闪电药水',
    color: '#FFEB3B',
    glowColor: 'rgba(255, 235, 59, 0.8)',
    score: 120,
    recipe: ['fire', 'air'],
  },
  dust: {
    type: 'dust',
    name: '尘埃药水',
    color: '#BCAAA4',
    glowColor: 'rgba(188, 170, 164, 0.7)',
    score: 80,
    recipe: ['earth', 'air'],
  },
  philosopher: {
    type: 'philosopher',
    name: '贤者之石',
    color: '#D4AF37',
    glowColor: 'rgba(212, 175, 55, 0.9)',
    score: 500,
    recipe: ['fire', 'water', 'earth'],
  },
};

function arraysEqualAsSet(a: ElementType[], b: ElementType[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((el, i) => el === sortedB[i]);
}

export function findMatchingRecipe(
  elements: ElementType[]
): PotionInfo | null {
  for (const potion of Object.values(POTIONS)) {
    if (arraysEqualAsSet(elements, potion.recipe)) {
      return potion;
    }
  }
  return null;
}

export function canAddElement(
  currentElements: ElementType[],
  _element: ElementType
): boolean {
  return currentElements.length < 3;
}
