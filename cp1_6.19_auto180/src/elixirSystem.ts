export type ElementType = 'fire' | 'frost' | 'lightning' | 'life' | 'shadow';
export type ResistanceTier = 'weak' | 'medium' | 'strong';

export interface Elixir {
  id: ElementType;
  name: string;
  emoji: string;
  color: string;
  glowColor: string;
  baseDamage: number;
}

export interface ChainProduct {
  id: string;
  name: string;
  emoji: string;
  color: string;
  glowColor: string;
  damage: number;
  ingredients: [string, string];
  description: string;
  elements: ElementType[];
}

export interface ChainStep {
  inputs: string[];
  output: ChainProduct | null;
  damage: number;
  animationColor: string;
  position: number;
}

export interface ChainResult {
  steps: ChainStep[];
  finalProducts: ChainProduct[];
  remainingItems: string[];
  totalBaseDamage: number;
}

export const BASE_ELIXIRS: Record<ElementType, Elixir> = {
  fire: {
    id: 'fire',
    name: '火焰',
    emoji: '🔥',
    color: '#FF5722',
    glowColor: 'rgba(255,87,34,0.7)',
    baseDamage: 12,
  },
  frost: {
    id: 'frost',
    name: '冰霜',
    emoji: '❄️',
    color: '#03A9F4',
    glowColor: 'rgba(3,169,244,0.7)',
    baseDamage: 10,
  },
  lightning: {
    id: 'lightning',
    name: '闪电',
    emoji: '⚡',
    color: '#FFEB3B',
    glowColor: 'rgba(255,235,59,0.7)',
    baseDamage: 14,
  },
  life: {
    id: 'life',
    name: '生命',
    emoji: '💚',
    color: '#4CAF50',
    glowColor: 'rgba(76,175,80,0.7)',
    baseDamage: 8,
  },
  shadow: {
    id: 'shadow',
    name: '暗影',
    emoji: '🌑',
    color: '#9C27B0',
    glowColor: 'rgba(156,39,176,0.7)',
    baseDamage: 13,
  },
};

export const ELIXIR_ARRAY: Elixir[] = Object.values(BASE_ELIXIRS);

const normalizePair = (a: string, b: string): string => {
  return [a, b].sort().join('+');
};

export const CHAIN_PRODUCTS: ChainProduct[] = [
  {
    id: 'steam',
    name: '蒸汽',
    emoji: '💨',
    color: '#B0BEC5',
    glowColor: 'rgba(176,190,197,0.7)',
    damage: 25,
    ingredients: ['fire', 'frost'],
    description: '火焰融化冰霜，升腾出灼热蒸汽',
    elements: ['fire', 'frost'],
  },
  {
    id: 'storm_cloud',
    name: '雷暴云',
    emoji: '⛈️',
    color: '#3F51B5',
    glowColor: 'rgba(63,81,181,0.8)',
    damage: 55,
    ingredients: ['steam', 'lightning'],
    description: '蒸汽充入闪电，形成毁灭雷云',
    elements: ['fire', 'frost', 'lightning'],
  },
  {
    id: 'inferno',
    name: '炼狱',
    emoji: '🌋',
    color: '#D32F2F',
    glowColor: 'rgba(211,47,47,0.8)',
    damage: 35,
    ingredients: ['fire', 'life'],
    description: '生命献祭为无尽烈焰',
    elements: ['fire', 'life'],
  },
  {
    id: 'blizzard',
    name: '暴风雪',
    emoji: '🌨️',
    color: '#81D4FA',
    glowColor: 'rgba(129,212,250,0.8)',
    damage: 30,
    ingredients: ['frost', 'life'],
    description: '生命之水凝结成狂暴风雪',
    elements: ['frost', 'life'],
  },
  {
    id: 'plasma',
    name: '等离子',
    emoji: '🔮',
    color: '#FF9800',
    glowColor: 'rgba(255,152,0,0.8)',
    damage: 40,
    ingredients: ['lightning', 'life'],
    description: '生命力催生高能等离子态',
    elements: ['lightning', 'life'],
  },
  {
    id: 'void',
    name: '虚空',
    emoji: '🕳️',
    color: '#311B92',
    glowColor: 'rgba(49,27,146,0.85)',
    damage: 45,
    ingredients: ['life', 'shadow'],
    description: '生命被虚空吞噬，形成引力漩涡',
    elements: ['life', 'shadow'],
  },
  {
    id: 'smog',
    name: '毒雾',
    emoji: '☠️',
    color: '#689F38',
    glowColor: 'rgba(104,159,56,0.75)',
    damage: 30,
    ingredients: ['fire', 'shadow'],
    description: '暗影燃烧产生致命毒雾',
    elements: ['fire', 'shadow'],
  },
  {
    id: 'cryo_void',
    name: '冰蚀',
    emoji: '🧊',
    color: '#18FFFF',
    glowColor: 'rgba(24,255,255,0.75)',
    damage: 35,
    ingredients: ['frost', 'shadow'],
    description: '虚空寒意侵蚀万物',
    elements: ['frost', 'shadow'],
  },
  {
    id: 'spark_shadow',
    name: '幽雷',
    emoji: '🌩️',
    color: '#7B1FA2',
    glowColor: 'rgba(123,31,162,0.8)',
    damage: 40,
    ingredients: ['lightning', 'shadow'],
    description: '暗影中的诡异雷电',
    elements: ['lightning', 'shadow'],
  },
  {
    id: 'holy_light',
    name: '圣光',
    emoji: '✨',
    color: '#FFD54F',
    glowColor: 'rgba(255,213,79,0.9)',
    damage: 80,
    ingredients: ['inferno', 'life'],
    description: '炼狱之火经生命净化成神圣光芒',
    elements: ['fire', 'life'],
  },
  {
    id: 'elemental_storm',
    name: '元素风暴',
    emoji: '🌀',
    color: '#E91E63',
    glowColor: 'rgba(233,30,99,0.85)',
    damage: 100,
    ingredients: ['storm_cloud', 'blizzard'],
    description: '雷暴云与暴风雪交织成终焉风暴',
    elements: ['fire', 'frost', 'lightning', 'life'],
  },
  {
    id: 'chaos_flame',
    name: '混沌炎',
    emoji: '💥',
    color: '#FF1744',
    glowColor: 'rgba(255,23,68,0.85)',
    damage: 70,
    ingredients: ['inferno', 'shadow'],
    description: '炼狱之火堕落为混沌',
    elements: ['fire', 'life', 'shadow'],
  },
];

const buildRecipeMap = (): Map<string, ChainProduct> => {
  const map = new Map<string, ChainProduct>();
  for (const product of CHAIN_PRODUCTS) {
    const key = normalizePair(product.ingredients[0], product.ingredients[1]);
    map.set(key, product);
  }
  return map;
};

const RECIPE_MAP = buildRecipeMap();

const findRecipe = (a: string, b: string): ChainProduct | null => {
  return RECIPE_MAP.get(normalizePair(a, b)) ?? null;
};

const getItemColor = (id: string): string => {
  const elixir = BASE_ELIXIRS[id as ElementType];
  if (elixir) return elixir.color;
  const product = CHAIN_PRODUCTS.find((p) => p.id === id);
  if (product) return product.color;
  return '#FFFFFF';
};

export const getEmojiById = (id: string): string => {
  const elixir = BASE_ELIXIRS[id as ElementType];
  if (elixir) return elixir.emoji;
  const product = CHAIN_PRODUCTS.find((p) => p.id === id);
  if (product) return product.emoji;
  return '❓';
};

export const getNameById = (id: string): string => {
  const elixir = BASE_ELIXIRS[id as ElementType];
  if (elixir) return elixir.name;
  const product = CHAIN_PRODUCTS.find((p) => p.id === id);
  if (product) return product.name;
  return '未知';
};

export const getElementsById = (id: string): ElementType[] => {
  const elixir = BASE_ELIXIRS[id as ElementType];
  if (elixir) return [elixir.id];
  const product = CHAIN_PRODUCTS.find((p) => p.id === id);
  if (product) return product.elements;
  return [];
};

export const computeChainReaction = (sequence: ElementType[]): ChainResult => {
  if (sequence.length === 0) {
    return { steps: [], finalProducts: [], remainingItems: [], totalBaseDamage: 0 };
  }

  const items: string[] = [...sequence];
  const steps: ChainStep[] = [];
  let totalBaseDamage = 0;
  let stepPosition = 0;

  let changed = true;
  let guard = 0;
  const maxIterations = 100;

  while (changed && guard < maxIterations) {
    changed = false;
    guard++;
    for (let i = 0; i < items.length - 1; i++) {
      const recipe = findRecipe(items[i], items[i + 1]);
      if (recipe) {
        const inputs = [items[i], items[i + 1]];
        steps.push({
          inputs,
          output: recipe,
          damage: recipe.damage,
          animationColor: recipe.color,
          position: stepPosition++,
        });
        totalBaseDamage += recipe.damage;
        items.splice(i, 2, recipe.id);
        changed = true;
        break;
      }
    }
  }

  for (const remaining of items) {
    const elixir = BASE_ELIXIRS[remaining as ElementType];
    if (elixir) {
      totalBaseDamage += elixir.baseDamage;
    }
  }

  const finalProducts: ChainProduct[] = [];
  for (const id of items) {
    const product = CHAIN_PRODUCTS.find((p) => p.id === id);
    if (product) finalProducts.push(product);
  }

  return {
    steps,
    finalProducts,
    remainingItems: items,
    totalBaseDamage,
  };
};

export const getStepAnimationColor = (step: ChainStep): string => {
  if (step.output) return step.output.color;
  if (step.inputs.length > 0) return getItemColor(step.inputs[0]);
  return '#FFFFFF';
};
