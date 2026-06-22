export interface User {
  id: string;
  nickname: string;
  avatar: string;
  avatarColor: string;
  createdAt: string;
}

export interface Ingredient {
  id: string;
  name: string;
  quantity: string;
}

export interface Step {
  id: string;
  order: number;
  description: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  ingredients: Ingredient[];
  steps: Step[];
  tags: string[];
  cookingTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  rating: number;
  ratingCount: number;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  recipeId: string;
  userId: string;
  userName: string;
  userAvatarColor: string;
  content: string;
  createdAt: string;
}

export interface Favorite {
  id: string;
  userId: string;
  recipeId: string;
  createdAt: string;
}

export type ActivityType = 'create' | 'favorite' | 'comment';

export interface Activity {
  id: string;
  type: ActivityType;
  userId: string;
  userName: string;
  recipeId: string;
  recipeTitle: string;
  content?: string;
  createdAt: string;
}

export interface FormValidationError {
  field: string;
  message: string;
}

export interface RecipeCreateData {
  title: string;
  description: string;
  coverImage: string;
  ingredients: Omit<Ingredient, 'id'>[];
  steps: Omit<Step, 'id'>[];
  tags?: string[];
  cookingTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  authorId: string;
  authorName: string;
}

export type RecipeUpdateData = Partial<Omit<RecipeCreateData, 'authorId' | 'authorName'>>;

export interface Rating {
  id: string;
  userId: string;
  recipeId: string;
  rating: number;
  createdAt: string;
}
