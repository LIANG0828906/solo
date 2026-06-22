export interface Ingredient {
  name: string;
  amount: string;
}

export interface Step {
  description: string;
  image?: string;
}

export interface Recipe {
  id: string;
  name: string;
  image: string;
  difficulty: number;
  cookTime: number;
  ingredients: Ingredient[];
  steps: Step[];
  category: string;
  isFavorite: boolean;
  createdAt: number;
}

export type CreateRecipeDto = Omit<Recipe, 'id' | 'isFavorite' | 'createdAt'>;
