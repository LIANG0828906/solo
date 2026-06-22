export type Difficulty = 'easy' | 'medium' | 'hard';

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Ingredient {
  id: string;
  name: string;
  quantity: string;
  unit: string;
}

export interface Step {
  id: string;
  order: number;
  description: string;
  imageUrl?: string;
  duration?: number;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: Difficulty;
  ingredients: Ingredient[];
  steps: Step[];
  tags: string[];
  authorId: string;
  author?: User;
  likes: number;
  views: number;
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  content: string;
  recipeId: string;
  userId: string;
  user?: User;
  parentId?: string;
  replies?: Comment[];
  likes: number;
  createdAt: string;
  updatedAt: string;
}
