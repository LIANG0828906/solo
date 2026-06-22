import { create } from 'zustand';
import { Recipe, StoreState } from '../shared/types';
import { getRecipes, getRecipeById, searchRecipes, createRecipe, CreateRecipeInput, incrementRecipeLikes } from '../data/mockApi';

const useStore = create<StoreState>((set, get) => ({
  recipes: [],
  currentRecipe: null,
  searchKeyword: '',
  searchResults: [],
  favorites: [],
  isLoading: false,

  setRecipes: (recipes: Recipe[]) => set({ recipes }),
  setCurrentRecipe: (recipe: Recipe | null) => set({ currentRecipe: recipe }),
  setSearchKeyword: (keyword: string) => set({ searchKeyword: keyword }),
  setSearchResults: (results: Recipe[]) => set({ searchResults: results }),
  setIsLoading: (loading: boolean) => set({ isLoading: loading }),

  toggleFavorite: (recipeId: string) => {
    const { favorites } = get();
    if (favorites.includes(recipeId)) {
      set({ favorites: favorites.filter(id => id !== recipeId) });
    } else {
      set({ favorites: [...favorites, recipeId] });
    }
  },

  addRecipe: (recipe: Recipe) => set(state => ({ recipes: [recipe, ...state.recipes] })),

  incrementLikes: (recipeId: string) => {
    set(state => ({
      recipes: state.recipes.map(r =>
        r.id === recipeId ? { ...r, likes: r.likes + 1 } : r
      ),
      currentRecipe: state.currentRecipe?.id === recipeId
        ? { ...state.currentRecipe, likes: state.currentRecipe.likes + 1 }
        : state.currentRecipe
    }));
    incrementRecipeLikes(recipeId);
  },

  fetchRecipes: async () => {
    set({ isLoading: true });
    try {
      const data = await getRecipes();
      set({ recipes: data });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchRecipeById: async (id: string) => {
    set({ isLoading: true });
    try {
      const data = await getRecipeById(id);
      set({ currentRecipe: data });
      if (data) {
        set(state => ({
          recipes: state.recipes.map(r => (r.id === id ? data : r))
        }));
      }
    } finally {
      set({ isLoading: false });
    }
  },

  performSearch: async (keyword: string) => {
    set({ searchKeyword: keyword });
    if (!keyword.trim()) {
      set({ searchResults: [] });
      return;
    }
    const results = await searchRecipes(keyword);
    set({ searchResults: results });
  },

  publishRecipe: async (input: CreateRecipeInput) => {
    set({ isLoading: true });
    try {
      const newRecipe = await createRecipe(input);
      set(state => ({ recipes: [newRecipe, ...state.recipes] }));
      return newRecipe;
    } finally {
      set({ isLoading: false });
    }
  },

  getFavoriteRecipes: () => {
    const { favorites, recipes } = get();
    return recipes.filter(r => favorites.includes(r.id));
  }
}));

export default useStore;
