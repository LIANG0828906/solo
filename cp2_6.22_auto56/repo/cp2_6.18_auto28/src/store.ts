import { create } from 'zustand';
import {
  MatchedRecipe,
  Recipe,
  calculateMatch,
  getAverageRating,
  recordRating,
  ingredientList,
} from './engine';

interface ShoppingItem {
  recipeId: string;
  recipeName: string;
  missingIngredients: string[];
}

interface AppState {
  ingredients: string[];
  recommendedRecipes: MatchedRecipe[];
  favoriteRecipes: string[];
  ratings: Record<string, number[]>;
  shoppingList: ShoppingItem[];
  currentPage: 'recommend' | 'favorites';
  detailRecipe: Recipe | null;

  addIngredient: (name: string) => void;
  removeIngredient: (name: string) => void;
  clearIngredients: () => void;
  calculateRecommendations: () => void;
  saveRecipe: (recipeId: string) => void;
  removeRecipe: (recipeId: string) => void;
  rateRecipe: (recipeId: string, score: number) => void;
  setCurrentPage: (page: 'recommend' | 'favorites') => void;
  setDetailRecipe: (recipe: Recipe | null) => void;
  generateShoppingList: (recipeId: string) => void;
  getFavoriteRecipes: () => MatchedRecipe[];
}

export const useAppStore = create<AppState>((set, get) => ({
  ingredients: [],
  recommendedRecipes: [],
  favoriteRecipes: [],
  ratings: {},
  shoppingList: [],
  currentPage: 'recommend',
  detailRecipe: null,

  addIngredient: (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const { ingredients } = get();
    if (ingredients.includes(trimmed)) return;
    set({ ingredients: [...ingredients, trimmed] });
  },

  removeIngredient: (name) => {
    const { ingredients } = get();
    set({ ingredients: ingredients.filter((i) => i !== name) });
  },

  clearIngredients: () => {
    set({ ingredients: [] });
  },

  calculateRecommendations: () => {
    const { ingredients } = get();
    const results = calculateMatch(ingredients);
    set({ recommendedRecipes: results });
  },

  saveRecipe: (recipeId) => {
    const { favoriteRecipes } = get();
    if (favoriteRecipes.length >= 50) return;
    if (favoriteRecipes.includes(recipeId)) return;
    set({ favoriteRecipes: [...favoriteRecipes, recipeId] });
  },

  removeRecipe: (recipeId) => {
    const { favoriteRecipes } = get();
    set({ favoriteRecipes: favoriteRecipes.filter((id) => id !== recipeId) });
  },

  rateRecipe: (recipeId, score) => {
    recordRating(recipeId, score);
    const { ratings, recommendedRecipes } = get();
    const newScores = [...(ratings[recipeId] || []), score];
    const newRatings = { ...ratings, [recipeId]: newScores };

    const updatedRecommended = recommendedRecipes.map((r) =>
      r.id === recipeId ? { ...r, averageRating: getAverageRating(recipeId) } : r
    );

    set({ ratings: newRatings, recommendedRecipes: updatedRecommended });
  },

  setCurrentPage: (page) => {
    set({ currentPage: page });
  },

  setDetailRecipe: (recipe) => {
    set({ detailRecipe: recipe });
  },

  generateShoppingList: (recipeId) => {
    const { ingredients } = get();
    const recipe = ingredientList.find((r) => r.id === recipeId);
    if (!recipe) return;

    const normalizedInput = ingredients.map((i) => i.toLowerCase());
    const missing = recipe.ingredients.filter(
      (ing) =>
        !normalizedInput.some(
          (input) => ing.toLowerCase().includes(input) || input.includes(ing.toLowerCase())
        )
    );

    const shoppingItem: ShoppingItem = {
      recipeId: recipe.id,
      recipeName: recipe.name,
      missingIngredients: missing,
    };

    set({ shoppingList: [shoppingItem] });
  },

  getFavoriteRecipes: () => {
    const { favoriteRecipes } = get();
    return favoriteRecipes
      .map((id) => {
        const recipe = ingredientList.find((r) => r.id === id);
        if (!recipe) return null;
        return {
          ...recipe,
          matchPercentage: 0,
          averageRating: getAverageRating(id),
        } as MatchedRecipe;
      })
      .filter(Boolean) as MatchedRecipe[];
  },
}));
