import { create } from 'zustand';
import type { Recipe, Suggestion } from '../types';

interface RecipeState {
  recipes: Recipe[];
  searchKeyword: string;
  recommendations: Recipe[];
  loading: boolean;
  fetchRecipes: () => Promise<void>;
  fetchRecipeById: (id: string) => Promise<Recipe | null>;
  fetchRecommendations: (id: string) => Promise<void>;
  setSearchKeyword: (keyword: string) => void;
  getFilteredRecipes: () => Recipe[];
  getSuggestions: () => Suggestion[];
}

const useRecipeStore = create<RecipeState>((set, get) => ({
  recipes: [],
  searchKeyword: '',
  recommendations: [],
  loading: false,

  fetchRecipes: async () => {
    set({ loading: true });
    try {
      const res = await fetch('/api/recipes');
      const data = await res.json();
      set({ recipes: data, loading: false });
    } catch (error) {
      console.error('Failed to fetch recipes:', error);
      set({ loading: false });
    }
  },

  fetchRecipeById: async (id: string) => {
    try {
      const res = await fetch(`/api/recipes/${id}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      console.error('Failed to fetch recipe:', error);
      return null;
    }
  },

  fetchRecommendations: async (id: string) => {
    set({ loading: true });
    try {
      const res = await fetch(`/api/recommendations/${id}`);
      const data = await res.json();
      set({ recommendations: data, loading: false });
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      set({ loading: false });
    }
  },

  setSearchKeyword: (keyword: string) => {
    set({ searchKeyword: keyword });
  },

  getFilteredRecipes: () => {
    const { recipes, searchKeyword } = get();
    if (!searchKeyword.trim()) return recipes;
    const keyword = searchKeyword.toLowerCase().trim();
    return recipes.filter(
      (recipe) =>
        recipe.name.toLowerCase().includes(keyword) ||
        recipe.ingredients.some((ing) => ing.toLowerCase().includes(keyword)) ||
        recipe.tags.some((tag) => tag.toLowerCase().includes(keyword))
    );
  },

  getSuggestions: () => {
    const { recipes, searchKeyword } = get();
    if (!searchKeyword.trim()) return [];
    const keyword = searchKeyword.toLowerCase().trim();
    const suggestions: Suggestion[] = [];
    const seen = new Set<string>();

    for (const recipe of recipes) {
      if (recipe.name.toLowerCase().includes(keyword) && !seen.has(recipe.name)) {
        suggestions.push({ text: recipe.name, type: 'recipe' });
        seen.add(recipe.name);
      }
      for (const ing of recipe.ingredients) {
        if (ing.toLowerCase().includes(keyword) && !seen.has(ing)) {
          suggestions.push({ text: ing, type: 'ingredient' });
          seen.add(ing);
        }
      }
      if (suggestions.length >= 8) break;
    }

    return suggestions;
  },
}));

export default useRecipeStore;
