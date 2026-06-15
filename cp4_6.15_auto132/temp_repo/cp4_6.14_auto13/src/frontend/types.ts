export interface Ingredient {
  name: string;
  amount: string;
  category: string;
}

export interface MealAssignment {
  name: string;
  cookTime: number;
  ingredients: Ingredient[];
  steps: string[];
  cuisine: string;
}

export interface Member {
  id: string;
  name: string;
  restrictions: string[];
  cuisinePrefs: string[];
  availability: boolean[][];
}

export type MealGrid = (MealAssignment | null)[][]; // 7 days x 3 meals
