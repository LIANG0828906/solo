export type Unit = 'g' | 'ml' | 'piece';

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: Unit;
  expirationDate: string;
  createdAt: string;
}

export interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: Unit;
}

export interface CookingStep {
  step: number;
  description: string;
  duration: number;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  cookTime: number;
  ingredients: RecipeIngredient[];
  steps: CookingStep[];
  image?: string;
}

export interface RecipeRecommendation {
  recipe: Recipe;
  matchPercentage: number;
  matchedIngredients: string[];
  missingIngredients: string[];
}

export interface CookingHistory {
  id: string;
  recipeId: string;
  recipeName: string;
  date: string;
  completed: boolean;
}
