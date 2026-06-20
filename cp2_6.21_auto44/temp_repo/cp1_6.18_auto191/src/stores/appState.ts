import { create } from "zustand";
import { Ingredient, Recipe, INGREDIENTS, RECIPES, findMatchingRecipe, searchRecipes } from "../engine/recipeEngine";

interface WorkbenchItem {
  ingredient: Ingredient;
  x: number;
  y: number;
  id: string;
}

interface UnlockedRecipe {
  recipe: Recipe;
  unlockedAt: number;
}

interface AppState {
  ingredients: Ingredient[];
  recipes: Recipe[];
  workbenchItems: WorkbenchItem[];
  unlockedRecipes: UnlockedRecipe[];
  searchQuery: string;
  searchResults: Recipe[];
  discoveredRecipe: Recipe | null;
  showParticleAnimation: boolean;

  addToWorkbench: (ingredient: Ingredient, x: number, y: number) => void;
  removeFromWorkbench: (itemId: string) => void;
  clearWorkbench: () => void;
  moveWorkbenchItem: (itemId: string, x: number, y: number) => void;
  checkCombination: () => void;
  dismissDiscovery: () => void;
  unlockRecipe: (recipe: Recipe) => void;
  setSearchQuery: (query: string) => void;
  performSearch: () => void;
}

let workbenchItemId = 0;

export const useAppStore = create<AppState>((set, get) => ({
  ingredients: INGREDIENTS,
  recipes: RECIPES,
  workbenchItems: [],
  unlockedRecipes: [],
  searchQuery: "",
  searchResults: [],
  discoveredRecipe: null,
  showParticleAnimation: false,

  addToWorkbench: (ingredient, x, y) => {
    const id = `wb_${++workbenchItemId}`;
    set((state) => ({
      workbenchItems: [...state.workbenchItems, { ingredient, x, y, id }],
    }));
    setTimeout(() => get().checkCombination(), 350);
  },

  removeFromWorkbench: (itemId) => {
    set((state) => ({
      workbenchItems: state.workbenchItems.filter((item) => item.id !== itemId),
    }));
  },

  clearWorkbench: () => {
    set({ workbenchItems: [] });
  },

  moveWorkbenchItem: (itemId, x, y) => {
    set((state) => ({
      workbenchItems: state.workbenchItems.map((item) =>
        item.id === itemId ? { ...item, x, y } : item
      ),
    }));
  },

  checkCombination: () => {
    const { workbenchItems, unlockedRecipes } = get();
    const ingredientIds = workbenchItems.map((item) => item.ingredient.id);
    const uniqueIds = [...new Set(ingredientIds)];

    const match = findMatchingRecipe(uniqueIds);
    if (match) {
      const alreadyUnlocked = unlockedRecipes.some((ur) => ur.recipe.id === match.id);
      if (!alreadyUnlocked) {
        set({
          discoveredRecipe: match,
          showParticleAnimation: true,
        });
        get().unlockRecipe(match);
      }
    }
  },

  dismissDiscovery: () => {
    set({ discoveredRecipe: null, showParticleAnimation: false, workbenchItems: [] });
  },

  unlockRecipe: (recipe) => {
    set((state) => ({
      unlockedRecipes: [
        ...state.unlockedRecipes,
        { recipe, unlockedAt: Date.now() },
      ],
    }));
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
    if (!query.trim()) {
      set({ searchResults: [] });
      return;
    }
    const results = searchRecipes(query);
    set({ searchResults: results });
  },

  performSearch: () => {
    const { searchQuery } = get();
    const results = searchRecipes(searchQuery);
    set({ searchResults: results });
  },
}));
