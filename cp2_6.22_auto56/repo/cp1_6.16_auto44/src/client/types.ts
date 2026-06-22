export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category?: string;
}

export interface Step {
  id: string;
  order: number;
  description: string;
  duration?: number;
  tips?: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  images?: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  tags?: string[];
  ingredients: Ingredient[];
  steps: Step[];
  authorId: string;
  authorName?: string;
  isFavorite: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  recipeIds: string[];
  recipes?: Recipe[];
  authorId: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingListItem {
  id: string;
  ingredientId?: string;
  name: string;
  amount: number;
  unit: string;
  category?: string;
  isChecked: boolean;
  recipeId?: string;
  recipeTitle?: string;
  addedAt: string;
}

export interface Stats {
  totalRecipes: number;
  totalCollections: number;
  totalIngredients: number;
  favoriteRecipes: number;
  cookingTimeThisWeek: number;
  completedRecipes: number;
}
