import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get, set } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';
import { format, subDays, isAfter } from 'date-fns';
import type { Recipe, UserProfile, RecipeFilters, RecipeWithMatch, Comment, FlavorProfile } from '../types';
import defaultRecipesData from '../data/defaultRecipes.json';

const IDBStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const value = await get(name);
    return value ? JSON.stringify(value) : null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, JSON.parse(value));
  },
  removeItem: async (name: string): Promise<void> => {
    await set(name, null);
  },
};

interface RecipeState {
  recipes: Recipe[];
  userProfile: UserProfile | null;
  filters: RecipeFilters;
  visibleCount: number;
  likedRecipes: string[];

  initRecipes: () => void;
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'likes' | 'comments'>) => void;
  updateRecipe: (id: string, recipe: Partial<Recipe>) => void;
  deleteRecipe: (id: string) => void;
  getRecipeById: (id: string) => Recipe | undefined;

  setFilters: (filters: Partial<RecipeFilters>) => void;
  getFilteredRecipes: () => Recipe[];
  loadMore: () => void;

  registerUser: (userName: string, flavorProfile: FlavorProfile) => void;
  updateFlavorProfile: (flavorProfile: FlavorProfile) => void;
  getRecommendedRecipes: () => RecipeWithMatch[];
  calculateMatchPercentage: (recipeFlavor: FlavorProfile) => number;

  addComment: (recipeId: string, comment: Omit<Comment, 'id' | 'createdAt'>) => void;
  likeRecipe: (recipeId: string) => void;
  unlikeRecipe: (recipeId: string) => void;

  getTrendingRecipes: (days?: number) => Recipe[];
}

const defaultFilters: RecipeFilters = {
  cuisine: '全部',
  difficulty: '全部',
  cookTimeRange: '全部',
};

const defaultFlavorProfile: FlavorProfile = {
  sweet: 3,
  spicy: 3,
  sour: 3,
};

export const useRecipeStore = create<RecipeState>()(
  persist(
    (set, get) => ({
      recipes: [],
      userProfile: null,
      filters: defaultFilters,
      visibleCount: 20,
      likedRecipes: [],

      initRecipes: () => {
        const { recipes } = get();
        if (recipes.length === 0) {
          set({ recipes: defaultRecipesData as Recipe[] });
        }
      },

      addRecipe: (recipeData) => {
        const newRecipe: Recipe = {
          ...recipeData,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          likes: 0,
          comments: [],
        };
        set((state) => ({
          recipes: [newRecipe, ...state.recipes],
        }));
      },

      updateRecipe: (id, recipeData) => {
        set((state) => ({
          recipes: state.recipes.map((r) =>
            r.id === id ? { ...r, ...recipeData } : r
          ),
        }));
      },

      deleteRecipe: (id) => {
        set((state) => ({
          recipes: state.recipes.filter((r) => r.id !== id),
        }));
      },

      getRecipeById: (id) => {
        return get().recipes.find((r) => r.id === id);
      },

      setFilters: (newFilters) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
          visibleCount: 20,
        }));
      },

      getFilteredRecipes: () => {
        const { recipes, filters } = get();
        let filtered = [...recipes];

        if (filters.cuisine !== '全部') {
          filtered = filtered.filter((r) => r.cuisine === filters.cuisine);
        }

        if (filters.difficulty !== '全部') {
          filtered = filtered.filter((r) => r.difficulty === filters.difficulty);
        }

        if (filters.cookTimeRange !== '全部') {
          switch (filters.cookTimeRange) {
            case '<=15min':
              filtered = filtered.filter((r) => r.cookTime <= 15);
              break;
            case '15-45min':
              filtered = filtered.filter((r) => r.cookTime > 15 && r.cookTime <= 45);
              break;
            case '>45min':
              filtered = filtered.filter((r) => r.cookTime > 45);
              break;
          }
        }

        return filtered;
      },

      loadMore: () => {
        set((state) => ({
          visibleCount: state.visibleCount + 10,
        }));
      },

      registerUser: (userName, flavorProfile) => {
        const newUser: UserProfile = {
          id: uuidv4(),
          userName,
          flavorProfile,
          registeredAt: new Date().toISOString(),
        };
        set({ userProfile: newUser });
      },

      updateFlavorProfile: (flavorProfile) => {
        set((state) => ({
          userProfile: state.userProfile
            ? { ...state.userProfile, flavorProfile }
            : null,
        }));
      },

      calculateMatchPercentage: (recipeFlavor) => {
        const { userProfile } = get();
        if (!userProfile) return 0;

        const userFlavor = userProfile.flavorProfile;
        const distance = Math.sqrt(
          Math.pow(userFlavor.sweet - recipeFlavor.sweet, 2) +
          Math.pow(userFlavor.spicy - recipeFlavor.spicy, 2) +
          Math.pow(userFlavor.sour - recipeFlavor.sour, 2)
        );

        const maxDistance = Math.sqrt(
          Math.pow(4, 2) + Math.pow(4, 2) + Math.pow(4, 2)
        );
        const matchPercentage = Math.round((1 - distance / maxDistance) * 100);

        return matchPercentage;
      },

      getRecommendedRecipes: () => {
        const { recipes } = get();
        const recipesWithMatch: RecipeWithMatch[] = recipes
          .map((recipe) => ({
            ...recipe,
            matchPercentage: get().calculateMatchPercentage(recipe.flavorProfile),
          }))
          .filter((r) => r.matchPercentage > 70)
          .sort((a, b) => b.matchPercentage - a.matchPercentage);

        return recipesWithMatch;
      },

      addComment: (recipeId, commentData) => {
        const newComment: Comment = {
          ...commentData,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          recipes: state.recipes.map((r) =>
            r.id === recipeId
              ? { ...r, comments: [...r.comments, newComment] }
              : r
          ),
        }));
      },

      likeRecipe: (recipeId) => {
        const { likedRecipes } = get();
        if (likedRecipes.includes(recipeId)) return;

        set((state) => ({
          recipes: state.recipes.map((r) =>
            r.id === recipeId ? { ...r, likes: r.likes + 1 } : r
          ),
          likedRecipes: [...state.likedRecipes, recipeId],
        }));
      },

      unlikeRecipe: (recipeId) => {
        const { likedRecipes } = get();
        if (!likedRecipes.includes(recipeId)) return;

        set((state) => ({
          recipes: state.recipes.map((r) =>
            r.id === recipeId ? { ...r, likes: Math.max(0, r.likes - 1) } : r
          ),
          likedRecipes: state.likedRecipes.filter((id) => id !== recipeId),
        }));
      },

      getTrendingRecipes: (days = 7) => {
        const { recipes } = get();
        const sevenDaysAgo = subDays(new Date(), days);

        return recipes
          .filter((r) => isAfter(new Date(r.createdAt), sevenDaysAgo))
          .sort((a, b) => b.likes - a.likes)
          .slice(0, 5);
      },
    }),
    {
      name: 'retro-recipe-storage',
      storage: createJSONStorage(() => IDBStorage),
      partialize: (state) => ({
        recipes: state.recipes,
        userProfile: state.userProfile,
        likedRecipes: state.likedRecipes,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.initRecipes();
        }
      },
    }
  )
);
