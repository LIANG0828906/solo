export type IngredientState = 'raw' | 'half_cooked' | 'cooked' | 'burnt';
export type IngredientType = 'onion' | 'tomato' | 'cheese' | 'patty' | 'bread';

export interface IngredientConfig {
  name: string;
  type: IngredientType;
  chopTime: number;
  cookTime: number;
  bestTemp: number;
  icon: string;
}

export const INGREDIENT_CONFIGS: Record<IngredientType, IngredientConfig> = {
  onion: {
    name: '洋葱',
    type: 'onion',
    chopTime: 2000,
    cookTime: 4000,
    bestTemp: 150,
    icon: '🧅'
  },
  tomato: {
    name: '番茄',
    type: 'tomato',
    chopTime: 1500,
    cookTime: 5000,
    bestTemp: 140,
    icon: '🍅'
  },
  cheese: {
    name: '奶酪',
    type: 'cheese',
    chopTime: 1000,
    cookTime: 3000,
    bestTemp: 120,
    icon: '🧀'
  },
  patty: {
    name: '肉饼',
    type: 'patty',
    chopTime: 500,
    cookTime: 6000,
    bestTemp: 180,
    icon: '🥩'
  },
  bread: {
    name: '面包',
    type: 'bread',
    chopTime: 500,
    cookTime: 2000,
    bestTemp: 130,
    icon: '🍞'
  }
};

export interface RecipeIngredient {
  type: IngredientType;
  requiredState: IngredientState;
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: RecipeIngredient[];
  description: string;
  icon: string;
}

export const RECIPES: Recipe[] = [
  {
    id: 'bolognese',
    name: '意大利肉酱面',
    icon: '🍝',
    description: '番茄全熟+肉饼全熟+洋葱半熟',
    ingredients: [
      { type: 'tomato', requiredState: 'cooked' },
      { type: 'patty', requiredState: 'cooked' },
      { type: 'onion', requiredState: 'half_cooked' }
    ]
  },
  {
    id: 'burger',
    name: '经典汉堡',
    icon: '🍔',
    description: '面包熟+肉饼全熟+奶酪半熟',
    ingredients: [
      { type: 'bread', requiredState: 'cooked' },
      { type: 'patty', requiredState: 'cooked' },
      { type: 'cheese', requiredState: 'half_cooked' }
    ]
  },
  {
    id: 'pizza',
    name: '玛格丽特披萨',
    icon: '🍕',
    description: '面包熟+奶酪全熟+番茄半熟',
    ingredients: [
      { type: 'bread', requiredState: 'cooked' },
      { type: 'cheese', requiredState: 'cooked' },
      { type: 'tomato', requiredState: 'half_cooked' }
    ]
  },
  {
    id: 'omlette',
    name: '奶酪洋葱卷',
    icon: '🌯',
    description: '洋葱全熟+奶酪全熟+番茄半熟',
    ingredients: [
      { type: 'onion', requiredState: 'cooked' },
      { type: 'cheese', requiredState: 'cooked' },
      { type: 'tomato', requiredState: 'half_cooked' }
    ]
  },
  {
    id: 'steak',
    name: '香煎肉排套餐',
    icon: '🥩',
    description: '肉饼全熟+洋葱全熟+番茄半熟',
    ingredients: [
      { type: 'patty', requiredState: 'cooked' },
      { type: 'onion', requiredState: 'cooked' },
      { type: 'tomato', requiredState: 'half_cooked' }
    ]
  }
];

export interface PlateIngredient {
  ingredientId: string;
  type: IngredientType;
  state: IngredientState;
}

export const STATE_SCORES: Record<IngredientState, number> = {
  raw: 0,
  half_cooked: 70,
  cooked: 100,
  burnt: 0
};

export const getStateLabel = (state: IngredientState): string => {
  const labels: Record<IngredientState, string> = {
    raw: '生',
    half_cooked: '半熟',
    cooked: '熟',
    burnt: '焦'
  };
  return labels[state];
};

export const calculateMatchScore = (plate: PlateIngredient[]): { score: number; matchedRecipe: Recipe | null; matchPercentage: number } => {
  if (plate.length === 0) {
    return { score: 0, matchedRecipe: null, matchPercentage: 0 };
  }

  let bestScore = 0;
  let bestRecipe: Recipe | null = null;
  let bestPercentage = 0;

  for (const recipe of RECIPES) {
    const result = matchRecipe(plate, recipe);
    if (result.score > bestScore) {
      bestScore = result.score;
      bestRecipe = recipe;
      bestPercentage = result.percentage;
    }
  }

  return { score: bestScore, matchedRecipe: bestRecipe, matchPercentage: bestPercentage };
};

const matchRecipe = (plate: PlateIngredient[], recipe: Recipe): { score: number; percentage: number } => {
  const plateCopy = [...plate];
  let totalMatchScore = 0;
  let maxPossibleScore = recipe.ingredients.length * 100;

  for (const required of recipe.ingredients) {
    const matchIndex = plateCopy.findIndex(p => {
      if (p.type !== required.type) return false;
      const stateScore = STATE_SCORES[p.state];
      return stateScore > 0;
    });

    if (matchIndex !== -1) {
      const matched = plateCopy[matchIndex];
      totalMatchScore += calculateStateScore(matched.state, required.requiredState);
      plateCopy.splice(matchIndex, 1);
    }
  }

  const extraPenalty = plateCopy.length * 20;
  const finalScore = Math.max(0, totalMatchScore - extraPenalty);
  const percentage = Math.round((finalScore / maxPossibleScore) * 100);

  return { score: finalScore, percentage };
};

const calculateStateScore = (actual: IngredientState, required: IngredientState): number => {
  if (actual === required) return 100;
  if (actual === 'burnt') return 0;
  if (actual === 'raw') return 20;

  const order: IngredientState[] = ['raw', 'half_cooked', 'cooked', 'burnt'];
  const actualIdx = order.indexOf(actual);
  const requiredIdx = order.indexOf(required);
  const diff = Math.abs(actualIdx - requiredIdx);

  if (diff === 1) return 70;
  if (diff === 2) return 30;
  return 10;
};

export const getRandomIngredientType = (): IngredientType => {
  const types: IngredientType[] = ['onion', 'tomato', 'cheese', 'patty', 'bread'];
  return types[Math.floor(Math.random() * types.length)];
};
