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

export const getStateLabel = (state: IngredientState): string => {
  const labels: Record<IngredientState, string> = {
    raw: '生',
    half_cooked: '半熟',
    cooked: '熟',
    burnt: '焦'
  };
  return labels[state];
};

const STATE_ORDER: IngredientState[] = ['raw', 'half_cooked', 'cooked', 'burnt'];

function stateDistance(a: IngredientState, b: IngredientState): number {
  return Math.abs(STATE_ORDER.indexOf(a) - STATE_ORDER.indexOf(b));
}

function stateMatchScore(actual: IngredientState, required: IngredientState): number {
  if (actual === 'burnt') return 0;
  if (actual === required) return 100;
  if (actual === 'raw') return 10;

  const dist = stateDistance(actual, required);
  if (dist === 1) return 60;
  if (dist === 2) return 25;
  return 10;
}

export interface MatchResult {
  score: number;
  matchedRecipe: Recipe | null;
  matchPercentage: number;
  details: Array<{
    recipeId: string;
    recipeName: string;
    percentage: number;
    ingredientMatches: Array<{
      required: RecipeIngredient;
      matched: PlateIngredient | null;
      stateScore: number;
    }>;
  }>;
}

export const calculateMatchScore = (plate: PlateIngredient[]): MatchResult => {
  if (plate.length === 0) {
    return { score: 0, matchedRecipe: null, matchPercentage: 0, details: [] };
  }

  let bestScore = 0;
  let bestRecipe: Recipe | null = null;
  let bestPercentage = 0;
  const allDetails: MatchResult['details'] = [];

  for (const recipe of RECIPES) {
    const result = matchRecipeWithDetails(plate, recipe);
    allDetails.push(result);

    if (result.percentage > bestPercentage) {
      bestPercentage = result.percentage;
      bestScore = Math.round(result.percentage * recipe.ingredients.length);
      bestRecipe = recipe;
    }
  }

  return { score: bestScore, matchedRecipe: bestRecipe, matchPercentage: bestPercentage, details: allDetails };
};

function matchRecipeWithDetails(
  plate: PlateIngredient[],
  recipe: Recipe
): {
  recipeId: string;
  recipeName: string;
  percentage: number;
  ingredientMatches: Array<{
    required: RecipeIngredient;
    matched: PlateIngredient | null;
    stateScore: number;
  }>;
} {
  const plateCopy = [...plate];
  const ingredientMatches: Array<{
    required: RecipeIngredient;
    matched: PlateIngredient | null;
    stateScore: number;
  }> = [];

  let totalScore = 0;
  const maxPossible = recipe.ingredients.length * 100;

  for (const required of recipe.ingredients) {
    let bestIdx = -1;
    let bestStateScore = -1;

    for (let i = 0; i < plateCopy.length; i++) {
      const p = plateCopy[i];
      if (p.type !== required.type) continue;
      if (p.state === 'burnt') continue;

      const score = stateMatchScore(p.state, required.requiredState);
      if (score > bestStateScore) {
        bestStateScore = score;
        bestIdx = i;
      }
    }

    if (bestIdx !== -1) {
      const matched = plateCopy[bestIdx];
      totalScore += bestStateScore;
      ingredientMatches.push({
        required,
        matched,
        stateScore: bestStateScore
      });
      plateCopy.splice(bestIdx, 1);
    } else {
      ingredientMatches.push({
        required,
        matched: null,
        stateScore: 0
      });
    }
  }

  const extraPenalty = plateCopy.length * 25;
  const finalScore = Math.max(0, totalScore - extraPenalty);
  const percentage = Math.round((finalScore / maxPossible) * 100);

  return {
    recipeId: recipe.id,
    recipeName: recipe.name,
    percentage,
    ingredientMatches
  };
}

export const getRandomIngredientType = (): IngredientType => {
  const types: IngredientType[] = ['onion', 'tomato', 'cheese', 'patty', 'bread'];
  return types[Math.floor(Math.random() * types.length)];
};
