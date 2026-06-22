export type IngredientCategory = 'vegetables' | 'meat' | 'seafood' | 'seasoning' | 'grains' | 'dairy' | 'fruits' | 'others';

export type IngredientUnit = 'g' | 'kg' | 'pcs' | 'cup' | 'ml' | 'spoon' | 'pinch';

export type RecipeDifficulty = 'easy' | 'medium' | 'hard';

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  quantity: number;
  unit: IngredientUnit;
  expiryDate: string;
}

export interface RecipeIngredient {
  name: string;
  amount: number;
  unit: string;
  isRequired: boolean;
}

export interface RecipeStep {
  stepNumber: number;
  description: string;
  timerSeconds?: number;
  timerLabel?: string;
}

export interface Recipe {
  id: string;
  name: string;
  difficulty: RecipeDifficulty;
  calories: number;
  cookTime: number;
  tags: string[];
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  nutritionRatio: {
    carbs: number;
    protein: number;
    fat: number;
  };
  image?: string;
}

export interface RecipeScore {
  recipe: Recipe;
  matchScore: number;
  nutritionScore: number;
  difficultyScore: number;
  totalScore: number;
  missingIngredients: RecipeIngredient[];
  matchedIngredients: RecipeIngredient[];
}

export type AppPage = 'inventory' | 'recipes' | 'cooking';

export const CATEGORY_LABELS: Record<IngredientCategory, string> = {
  vegetables: '蔬菜',
  meat: '肉类',
  seafood: '海鲜',
  seasoning: '调味品',
  grains: '谷物',
  dairy: '乳制品',
  fruits: '水果',
  others: '其他',
};

export const UNIT_LABELS: Record<IngredientUnit, string> = {
  g: '克',
  kg: '千克',
  pcs: '个',
  cup: '杯',
  ml: '毫升',
  spoon: '勺',
  pinch: '撮',
};

export const DIFFICULTY_LABELS: Record<RecipeDifficulty, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
};
