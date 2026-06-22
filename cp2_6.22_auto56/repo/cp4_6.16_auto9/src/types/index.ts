export interface Ingredient {
  name: string;
  amount: string;
}

export interface Recipe {
  id: string;
  title: string;
  image: string;
  ingredients: Ingredient[];
  steps: string[];
  tags: string[];
  cookTime: number;
  authorId: string;
  authorName: string;
  isPublic: boolean;
  createdAt: number;
  favorites: number;
}

export interface Comment {
  id: string;
  recipeId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  parentId: string | null;
  replyToUser?: string;
  replyToUserId?: string;
  createdAt: number;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
}

export interface SearchResult {
  recipe: Recipe;
  matchScore: number;
  matchedIngredients: string[];
  missingIngredients: string[];
}

export type TimeFilter = 'all' | 'quick' | 'medium' | 'slow';

export interface RecipeFilters {
  tags: string[];
  timeRange: TimeFilter;
  keyword?: string;
}
