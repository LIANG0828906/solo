export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface RecipeStep {
  id: string;
  order: number;
  description: string;
  imageUrl?: string;
}

export interface Comment {
  id: string;
  recipeId: string;
  userId: string;
  userName: string;
  content: string;
  rating: number;
  createdAt: string;
  parentId?: string;
  replies?: Comment[];
}

export interface Recipe {
  id: string;
  name: string;
  coverImage: string;
  description: string;
  prepTime: number;
  cookTime: number;
  totalTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  servings: number;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  author: string;
  createdAt: string;
  updatedAt: string;
  averageRating: number;
  totalRatings: number;
  tags: string[];
  comments: Comment[];
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  purchaseDate: string;
  expiryDate: string;
  category: string;
}

export type ExpiryStatus = 'fresh' | 'good' | 'warning' | 'danger' | 'expired';
