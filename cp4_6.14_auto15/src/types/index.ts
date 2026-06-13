export type Cuisine = 'chinese' | 'western' | 'japanese' | 'korean' | 'italian' | 'french' | 'other';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

export interface IngredientItem {
  name: string;
  amount: string;
}

export interface RecipeStep {
  order: number;
  description: string;
  image?: string;
}

export interface IngredientDetail {
  id: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  unit: string;
}

export interface Comment {
  id: string;
  recipeId: string;
  author: string;
  content: string;
  rating: number;
  createdAt: string;
  avatarColor: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  images: string[];
  cuisine: Cuisine;
  difficulty: Difficulty;
  cookingTime: number;
  servings: number;
  calories: number;
  rating: number;
  ratingCount: number;
  author: string;
  authorAvatar: string;
  ingredients: IngredientItem[];
  steps: RecipeStep[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RecipeListResponse {
  data: Recipe[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
