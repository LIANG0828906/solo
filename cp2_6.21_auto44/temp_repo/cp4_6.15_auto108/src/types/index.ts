export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface RecipeStep {
  id: string;
  order: number;
  description: string;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  cookTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  ingredients: Ingredient[];
  steps: RecipeStep[];
  baseServings: number;
  matchScore: number;
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}
