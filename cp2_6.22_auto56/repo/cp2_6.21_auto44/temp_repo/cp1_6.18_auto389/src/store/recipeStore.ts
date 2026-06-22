import { create } from 'zustand';
import axios from 'axios';
import { Recipe, ShoppingItem } from '@/types';

interface RecipeState {
  recipes: Recipe[];
  recommendedRecipes: Recipe[];
  shoppingList: ShoppingItem[];
  loading: boolean;
  error: string | null;
  fetchRecipes: () => Promise<void>;
  recommendRecipes: (ingredients: string[]) => Promise<void>;
  addRecipe: (recipe: Omit<Recipe, 'id'>) => Promise<Recipe>;
  deleteRecipe: (id: number) => Promise<void>;
  addToShoppingList: (ingredients: ShoppingItem[]) => void;
  toggleShoppingItem: (name: string) => void;
  clearShoppingList: () => void;
  removeShoppingItem: (name: string) => void;
}

export const useRecipeStore = create<RecipeState>((set, get) => ({
  recipes: [],
  recommendedRecipes: [],
  shoppingList: [],
  loading: false,
  error: null,

  fetchRecipes: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get('/api/recipes');
      set({ recipes: response.data, recommendedRecipes: response.data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  recommendRecipes: async (ingredients: string[]) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post('/api/recommend', { ingredients });
      set({ recommendedRecipes: response.data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  addRecipe: async (recipe) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post('/api/recipes', recipe);
      const newRecipe = response.data;
      set((state) => ({
        recipes: [...state.recipes, newRecipe],
        recommendedRecipes: [...state.recommendedRecipes, newRecipe],
        loading: false,
      }));
      return newRecipe;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteRecipe: async (id: number) => {
    try {
      await axios.delete(`/api/recipes/${id}`);
      set((state) => ({
        recipes: state.recipes.filter((r) => r.id !== id),
        recommendedRecipes: state.recommendedRecipes.filter((r) => r.id !== id),
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  addToShoppingList: (ingredients: ShoppingItem[]) => {
    set((state) => {
      const newList = [...state.shoppingList];
      ingredients.forEach((ing) => {
        const existingIndex = newList.findIndex((item) => item.name === ing.name);
        if (existingIndex >= 0) {
          const existing = newList[existingIndex];
          newList[existingIndex] = {
            ...existing,
            quantity: `${existing.quantity} + ${ing.quantity}`,
          };
        } else {
          newList.push({ ...ing, checked: false });
        }
      });
      return { shoppingList: newList };
    });
  },

  toggleShoppingItem: (name: string) => {
    set((state) => ({
      shoppingList: state.shoppingList.map((item) =>
        item.name === name ? { ...item, checked: !item.checked } : item
      ),
    }));
  },

  clearShoppingList: () => {
    set({ shoppingList: [] });
  },

  removeShoppingItem: (name: string) => {
    set((state) => ({
      shoppingList: state.shoppingList.filter((item) => item.name !== name),
    }));
  },
}));
