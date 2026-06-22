export interface Recipe {
  id: number;
  title: string;
  description: string;
  coverImage: string;
  authorId: number;
  authorName: string;
  authorAvatar?: string;
  rating: number;
  ratingCount: number;
  favoriteCount: number;
  createdAt: string;
}

export interface RecipeDetail extends Recipe {
  ingredients: { name: string; quantity: string }[];
  steps: { order: number; content: string; image?: string }[];
  tags: string[];
}

export interface MatchResult {
  recipe: RecipeDetail;
  matchScore: number;
  matchedIngredients: string[];
  missingIngredients: string[];
}

export interface Comment {
  id: number;
  recipeId: number;
  userId: number;
  username: string;
  avatar?: string;
  content: string;
  createdAt: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
}

export interface RecipeListResponse {
  recipes: Recipe[];
  total: number;
  page: number;
  hasMore: boolean;
}

export interface SearchResponse {
  recipes: Recipe[];
  suggestions: string[];
}

export interface MatchByIngredientsResponse {
  results: MatchResult[];
}

export interface CommentsResponse {
  comments: Comment[];
}
