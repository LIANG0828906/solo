import { create } from 'zustand';
import axios from 'axios';
import type { Recipe, CategoryGroup } from '../types';
import { mergeIngredients } from '../utils/mergeIngredients';

interface RecipeState {
  recipes: Recipe[];
  selectedRecipeIds: string[];
  currentRecipe: Recipe | null;
  checkedItems: Record<string, boolean>;
  mergedIngredients: CategoryGroup[];
  loading: boolean;
  error: string | null;
  fetchRecipes: () => Promise<void>;
  fetchRecipeById: (id: string) => Promise<void>;
  addToShoppingList: (recipeId: string) => void;
  removeFromShoppingList: (recipeId: string) => void;
  toggleIngredient: (key: string) => void;
  getTotalPrice: () => number;
  isRecipeSelected: (recipeId: string) => boolean;
}

export const useRecipeStore = create<RecipeState>((set, get) => ({
  recipes: [],
  selectedRecipeIds: [],
  currentRecipe: null,
  checkedItems: {},
  mergedIngredients: [],
  loading: false,
  error: null,

  fetchRecipes: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get<Recipe[]>('/api/recipes');
      set({ recipes: response.data, loading: false });
    } catch (error) {
      set({ error: '获取食谱列表失败', loading: false });
    }
  },

  fetchRecipeById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get<Recipe>(`/api/recipes/${id}`);
      set({ currentRecipe: response.data, loading: false });
    } catch (error) {
      set({ error: '获取食谱详情失败', loading: false });
    }
  },

  addToShoppingList: (recipeId: string) => {
    set(state => {
      if (state.selectedRecipeIds.includes(recipeId)) {
        return state;
      }
      const newSelectedIds = [...state.selectedRecipeIds, recipeId];
      const selectedRecipes = state.recipes.filter(r => newSelectedIds.includes(r.id));
      const merged = mergeIngredients(selectedRecipes);
      return {
        selectedRecipeIds: newSelectedIds,
        mergedIngredients: merged
      };
    });
  },

  removeFromShoppingList: (recipeId: string) => {
    set(state => {
      const newSelectedIds = state.selectedRecipeIds.filter(id => id !== recipeId);
      const selectedRecipes = state.recipes.filter(r => newSelectedIds.includes(r.id));
      const merged = mergeIngredients(selectedRecipes);
      return {
        selectedRecipeIds: newSelectedIds,
        mergedIngredients: merged
      };
    });
  },

  toggleIngredient: (key: string) => {
    set(state => ({
      checkedItems: {
        ...state.checkedItems,
        [key]: !state.checkedItems[key]
      }
    }));
  },

  getTotalPrice: () => {
    const state = get();
    let total = 0;
    state.mergedIngredients.forEach(group => {
      group.ingredients.forEach(ing => {
        if (!state.checkedItems[ing.key]) {
          total += ing.subtotal;
        }
      });
    });
    return Math.round(total * 100) / 100;
  },

  isRecipeSelected: (recipeId: string) => {
    return get().selectedRecipeIds.includes(recipeId);
  }
}));
