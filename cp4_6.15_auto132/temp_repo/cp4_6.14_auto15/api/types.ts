export interface IngredientItem {
  name: string;
  amount: string;
}

export interface RecipeStep {
  step: number;
  description: string;
  image?: string;
}

export type Cuisine = 'chinese' | 'western' | 'japanese' | 'korean' | 'italian' | 'french' | 'other';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Recipe {
  id: string;
  name: string;
  thumbnail: string;
  image: string;
  cuisine: Cuisine;
  difficulty: Difficulty;
  rating: number;
  ratingCount: number;
  cookTime: number;
  description: string;
  ingredients: IngredientItem[];
  steps: RecipeStep[];
  tags: string[];
  createdAt: string;
}

export interface IngredientDetail {
  name: string;
  origin: string;
  substitutes: string[];
  description: string;
}

export interface Comment {
  id: string;
  recipeId: string;
  username: string;
  avatarColor: string;
  content: string;
  createdAt: string;
}
