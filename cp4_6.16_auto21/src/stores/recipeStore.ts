import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';
import { subDays, isAfter } from 'date-fns';
import type { Recipe, UserProfile, RecipeFilters, RecipeWithMatch, Comment, FlavorProfile } from '../types';
import defaultRecipesData from '../data/defaultRecipes.json';

const IDB_KEY = 'retro-recipe-storage';

const IDBStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const value = await idbGet(name as IDBValidKey);
      return value ? JSON.stringify(value) : null;
    } catch (error) {
      console.error('IndexedDB getItem error:', error);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await idbSet(name as IDBValidKey, JSON.parse(value));
    } catch (error) {
      console.error('IndexedDB setItem error:', error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await idbDel(name as IDBValidKey);
    } catch (error) {
      console.error('IndexedDB removeItem error:', error);
    }
  },
};

interface RecipeState {
  recipes: Recipe[];
  userProfile: UserProfile | null;
  filters: RecipeFilters;
  visibleCount: number;
  likedRecipes: string[];
  isInitialized: boolean;

  initRecipes: () => Promise<void>;
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
  likeRecipe: (recipeId: string) => Promise<void>;
  unlikeRecipe: (recipeId: string) => Promise<void>;

  getTrendingRecipes: (days?: number) => Recipe[];
}

const defaultFilters: RecipeFilters = {
  cuisine: '全部',
  difficulty: '全部',
  cookTimeRange: '全部',
};

export const useRecipeStore = create<RecipeState>()(
  persist(
    (set, get) => ({
      recipes: [],
      userProfile: null,
      filters: defaultFilters,
      visibleCount: 20,
      likedRecipes: [],
      isInitialized: false,

      initRecipes: async () => {
        try {
          const storedData = await idbGet(IDB_KEY as IDBValidKey);
          
          if (!storedData || !Array.isArray((storedData as any).recipes) || (storedData as any).recipes.length === 0) {
            console.log('Initializing default recipes...');
            set({ 
              recipes: defaultRecipesData as Recipe[],
              isInitialized: true 
            });
          } else {
            console.log('Recipes loaded from IndexedDB');
            set({ isInitialized: true });
          }
        } catch (error) {
          console.error('Failed to initialize recipes:', error);
          set({ 
            recipes: defaultRecipesData as Recipe[],
            isInitialized: true 
          });
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
        requestAnimationFrame(() => {
          set((state) => ({
            visibleCount: state.visibleCount + 10,
          }));
        });
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
        
        const sweetDiff = userFlavor.sweet - recipeFlavor.sweet;
        const spicyDiff = userFlavor.spicy - recipeFlavor.spicy;
        const sourDiff = userFlavor.sour - recipeFlavor.sour;
        
        const distance = Math.sqrt(
          Math.pow(sweetDiff, 2) +
          Math.pow(spicyDiff, 2) +
          Math.pow(sourDiff, 2)
        );

        const maxDistance = Math.sqrt(
          Math.pow(4, 2) + Math.pow(4, 2) + Math.pow(4, 2)
        );
        
        const matchPercentage = Math.max(0, Math.min(100, Math.round((1 - distance / maxDistance) * 100)));

        return matchPercentage;
      },

      getRecommendedRecipes: () => {
        const { recipes, userProfile } = get();
        
        if (!userProfile) {
          return [];
        }

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

      likeRecipe: async (recipeId) => {
        const { likedRecipes } = get();
        if (likedRecipes.includes(recipeId)) return;

        await new Promise(resolve => setTimeout(resolve, 100));
        
        set((state) => ({
          recipes: state.recipes.map((r) =>
            r.id === recipeId ? { ...r, likes: r.likes + 1 } : r
          ),
          likedRecipes: [...state.likedRecipes, recipeId],
        }));
      },

      unlikeRecipe: async (recipeId) => {
        const { likedRecipes } = get();
        if (!likedRecipes.includes(recipeId)) return;

        await new Promise(resolve => setTimeout(resolve, 100));

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
      name: IDB_KEY,
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
