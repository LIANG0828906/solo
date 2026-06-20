export interface User {
  id: string;
  name: string;
  avatar: string;
}

export type IngredientCategory = 'meat' | 'vegetable' | 'seasoning' | 'other';

export interface Ingredient {
  name: string;
  amount: string;
  category: IngredientCategory;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  image: string;
  ingredients: Ingredient[];
  steps: string[];
  author: User;
  likes: number;
  views: number;
  createdAt: string;
}

export interface MatchedRecipe extends Recipe {
  matchScore: number;
  matchPercentage: number;
}

export interface CreateRecipeInput {
  title: string;
  description: string;
  image: string;
  ingredients: Ingredient[];
  steps: string[];
}

export interface StoreState {
  recipes: Recipe[];
  currentRecipe: Recipe | null;
  searchKeyword: string;
  searchResults: Recipe[];
  favorites: string[];
  isLoading: boolean;
  setRecipes: (recipes: Recipe[]) => void;
  setCurrentRecipe: (recipe: Recipe | null) => void;
  setSearchKeyword: (keyword: string) => void;
  setSearchResults: (results: Recipe[]) => void;
  toggleFavorite: (recipeId: string) => void;
  addRecipe: (recipe: Recipe) => void;
  incrementLikes: (recipeId: string) => void;
  setIsLoading: (loading: boolean) => void;
  fetchRecipes: () => Promise<void>;
  fetchRecipeById: (id: string) => Promise<void>;
  performSearch: (keyword: string) => Promise<void>;
  publishRecipe: (input: CreateRecipeInput) => Promise<Recipe>;
  getFavoriteRecipes: () => Recipe[];
}
