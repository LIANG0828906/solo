import { create } from 'zustand';
import type { Recipe, Step, Comment } from './types';
import { DEFAULT_AVATARS } from './types';

const STORAGE_KEY = 'recipe-app-data';

function loadRecipes(): Recipe[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function persistRecipes(recipes: Recipe[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
}

interface RecipeStore {
  recipes: Recipe[];
  addRecipe: (data: Omit<Recipe, 'id' | 'steps' | 'createdAt' | 'updatedAt'>) => string;
  updateRecipe: (id: string, updates: Partial<Omit<Recipe, 'id' | 'createdAt'>>) => void;
  deleteRecipe: (id: string) => void;
  addStep: (recipeId: string, description: string) => void;
  updateStep: (recipeId: string, stepId: string, description: string) => void;
  deleteStep: (recipeId: string, stepId: string) => void;
  reorderSteps: (recipeId: string, startIndex: number, endIndex: number) => void;
  addComment: (recipeId: string, stepId: string, comment: Omit<Comment, 'id' | 'createdAt' | 'avatar'>) => void;
}

function generateAvatarColor(nickname: string): string {
  let hash = 0;
  for (let i = 0; i < nickname.length; i++) {
    hash = nickname.charCodeAt(i) + ((hash << 5) - hash);
  }
  return DEFAULT_AVATARS[Math.abs(hash) % DEFAULT_AVATARS.length];
}

export const useRecipeStore = create<RecipeStore>((set) => ({
  recipes: loadRecipes(),

  addRecipe: (data) => {
    const now = Date.now();
    const id = crypto.randomUUID();
    const newRecipe: Recipe = {
      ...data,
      id,
      steps: [],
      createdAt: now,
      updatedAt: now,
    };
    set((state) => {
      const recipes = [...state.recipes, newRecipe];
      persistRecipes(recipes);
      return { recipes };
    });
    return id;
  },

  updateRecipe: (id, updates) => {
    set((state) => {
      const recipes = state.recipes.map((r) =>
        r.id === id ? { ...r, ...updates, updatedAt: Date.now() } : r
      );
      persistRecipes(recipes);
      return { recipes };
    });
  },

  deleteRecipe: (id) => {
    set((state) => {
      const recipes = state.recipes.filter((r) => r.id !== id);
      persistRecipes(recipes);
      return { recipes };
    });
  },

  addStep: (recipeId, description) => {
    set((state) => {
      const recipes = state.recipes.map((r) => {
        if (r.id !== recipeId) return r;
        const newStep: Step = {
          id: crypto.randomUUID(),
          order: r.steps.length,
          description,
          comments: [],
        };
        return { ...r, steps: [...r.steps, newStep], updatedAt: Date.now() };
      });
      persistRecipes(recipes);
      return { recipes };
    });
  },

  updateStep: (recipeId, stepId, description) => {
    set((state) => {
      const recipes = state.recipes.map((r) => {
        if (r.id !== recipeId) return r;
        const steps = r.steps.map((s) =>
          s.id === stepId ? { ...s, description } : s
        );
        return { ...r, steps, updatedAt: Date.now() };
      });
      persistRecipes(recipes);
      return { recipes };
    });
  },

  deleteStep: (recipeId, stepId) => {
    set((state) => {
      const recipes = state.recipes.map((r) => {
        if (r.id !== recipeId) return r;
        const filtered = r.steps.filter((s) => s.id !== stepId);
        const steps = filtered.map((s, i) => ({ ...s, order: i }));
        return { ...r, steps, updatedAt: Date.now() };
      });
      persistRecipes(recipes);
      return { recipes };
    });
  },

  reorderSteps: (recipeId, startIndex, endIndex) => {
    set((state) => {
      const recipes = state.recipes.map((r) => {
        if (r.id !== recipeId) return r;
        const steps = Array.from(r.steps);
        const [removed] = steps.splice(startIndex, 1);
        steps.splice(endIndex, 0, removed);
        const reordered = steps.map((s, i) => ({ ...s, order: i }));
        return { ...r, steps: reordered, updatedAt: Date.now() };
      });
      persistRecipes(recipes);
      return { recipes };
    });
  },

  addComment: (recipeId, stepId, commentData) => {
    set((state) => {
      const recipes = state.recipes.map((r) => {
        if (r.id !== recipeId) return r;
        const steps = r.steps.map((s) => {
          if (s.id !== stepId) return s;
          const newComment: Comment = {
            ...commentData,
            id: crypto.randomUUID(),
            avatar: generateAvatarColor(commentData.nickname),
            createdAt: Date.now(),
          };
          return { ...s, comments: [...s.comments, newComment] };
        });
        return { ...r, steps, updatedAt: Date.now() };
      });
      persistRecipes(recipes);
      return { recipes };
    });
  },
}));
