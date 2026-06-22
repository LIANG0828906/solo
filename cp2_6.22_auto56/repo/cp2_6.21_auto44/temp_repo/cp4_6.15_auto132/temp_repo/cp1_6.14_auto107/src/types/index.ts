export interface Ingredient {
  id: string;
  name: string;
  baseAmount: number;
  unit: string;
  price: number;
  moisture: number;
  calories: number;
  adjustment: number;
}

export interface Step {
  id: string;
  title: string;
  description: string;
  duration: number;
  timerActive: boolean;
  timerPaused: boolean;
  timeRemaining: number;
  notes: string;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  difficulty: 1 | 2 | 3;
  totalTime: number;
  image: string;
  isFavorite: boolean;
  ingredients: Ingredient[];
  steps: Step[];
  baseCost: number;
  baseMoisture: number;
  baseCalories: number;
  baseSoftness: number;
}

export interface MenuRecipe {
  recipeId: string;
  recipeName: string;
  order: number;
  totalTime: number;
  color: string;
}

export interface Menu {
  id: string;
  name: string;
  recipes: MenuRecipe[];
  totalTime: number;
}
