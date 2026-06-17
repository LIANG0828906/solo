export interface Ingredient {
  id: string;
  name: string;
  icon: string;
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  cookingTime: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  tags: string[];
  steps: string[];
  isVegetarian: boolean;
  allergens: string[];
}

export type DietType = 'unlimited' | 'vegetarian' | 'lowCalorie' | 'highProtein';

export interface Preferences {
  dietType: DietType;
  allergens: string[];
}

export interface RecommendationResult {
  recipe: Recipe;
  matchScore: number;
  matchedIngredients: string[];
  missingIngredients: string[];
}
