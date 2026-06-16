export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface RecipeNote {
  id: string;
  content: string;
  rating: number;
  createdAt: string;
}

export interface Recipe {
  id: string;
  name: string;
  category: string;
  photoUrl: string;
  difficulty: number;
  estimatedTime: number;
  ingredients: Ingredient[];
  steps: string[];
  notes: RecipeNote[];
  createdAt: string;
}

export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface RecipeWithMatch extends Recipe {
  matchPercentage: number;
  canMake: boolean;
}

export const CATEGORIES = ['面包', '蛋糕', '饼干', '甜点', '其他'] as const;
export type Category = typeof CATEGORIES[number];
