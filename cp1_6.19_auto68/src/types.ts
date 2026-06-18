export type CookingMethod = 'fry' | 'stir-fry' | 'steam' | 'roast' | 'stew' | 'cold';

export interface IngredientEntry {
  id: string;
  name: string;
  emoji: string;
  color: string;
  grams: number;
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
}

export interface Recipe {
  id: string;
  name: string;
  cookingMethod: CookingMethod | null;
  ingredients: IngredientEntry[];
}
