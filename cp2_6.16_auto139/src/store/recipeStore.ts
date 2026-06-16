import { create } from 'zustand';
import { get, set } from 'idb-keyval';
import { Recipe, Favorite, HistoryItem } from '../types';
import { mockRecipes } from '../data/mockRecipes';

interface RecipeState {
  recipes: Recipe[];
  searchQuery: string;
  searchIngredients: string[];
  filteredRecipes: Recipe[];
  favorites: Favorite[];
  history: HistoryItem[];
  initStore: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  addSearchIngredient: (ingredient: string) => void;
  removeSearchIngredient: (ingredient: string) => void;
  clearSearchIngredients: () => void;
  searchRecipes: () => void;
  getRecipeById: (id: string) => Recipe | undefined;
  toggleFavorite: (recipeId: string) => Promise<void>;
  isFavorite: (recipeId: string) => boolean;
  addToHistory: (recipeId: string) => Promise<void>;
  getRecentHistory: (limit?: number) => Recipe[];
}

export const useRecipeStore = create<RecipeState>((set, getState) => ({
  recipes: [],
  searchQuery: '',
  searchIngredients: [],
  filteredRecipes: [],
  favorites: [],
  history: [],

  initStore: async () => {
    const storedFavorites = await get<Favorite[]>('favorites');
    const storedHistory = await get<HistoryItem[]>('history');
    
    set({
      recipes: mockRecipes,
      filteredRecipes: mockRecipes,
      favorites: storedFavorites || [],
      history: storedHistory || [],
    });
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  addSearchIngredient: (ingredient) => {
    const { searchIngredients } = getState();
    if (!searchIngredients.includes(ingredient)) {
      set({ searchIngredients: [...searchIngredients, ingredient] });
    }
  },

  removeSearchIngredient: (ingredient) => {
    const { searchIngredients } = getState();
    set({ searchIngredients: searchIngredients.filter((i) => i !== ingredient) });
  },

  clearSearchIngredients: () => set({ searchIngredients: [] }),

  searchRecipes: () => {
    const { recipes, searchQuery, searchIngredients } = getState();
    
    let filtered = recipes;

    if (searchQuery.trim()) {
      filtered = filtered.filter((recipe) =>
        recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.ingredients.some((ing) =>
          ing.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    if (searchIngredients.length > 0) {
      filtered = filtered.filter((recipe) => {
        const recipeIngredientNames = recipe.ingredients.map((ing) => ing.name);
        return searchIngredients.some((searchIng) =>
          recipeIngredientNames.includes(searchIng)
        );
      }).sort((a, b) => {
        const aMatchCount = a.ingredients.filter((ing) =>
          searchIngredients.includes(ing.name)
        ).length;
        const bMatchCount = b.ingredients.filter((ing) =>
          searchIngredients.includes(ing.name)
        ).length;
        return bMatchCount - aMatchCount;
      });
    }

    set({ filteredRecipes: filtered });
  },

  getRecipeById: (id) => {
    const { recipes } = getState();
    return recipes.find((r) => r.id === id);
  },

  toggleFavorite: async (recipeId) => {
    const { favorites } = getState();
    const exists = favorites.find((f) => f.recipeId === recipeId);
    
    let newFavorites: Favorite[];
    if (exists) {
      newFavorites = favorites.filter((f) => f.recipeId !== recipeId);
    } else {
      newFavorites = [
        { recipeId, addedAt: new Date().toISOString() },
        ...favorites,
      ];
    }
    
    set({ favorites: newFavorites });
    await set('favorites', newFavorites);
  },

  isFavorite: (recipeId) => {
    const { favorites } = getState();
    return favorites.some((f) => f.recipeId === recipeId);
  },

  addToHistory: async (recipeId) => {
    const { history } = getState();
    const filtered = history.filter((h) => h.recipeId !== recipeId);
    const newHistory = [
      { recipeId, viewedAt: new Date().toISOString() },
      ...filtered,
    ].slice(0, 50);
    
    set({ history: newHistory });
    await set('history', newHistory);
  },

  getRecentHistory: (limit = 10) => {
    const { history, recipes } = getState();
    return history
      .slice(0, limit)
      .map((h) => recipes.find((r) => r.id === h.recipeId))
      .filter((r): r is Recipe => r !== undefined);
  },
}));
