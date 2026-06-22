export interface RecipeAuthor {
  id: string;
  name: string;
  avatar: string;
}

export interface Ingredient {
  name: string;
  amount: string;
  prepared: string;
}

export interface Step {
  step: number;
  content: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  author: RecipeAuthor;
  ingredients: Ingredient[];
  steps: Step[];
  tags: string[];
  rating: number;
  ratingCount: number;
  commentCount: number;
  createdAt: string;
}

export interface Comment {
  id: string;
  recipeId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: string;
}

export interface RecipeListResponse {
  total: number;
  page: number;
  limit: number;
  data: Recipe[];
}

export interface RateResponse {
  rating: number;
  ratingCount: number;
}

export interface AddCommentRequest {
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
}
