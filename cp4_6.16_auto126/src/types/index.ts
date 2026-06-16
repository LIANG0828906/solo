export interface Ingredient {
  id: string;
  name: string;
  category: 'protein' | 'vegetable' | 'grain' | 'dairy' | 'seasoning';
  color: string;
  icon: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}

export interface CookingMethod {
  id: string;
  name: string;
  icon: string;
  tempRange: string;
  duration: string;
}

export interface Seasoning {
  id: string;
  name: string;
  icon: string;
  color: string;
  caloriesPerGram: number;
}

export interface RecipeIngredient {
  ingredientId: string;
  amount: number;
}

export interface RecipeSeasoning {
  seasoningId: string;
  amount: number;
}

export interface Recipe {
  id: string;
  name: string;
  mainIngredients: RecipeIngredient[];
  cookingMethod: string;
  seasonings: RecipeSeasoning[];
  difficulty: 1 | 2 | 3;
  rating: number;
  ratingCount: number;
  createdAt: number;
  author: string;
  description: string;
  steps: string[];
  cuisine?: string;
}

export interface Review {
  id: string;
  recipeId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: number;
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export type ViewMode = 'all' | 'favorites' | 'my-recipes';

export interface SearchSuggestion {
  id: string;
  text: string;
  category: 'ingredient' | 'cuisine' | 'difficulty';
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
