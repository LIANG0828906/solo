import { create } from 'zustand';
import type { Ingredient, Recipe } from '../api/recipeApi';

interface AppState {
  ingredients: Ingredient[];
  recipes: Recipe[];
  favorites: string[];
  showFavoritesOnly: boolean;
  shoppingListRecipe: Recipe | null;
  isShoppingListOpen: boolean;
  isLoading: boolean;
  addIngredient: (ingredient: Ingredient) => void;
  removeIngredient: (id: string) => void;
  setRecipes: (recipes: Recipe[]) => void;
  toggleFavorite: (recipeId: string) => void;
  setShowFavoritesOnly: (show: boolean) => void;
  openShoppingList: (recipe: Recipe) => void;
  closeShoppingList: () => void;
  setIsLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  ingredients: [],
  recipes: [],
  favorites: [],
  showFavoritesOnly: false,
  shoppingListRecipe: null,
  isShoppingListOpen: false,
  isLoading: false,
  addIngredient: (ingredient) =>
    set((state) => ({ ingredients: [...state.ingredients, ingredient] })),
  removeIngredient: (id) =>
    set((state) => ({
      ingredients: state.ingredients.filter((ing) => ing.id !== id),
    })),
  setRecipes: (recipes) => set({ recipes }),
  toggleFavorite: (recipeId) =>
    set((state) => ({
      favorites: state.favorites.includes(recipeId)
        ? state.favorites.filter((id) => id !== recipeId)
        : [...state.favorites, recipeId],
    })),
  setShowFavoritesOnly: (show) => set({ showFavoritesOnly: show }),
  openShoppingList: (recipe) =>
    set({ shoppingListRecipe: recipe, isShoppingListOpen: true }),
  closeShoppingList: () => set({ isShoppingListOpen: false }),
  setIsLoading: (loading) => set({ isLoading: loading }),
}));
