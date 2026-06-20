import { create } from 'zustand';
import { Recipe, Favorite, recipesApi } from '@/api/recipesApi';

interface RecipesState {
  recipes: Recipe[];
  loading: boolean;
  searchQuery: string;
  currentTags: string[];
  favorites: Favorite[];
  favoriteRecipeIds: Set<string>;
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  recommendations: Recipe[];
  fetchRecipes: (reset?: boolean) => Promise<void>;
  setSearchQuery: (query: string) => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  clearTags: () => void;
  loadMoreRecipes: () => Promise<void>;
  fetchFavorites: () => Promise<void>;
  toggleFavorite: (recipeId: string) => Promise<void>;
  isFavorite: (recipeId: string) => boolean;
  fetchRecommendations: () => Promise<void>;
}

export const useRecipesStore = create<RecipesState>((set, get) => ({
  recipes: [],
  loading: false,
  searchQuery: '',
  currentTags: [],
  favorites: [],
  favoriteRecipeIds: new Set<string>(),
  page: 1,
  pageSize: 12,
  total: 0,
  hasMore: false,
  recommendations: [],

  fetchRecipes: async (reset = false) => {
    set({ loading: true });
    const { searchQuery, currentTags, pageSize } = get();
    const newPage = reset ? 1 : get().page;

    const params: Record<string, string | number> = {
      page: newPage,
      page_size: pageSize,
    };

    if (searchQuery.trim()) {
      params.search = searchQuery.trim();
    }

    if (currentTags.length > 0) {
      params.tags = currentTags.join(',');
    }

    const result = await recipesApi.getRecipes(params);

    if (reset) {
      set({
        recipes: result.recipes,
        total: result.total,
        page: 1,
        hasMore: (newPage * pageSize) < result.total,
      });
    } else {
      set((state) => ({
        recipes: [...state.recipes, ...result.recipes],
        total: result.total,
        hasMore: (newPage * pageSize) < result.total,
      }));
    }

    set({ loading: false });
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  addTag: (tag: string) => {
    set((state) => {
      if (state.currentTags.includes(tag)) return state;
      return { currentTags: [...state.currentTags, tag] };
    });
  },

  removeTag: (tag: string) => {
    set((state) => ({
      currentTags: state.currentTags.filter((t) => t !== tag),
    }));
  },

  clearTags: () => {
    set({ currentTags: [] });
  },

  loadMoreRecipes: async () => {
    const { loading, hasMore } = get();
    if (loading || !hasMore) return;

    set((state) => ({ page: state.page + 1 }));
    await get().fetchRecipes(false);
  },

  fetchFavorites: async () => {
    const favorites = await recipesApi.getFavorites();
    const ids = new Set(favorites.map((f) => f.recipe_id));
    set({
      favorites,
      favoriteRecipeIds: ids,
    });
  },

  toggleFavorite: async (recipeId: string) => {
    const state = get();
    if (state.favoriteRecipeIds.has(recipeId)) {
      const fav = state.favorites.find((f) => f.recipe_id === recipeId);
      if (fav) {
        await recipesApi.removeFavorite(fav.id);
        set((s) => {
          const newFavs = s.favorites.filter((f) => f.id !== fav.id);
          const newIds = new Set(s.favoriteRecipeIds);
          newIds.delete(recipeId);
          return { favorites: newFavs, favoriteRecipeIds: newIds };
        });
      }
    } else {
      const result = await recipesApi.addFavorite(recipeId);
      if (result) {
        set((s) => {
          const newIds = new Set(s.favoriteRecipeIds);
          newIds.add(recipeId);
          return {
            favorites: [...s.favorites, result],
            favoriteRecipeIds: newIds,
          };
        });
      }
    }
  },

  isFavorite: (recipeId: string) => {
    return get().favoriteRecipeIds.has(recipeId);
  },

  fetchRecommendations: async () => {
    const recs = await recipesApi.getRecommendations();
    set({ recommendations: recs });
  },
}));
