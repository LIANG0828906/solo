export interface Ingredient {
  id: string;
  name: string;
  color: string;
  colorEnd: string;
  emoji: string;
}

export interface RecipeIngredient {
  id: string;
  name: string;
  required: boolean;
  quantity?: string;
}

export interface RecipeStep {
  stepNumber: number;
  description: string;
  tips?: string;
  duration?: number;
}

export interface RecipeSummary {
  id: string;
  name: string;
  ingredients: RecipeIngredient[];
  cookTime: number;
  calories: number;
  difficulty: 1 | 2 | 3;
  matchScore: number;
}

export interface RecipeDetail {
  id: string;
  name: string;
  description: string;
  ingredients: (RecipeIngredient & { quantity: string })[];
  cookTime: number;
  calories: number;
  difficulty: 1 | 2 | 3;
  servings: number;
  steps: RecipeStep[];
}
