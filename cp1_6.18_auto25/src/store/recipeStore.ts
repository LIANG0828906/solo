import { create } from 'zustand';
import {
  Recipe,
  Comment,
  fetchRecipes,
  fetchRecipeById,
  createRecipe as apiCreateRecipe,
  addComment as apiAddComment,
  toggleCommentLike as apiToggleCommentLike,
} from '@/api/recipes';

interface RecipeState {
  recipes: Recipe[];
  filteredRecipes: Recipe[];
  currentRecipe: Recipe | null;
  loading: boolean;
  error: string | null;
  searchKeyword: string;

  loadRecipes: () => Promise<void>;
  loadRecipeById: (id: string) => Promise<void>;
  createRecipe: (data: { name: string; author: string; imageUrl: string; ingredients: string[]; steps: string[] }) => Promise<Recipe>;
  addComment: (recipeId: string, content: string, user: string) => Promise<void>;
  toggleCommentLike: (recipeId: string, commentId: string) => Promise<void>;
  searchRecipes: (keyword: string) => void;
  clearCurrentRecipe: () => void;
}

export const useRecipeStore = create<RecipeState>((set, get) => ({
  recipes: [],
  filteredRecipes: [],
  currentRecipe: null,
  loading: false,
  error: null,
  searchKeyword: '',

  loadRecipes: async () => {
    set({ loading: true, error: null });
    try {
      const data = await fetchRecipes();
      set({ recipes: data, filteredRecipes: data, loading: false });
      const keyword = get().searchKeyword;
      if (keyword) {
        get().searchRecipes(keyword);
      }
    } catch (err) {
      set({ error: '加载食谱列表失败', loading: false });
    }
  },

  loadRecipeById: async (id: string) => {
    set({ loading: true, error: null, currentRecipe: null });
    try {
      const data = await fetchRecipeById(id);
      set({ currentRecipe: data, loading: false });
    } catch (err) {
      set({ error: '加载食谱详情失败', loading: false });
    }
  },

  createRecipe: async (data) => {
    set({ loading: true, error: null });
    try {
      const newRecipe = await apiCreateRecipe(data);
      const state = get();
      const updatedRecipes = [newRecipe, ...state.recipes];
      set({
        recipes: updatedRecipes,
        filteredRecipes: state.searchKeyword
          ? updatedRecipes.filter(
              r =>
                r.name.includes(state.searchKeyword) ||
                r.author.includes(state.searchKeyword)
            )
          : updatedRecipes,
        loading: false,
      });
      return newRecipe;
    } catch (err) {
      set({ error: '发布食谱失败', loading: false });
      throw err;
    }
  },

  addComment: async (recipeId: string, content: string, user: string) => {
    try {
      const comment = await apiAddComment(recipeId, content, user);
      if (!comment) return;

      const state = get();
      const updateRecipeComments = (recipe: Recipe): Recipe =>
        recipe.id === recipeId
          ? { ...recipe, comments: [...recipe.comments, comment] }
          : recipe;

      set({
        recipes: state.recipes.map(updateRecipeComments),
        filteredRecipes: state.filteredRecipes.map(updateRecipeComments),
        currentRecipe:
          state.currentRecipe && state.currentRecipe.id === recipeId
            ? { ...state.currentRecipe, comments: [...state.currentRecipe.comments, comment] }
            : state.currentRecipe,
      });
    } catch (err) {
      set({ error: '发表评论失败' });
    }
  },

  toggleCommentLike: async (recipeId: string, commentId: string) => {
    try {
      const updatedComment = await apiToggleCommentLike(recipeId, commentId);
      if (!updatedComment) return;

      const state = get();
      const updateRecipeComments = (recipe: Recipe): Recipe =>
        recipe.id === recipeId
          ? {
              ...recipe,
              comments: recipe.comments.map(c =>
                c.id === commentId ? updatedComment : c
              ),
            }
          : recipe;

      set({
        recipes: state.recipes.map(updateRecipeComments),
        filteredRecipes: state.filteredRecipes.map(updateRecipeComments),
        currentRecipe:
          state.currentRecipe && state.currentRecipe.id === recipeId
            ? {
                ...state.currentRecipe,
                comments: state.currentRecipe.comments.map(c =>
                  c.id === commentId ? updatedComment : c
                ),
              }
            : state.currentRecipe,
      });
    } catch (err) {
      set({ error: '操作失败' });
    }
  },

  searchRecipes: (keyword: string) => {
    const trimmed = keyword.trim();
    set({ searchKeyword: trimmed });
    if (!trimmed) {
      set({ filteredRecipes: get().recipes });
      return;
    }
    const filtered = get().recipes.filter(
      r => r.name.includes(trimmed) || r.author.includes(trimmed)
    );
    set({ filteredRecipes: filtered });
  },

  clearCurrentRecipe: () => {
    set({ currentRecipe: null, error: null });
  },
}));
