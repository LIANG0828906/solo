import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Recipe, UserRating, Comment, CuisineType, DifficultyType } from '../types/recipe';
import { mockRecipes } from '../data/mockRecipes';

interface RecipeState {
  recipes: Recipe[];
  favorites: string[];
  userRatings: UserRating[];
  searchQuery: string;
  cuisineFilter: CuisineType | 'all';
  difficultyFilter: DifficultyType | 'all';
  selectedRecipe: Recipe | null;
  showFavorites: boolean;
  
  setSearchQuery: (query: string) => void;
  setCuisineFilter: (cuisine: CuisineType | 'all') => void;
  setDifficultyFilter: (difficulty: DifficultyType | 'all') => void;
  toggleFavorite: (recipeId: string) => void;
  rateRecipe: (recipeId: string, rating: number) => void;
  selectRecipe: (recipe: Recipe | null) => void;
  toggleShowFavorites: () => void;
  addComment: (recipeId: string, text: string) => void;
  
  getFilteredRecipes: () => Recipe[];
  getFavoriteRecipes: () => Recipe[];
}

export const useRecipeStore = create<RecipeState>()(
  persist(
    (set, get) => ({
      recipes: mockRecipes,
      favorites: [],
      userRatings: [],
      searchQuery: '',
      cuisineFilter: 'all',
      difficultyFilter: 'all',
      selectedRecipe: null,
      showFavorites: false,

      setSearchQuery: (query) => set({ searchQuery: query }),
      setCuisineFilter: (cuisine) => set({ cuisineFilter: cuisine }),
      setDifficultyFilter: (difficulty) => set({ difficultyFilter: difficulty }),

      toggleFavorite: (recipeId) =>
        set((state) => ({
          favorites: state.favorites.includes(recipeId)
            ? state.favorites.filter((id) => id !== recipeId)
            : [...state.favorites, recipeId],
        })),

      rateRecipe: (recipeId, rating) =>
        set((state) => {
          const existingRating = state.userRatings.find((r) => r.recipeId === recipeId);
          let newRatings;
          if (existingRating) {
            newRatings = state.userRatings.map((r) =>
              r.recipeId === recipeId ? { ...r, rating } : r
            );
          } else {
            newRatings = [...state.userRatings, { recipeId, rating }];
          }
          return { userRatings: newRatings };
        }),

      selectRecipe: (recipe) => set({ selectedRecipe: recipe }),
      toggleShowFavorites: () => set((state) => ({ showFavorites: !state.showFavorites })),

      addComment: (recipeId, text) =>
        set((state) => {
          const newComment: Comment = {
            id: `c${Date.now()}`,
            text,
            timestamp: Date.now(),
          };
          return {
            recipes: state.recipes.map((recipe) =>
              recipe.id === recipeId
                ? { ...recipe, comments: [...recipe.comments, newComment] }
                : recipe
            ),
            selectedRecipe:
              state.selectedRecipe?.id === recipeId
                ? {
                    ...state.selectedRecipe,
                    comments: [...state.selectedRecipe.comments, newComment],
                  }
                : state.selectedRecipe,
          };
        }),

      getFilteredRecipes: () => {
        const state = get();
        return state.recipes.filter((recipe) => {
          if (state.cuisineFilter !== 'all' && recipe.cuisine !== state.cuisineFilter) {
            return false;
          }
          if (state.difficultyFilter !== 'all' && recipe.difficulty !== state.difficultyFilter) {
            return false;
          }
          if (state.searchQuery) {
            const query = state.searchQuery.toLowerCase();
            const nameMatch = recipe.name.toLowerCase().includes(query);
            const tagMatch = recipe.tags.some((tag) => tag.toLowerCase().includes(query));
            const descMatch = recipe.description.toLowerCase().includes(query);
            if (!nameMatch && !tagMatch && !descMatch) {
              return false;
            }
          }
          return true;
        });
      },

      getFavoriteRecipes: () => {
        const state = get();
        return state.recipes.filter((recipe) => state.favorites.includes(recipe.id));
      },
    }),
    {
      name: 'recipe-app-storage',
      partialize: (state) => ({
        favorites: state.favorites,
        userRatings: state.userRatings,
        recipes: state.recipes,
      }),
    }
  )
);
