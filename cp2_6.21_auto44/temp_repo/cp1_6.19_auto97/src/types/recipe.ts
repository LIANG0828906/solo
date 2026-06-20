export type CuisineType = 'chinese' | 'western' | 'japanese';
export type DifficultyType = 'easy' | 'medium' | 'hard';

export interface Comment {
  id: string;
  text: string;
  timestamp: number;
}

export interface Recipe {
  id: string;
  name: string;
  image: string;
  description: string;
  cuisine: CuisineType;
  difficulty: DifficultyType;
  tags: string[];
  rating: number;
  cookTime: number;
  ingredients: string[];
  steps: string[];
  comments: Comment[];
}

export interface UserRating {
  recipeId: string;
  rating: number;
}
