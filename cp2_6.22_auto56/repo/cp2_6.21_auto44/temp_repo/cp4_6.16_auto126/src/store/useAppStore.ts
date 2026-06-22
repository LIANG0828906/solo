import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Recipe, Review, ViewMode, ToastMessage } from '@/types';
import { generateMockRecipes } from '@/data/mockRecipes';
import {
  getStoredRecipes,
  storeRecipes,
  getStoredFavorites,
  storeFavorites,
  getStoredMyRecipes,
  storeMyRecipes,
  getStoredReviews,
  storeReviews,
} from '@/utils/db';

interface AppState {
  recipes: Recipe[];
  favorites: string[];
  myRecipeIds: string[];
  reviews: Review[];
  viewMode: ViewMode;
  searchQuery: string;
  selectedIngredients: string[];
  toasts: ToastMessage[];
  isLoading: boolean;
  selectedRecipeId: string | null;
  isCreateModalOpen: boolean;

  initializeData: () => Promise<void>;
  setViewMode: (mode: ViewMode) => void;
  setSearchQuery: (query: string) => void;
  toggleIngredientFilter: (ingredientId: string) => void;
  clearIngredientFilters: () => void;

  toggleFavorite: (recipeId: string) => void;
  addRecipe: (recipe: Recipe) => void;
  deleteRecipe: (recipeId: string) => void;
  rateRecipe: (recipeId: string, rating: number, comment?: string) => void;

  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;

  setSelectedRecipeId: (id: string | null) => void;
  setIsCreateModalOpen: (open: boolean) => void;

  getFilteredRecipes: () => Recipe[];
}

export const useAppStore = create<AppState>((set, get) => ({
  recipes: [],
  favorites: [],
  myRecipeIds: [],
  reviews: [],
  viewMode: 'all',
  searchQuery: '',
  selectedIngredients: [],
  toasts: [],
  isLoading: true,
  selectedRecipeId: null,
  isCreateModalOpen: false,

  initializeData: async () => {
    set({ isLoading: true });

    let [storedRecipes, storedFavorites, storedMyRecipes, storedReviews] =
      await Promise.all([
        getStoredRecipes(),
        getStoredFavorites(),
        getStoredMyRecipes(),
        getStoredReviews(),
      ]);

    if (storedRecipes.length === 0) {
      storedRecipes = generateMockRecipes();
      await storeRecipes(storedRecipes);
    }

    set({
      recipes: storedRecipes,
      favorites: storedFavorites,
      myRecipeIds: storedMyRecipes,
      reviews: storedReviews,
      isLoading: false,
    });
  },

  setViewMode: (mode) => {
    set({ viewMode: mode, selectedRecipeId: null });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  toggleIngredientFilter: (ingredientId) => {
    set((state) => {
      const selected = state.selectedIngredients.includes(ingredientId)
        ? state.selectedIngredients.filter((id) => id !== ingredientId)
        : [...state.selectedIngredients, ingredientId];
      return { selectedIngredients: selected };
    });
  },

  clearIngredientFilters: () => {
    set({ selectedIngredients: [] });
  },

  toggleFavorite: async (recipeId) => {
    set((state) => {
      const isFav = state.favorites.includes(recipeId);
      const newFavorites = isFav
        ? state.favorites.filter((id) => id !== recipeId)
        : [...state.favorites, recipeId];

      storeFavorites(newFavorites);

      get().addToast(
        isFav ? '已取消收藏' : '已添加到收藏夹',
        'success'
      );

      return { favorites: newFavorites };
    });
  },

  addRecipe: async (recipe) => {
    set((state) => {
      const newRecipes = [recipe, ...state.recipes];
      const newMyRecipeIds = [recipe.id, ...state.myRecipeIds];

      storeRecipes(newRecipes);
      storeMyRecipes(newMyRecipeIds);

      get().addToast('配方创建成功！', 'success');

      return {
        recipes: newRecipes,
        myRecipeIds: newMyRecipeIds,
      };
    });
  },

  deleteRecipe: async (recipeId) => {
    set((state) => {
      const newRecipes = state.recipes.filter((r) => r.id !== recipeId);
      const newMyRecipeIds = state.myRecipeIds.filter((id) => id !== recipeId);
      const newFavorites = state.favorites.filter((id) => id !== recipeId);

      storeRecipes(newRecipes);
      storeMyRecipes(newMyRecipeIds);
      storeFavorites(newFavorites);

      get().addToast('配方已删除', 'info');

      return {
        recipes: newRecipes,
        myRecipeIds: newMyRecipeIds,
        favorites: newFavorites,
        selectedRecipeId: null,
      };
    });
  },

  rateRecipe: (recipeId, rating, comment) => {
    set((state) => {
      const recipeIndex = state.recipes.findIndex((r) => r.id === recipeId);
      if (recipeIndex === -1) return state;

      const recipe = state.recipes[recipeIndex];
      const newRatingCount = recipe.ratingCount + 1;
      const newRating =
        (recipe.rating * recipe.ratingCount + rating) / newRatingCount;

      const newRecipes = [...state.recipes];
      newRecipes[recipeIndex] = {
        ...recipe,
        rating: Math.round(newRating * 10) / 10,
        ratingCount: newRatingCount,
      };

      const newReview: Review = {
        id: uuidv4(),
        recipeId,
        userId: 'user-1',
        userName: '我',
        rating,
        comment: comment || '',
        createdAt: Date.now(),
      };

      const newReviews = [newReview, ...state.reviews];

      storeRecipes(newRecipes);
      storeReviews(newReviews);

      get().addToast('评价提交成功！', 'success');

      return {
        recipes: newRecipes,
        reviews: newReviews,
      };
    });
  },

  addToast: (message, type) => {
    const id = uuidv4();

    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));

    setTimeout(() => {
      get().removeToast(id);
    }, 3000);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  setSelectedRecipeId: (id) => {
    set({ selectedRecipeId: id });
  },

  setIsCreateModalOpen: (open) => {
    set({ isCreateModalOpen: open });
  },

  getFilteredRecipes: () => {
    const state = get();
    let recipes = [...state.recipes];

    if (state.viewMode === 'favorites') {
      recipes = recipes.filter((r) => state.favorites.includes(r.id));
    } else if (state.viewMode === 'my-recipes') {
      recipes = recipes.filter((r) => state.myRecipeIds.includes(r.id));
    }

    if (state.searchQuery.trim()) {
      const query = state.searchQuery.toLowerCase();
      recipes = recipes.filter(
        (r) =>
          r.name.toLowerCase().includes(query) ||
          r.description.toLowerCase().includes(query) ||
          r.author.toLowerCase().includes(query)
      );
    }

    if (state.selectedIngredients.length > 0) {
      recipes = recipes.filter((r) =>
        state.selectedIngredients.some((id) =>
          r.mainIngredients.some((ing) => ing.ingredientId === id)
        )
      );
    }

    return recipes;
  },
}));
