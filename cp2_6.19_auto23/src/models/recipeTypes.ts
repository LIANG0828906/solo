export interface Ingredient {
  name: string;
  quantity: string;
}

export interface RecipeStep {
  order: number;
  content: string;
  image?: string;
}

export interface Comment {
  id: string;
  recipeId: string;
  userId: string;
  userName: string;
  content: string;
  rating: number;
  createdAt: number;
}

export interface UserProfile {
  id: string;
  name: string;
}

export interface Recipe {
  id: string;
  title: string;
  coverImage: string;
  description: string;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  cookTime: number;
  category: string;
  authorId: string;
  authorName: string;
  createdAt: number;
  updatedAt: number;
}
