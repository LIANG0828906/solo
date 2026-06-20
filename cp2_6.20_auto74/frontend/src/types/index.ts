export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  expireDate: string;
  category: string;
}

export interface Nutrition {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
}

export interface RecipeStep {
  step: number;
  description: string;
  duration?: number;
}

export interface RecipeIngredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface Recipe {
  id: string;
  name: string;
  image: string;
  cookTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  matchScore: number;
  nutrition: Nutrition;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  tags: string[];
}

export interface MealPlanItem {
  id: string;
  recipeId: string;
  recipe: Recipe;
  mealType: 'breakfast' | 'lunch' | 'dinner';
}

export interface DayMealPlan {
  date: string;
  meals: MealPlanItem[];
}

export interface ShoppingItem {
  name: string;
  quantity: number;
  unit: string;
  needToBuy: number;
}
