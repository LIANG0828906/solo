export interface Ingredient {
  id?: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  storageLocation: '冷藏' | '冷冻' | '常温';
}

export interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface Recipe {
  id?: number;
  name: string;
  ingredients: RecipeIngredient[];
  cookTime: number;
  difficulty: '简单' | '中等' | '困难';
  steps: string[];
}

export interface WeeklyPlanItem {
  id?: number;
  date: string;
  mealType: '早餐' | '午餐' | '晚餐';
  recipeId: number;
  recipeName: string;
}

export interface ShoppingListItem {
  id?: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  purchased: boolean;
}

export type MatchCategory = '完全匹配' | '缺少1-2样' | '缺少更多';

export interface MatchedRecipe extends Recipe {
  matchCategory: MatchCategory;
  matchedIngredients: string[];
  missingIngredients: RecipeIngredient[];
}

export const INGREDIENT_CATEGORIES = [
  '蔬菜',
  '水果',
  '肉类',
  '海鲜',
  '乳制品',
  '蛋类',
  '主食',
  '调味品',
  '其他',
] as const;

export const INGREDIENT_UNITS = ['克', '个', '毫升', '千克', '升', '把', '片', '块'] as const;

export const STORAGE_LOCATIONS = ['冷藏', '冷冻', '常温'] as const;

export const MEAL_TYPES = ['早餐', '午餐', '晚餐'] as const;

export const SHOPPING_CATEGORIES: Record<string, string> = {
  '蔬菜': '蔬菜区',
  '水果': '水果区',
  '肉类': '肉禽区',
  '海鲜': '水产区',
  '乳制品': '乳制品区',
  '蛋类': '蛋类区',
  '主食': '粮油区',
  '调味品': '调味品区',
  '其他': '其他',
};
