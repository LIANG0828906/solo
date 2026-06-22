import { create } from 'zustand';
import type {
  Ingredient,
  Recipe,
  RecipeIngredient,
  ShoppingItem,
} from '../types';
import {
  addIngredient,
  deleteIngredient,
  fetchIngredients,
  recommendRecipes,
  saveShoppingList,
  updateIngredient,
} from '../api/client';

interface AppState {
  ingredients: Ingredient[];
  recipes: Recipe[];
  selectedRecipe: Recipe | null;
  shoppingList: ShoppingItem[];
  shoppingListId: string | null;
  preferences: string[];
  isDrawerOpen: boolean;
  isLoading: boolean;

  loadIngredients: () => Promise<void>;
  addIngredientAction: (
    data: Omit<Ingredient, 'id' | 'createdAt'>
  ) => Promise<void>;
  updateIngredientAction: (
    id: string,
    data: Partial<Omit<Ingredient, 'id' | 'createdAt'>>
  ) => Promise<void>;
  deleteIngredientAction: (id: string) => Promise<void>;

  fetchRecommendations: () => Promise<void>;
  selectRecipe: (recipe: Recipe) => void;

  togglePreference: (tag: string) => void;

  updateShoppingItem: (index: number, quantity: number) => void;
  removeShoppingItem: (index: number) => void;
  addShoppingItemNote: (index: number, note: string) => void;

  setDrawerOpen: (open: boolean) => void;
  generateShareLink: () => Promise<void>;
}

function computeShoppingDiff(
  recipeIngredients: RecipeIngredient[],
  stock: Ingredient[]
): ShoppingItem[] {
  const stockMap = new Map<string, Ingredient>();
  for (const item of stock) {
    stockMap.set(item.name, item);
  }

  const diff: ShoppingItem[] = [];
  for (const req of recipeIngredients) {
    const have = stockMap.get(req.name);
    const needed = req.quantity;
    const available = have?.quantity ?? 0;
    if (available < needed) {
      diff.push({
        name: req.name,
        quantity: needed - available,
        unit: req.unit,
        category: req.category,
      });
    }
  }
  return diff;
}

export const useStore = create<AppState>()((set, get) => ({
  ingredients: [],
  recipes: [],
  selectedRecipe: null,
  shoppingList: [],
  shoppingListId: null,
  preferences: [],
  isDrawerOpen: false,
  isLoading: false,

  loadIngredients: async () => {
    set({ isLoading: true });
    try {
      const data = await fetchIngredients();
      set({ ingredients: data });
    } finally {
      set({ isLoading: false });
    }
  },

  addIngredientAction: async (data) => {
    set({ isLoading: true });
    try {
      const created = await addIngredient(data);
      set((s) => ({ ingredients: [...s.ingredients, created] }));
    } finally {
      set({ isLoading: false });
    }
  },

  updateIngredientAction: async (id, data) => {
    try {
      const updated = await updateIngredient(id, data);
      set((s) => ({
        ingredients: s.ingredients.map((x) => (x.id === id ? updated : x)),
      }));
    } catch (e) {
      console.error(e);
    }
  },

  deleteIngredientAction: async (id) => {
    try {
      await deleteIngredient(id);
      set((s) => ({
        ingredients: s.ingredients.filter((x) => x.id !== id),
      }));
    } catch (e) {
      console.error(e);
    }
  },

  fetchRecommendations: async () => {
    const { ingredients, preferences } = get();
    set({ isLoading: true });
    try {
      const data = await recommendRecipes(ingredients, preferences);
      set({ recipes: data });
    } finally {
      set({ isLoading: false });
    }
  },

  selectRecipe: (recipe) => {
    const { ingredients } = get();
    const diff = computeShoppingDiff(recipe.ingredients, ingredients);
    set({
      selectedRecipe: recipe,
      shoppingList: diff,
      shoppingListId: null,
      isDrawerOpen: true,
    });
  },

  togglePreference: (tag) => {
    set((s) => {
      const exists = s.preferences.includes(tag);
      return {
        preferences: exists
          ? s.preferences.filter((t) => t !== tag)
          : [...s.preferences, tag],
      };
    });
  },

  updateShoppingItem: (index, quantity) => {
    set((s) => {
      const next = [...s.shoppingList];
      if (next[index]) {
        next[index] = { ...next[index], quantity };
      }
      return { shoppingList: next };
    });
  },

  removeShoppingItem: (index) => {
    set((s) => ({
      shoppingList: s.shoppingList.filter((_, i) => i !== index),
    }));
  },

  addShoppingItemNote: (index, note) => {
    set((s) => {
      const next = [...s.shoppingList];
      if (next[index]) {
        next[index] = { ...next[index], note };
      }
      return { shoppingList: next };
    });
  },

  setDrawerOpen: (open) => {
    set({ isDrawerOpen: open });
  },

  generateShareLink: async () => {
    const { selectedRecipe, shoppingList } = get();
    if (!selectedRecipe) return;
    set({ isLoading: true });
    try {
      const res = await saveShoppingList({
        recipeId: selectedRecipe.id,
        recipeName: selectedRecipe.name,
        items: shoppingList,
      });
      set({ shoppingListId: res.id });
    } finally {
      set({ isLoading: false });
    }
  },
}));
