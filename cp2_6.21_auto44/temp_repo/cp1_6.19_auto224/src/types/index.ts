export type IngredientCategory =
  | 'vegetable'
  | 'fruit'
  | 'meat'
  | 'seafood'
  | 'dairy'
  | 'grain'
  | 'seasoning'
  | 'other';

export type Unit = 'g' | 'kg' | 'ml' | 'L' | '个' | '包' | '盒';

export type PreferenceTag =
  | 'quick'
  | 'low-calorie'
  | 'spicy'
  | 'homestyle'
  | 'healthy'
  | 'vegetarian'
  | 'seafood'
  | 'meat'
  | 'vegetable';

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  quantity: number;
  unit: Unit;
  expiryDate: string;
  createdAt: string;
}

export interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: Unit;
  category: IngredientCategory;
}

export interface Recipe {
  id: string;
  name: string;
  timeMinutes: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  ingredients: RecipeIngredient[];
  steps: string[];
  matchScore: number;
}

export interface ShoppingItem {
  name: string;
  quantity: number;
  unit: Unit;
  category: IngredientCategory;
  note?: string;
}

export interface ShoppingListData {
  id: string;
  recipeId: string;
  recipeName: string;
  items: ShoppingItem[];
  createdAt: string;
}

export const CATEGORY_LABEL: Record<IngredientCategory, string> = {
  vegetable: '蔬菜',
  fruit: '水果',
  meat: '肉类',
  seafood: '海鲜',
  dairy: '乳制品',
  grain: '主食',
  seasoning: '调料',
  other: '其他',
};

export const PREFERENCE_LABEL: Record<PreferenceTag, string> = {
  quick: '快手菜',
  'low-calorie': '低卡',
  spicy: '辣',
  homestyle: '家常',
  healthy: '健康',
  vegetarian: '素食',
  seafood: '海鲜',
  meat: '肉类',
  vegetable: '蔬菜',
};
