export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  note?: string;
}

export interface Recipe {
  id: string;
  name: string;
  image: string;
  description: string;
  author: string;
  cookTime: number;
  difficulty: 1 | 2 | 3;
  cuisine: string;
  isFavorite: boolean;
  ingredients: Ingredient[];
  steps: string[];
}

export interface ShoppingListItem {
  ingredientId: string;
  name: string;
  totalQuantity: number;
  unit: string;
  category: string;
  isPurchased: boolean;
  fromRecipes: string[];
}

export interface ShoppingList {
  id: string;
  createdAt: string;
  recipeIds: string[];
  recipeNames: string[];
  items: ShoppingListItem[];
}

export interface ShoppingListHistory {
  id: string;
  createdAt: string;
  recipeNames: string[];
}

export type CategoryKey = 'vegetables' | 'meat' | 'seafood' | 'dairy' | 'grains' | 'seasonings' | 'fruits' | 'others';

export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  vegetables: '蔬菜类',
  meat: '肉类',
  seafood: '海鲜类',
  dairy: '乳制品',
  grains: '谷物类',
  seasonings: '调料类',
  fruits: '水果类',
  others: '其他',
};

export const CUISINE_TYPES = [
  { id: 'all', name: '全部' },
  { id: 'sichuan', name: '川菜' },
  { id: 'cantonese', name: '粤菜' },
  { id: 'hunan', name: '湘菜' },
  { id: 'shandong', name: '鲁菜' },
  { id: 'home', name: '家常菜' },
  { id: 'western', name: '西餐' },
  { id: 'japanese', name: '日料' },
];
