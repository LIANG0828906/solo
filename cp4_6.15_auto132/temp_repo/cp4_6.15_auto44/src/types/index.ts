export type Category = '蔬菜' | '水果' | '肉类' | '蛋奶' | '调料' | '其他';

export type Zone = '冷藏' | '冷冻';

export interface Ingredient {
  id: string;
  name: string;
  category: Category;
  quantity: number;
  unit: string;
  expiryDate: string;
  zone: Zone;
  createdAt: string;
}

export interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface Recipe {
  id: string;
  name: string;
  difficulty: '简单' | '中等' | '复杂';
  cookTime: number;
  ingredients: RecipeIngredient[];
  steps: string[];
}

export type WasteType = 'consumed' | 'wasted';

export interface WasteRecord {
  id: string;
  ingredientName: string;
  category: Category;
  quantity: number;
  unit: string;
  date: string;
  type: WasteType;
}

export const CategoryEmoji: Record<Category, string> = {
  '蔬菜': '🥬',
  '水果': '🍎',
  '肉类': '🥩',
  '蛋奶': '🍳',
  '调料': '🧂',
  '其他': '📦',
};
