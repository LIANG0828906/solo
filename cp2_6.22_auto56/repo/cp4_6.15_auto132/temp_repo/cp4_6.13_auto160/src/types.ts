export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  price: number;
}

export interface Nutrition {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface RecipeSummary {
  id: string;
  name: string;
  author: string;
  calories: number;
  likes: number;
}

export interface Recipe extends RecipeSummary {
  ingredients: Ingredient[];
  steps: string;
  category: string;
  imageUrl: string;
  nutrition: Nutrition;
  totalCost: number;
  createdAt: string;
}

export interface CreateRecipeRequest {
  name: string;
  author: string;
  ingredients: Ingredient[];
  steps: string;
  category: string;
  imageUrl: string;
}

export const CATEGORIES = ['早餐', '午餐', '晚餐', '甜品', '饮品'] as const;
export type Category = typeof CATEGORIES[number];
