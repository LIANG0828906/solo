import { create } from "zustand";
import type { Recipe, RecipeDetail, Comment } from "../../shared/types";

interface AppState {
  recipes: Recipe[];
  recipeDetail: RecipeDetail | null;
  comments: Comment[];
  favorites: Set<string>;
  loading: boolean;
  toast: { message: string; visible: boolean };

  fetchRecipes: () => Promise<void>;
  fetchRecipeDetail: (id: string) => Promise<void>;
  fetchComments: (id: string) => Promise<void>;
  addComment: (id: string, content: string) => Promise<void>;
  toggleFavorite: (id: string) => void;
  likeComment: (commentId: string) => void;
  showToast: (message: string) => void;
  hideToast: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  recipes: [],
  recipeDetail: null,
  comments: [],
  favorites: new Set<string>(),
  loading: false,
  toast: { message: "", visible: false },

  fetchRecipes: async () => {
    set({ loading: true });
    try {
      const res = await fetch("/api/recipes");
      const data = await res.json();
      set({ recipes: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchRecipeDetail: async (id: string) => {
    set({ loading: true });
    try {
      const res = await fetch(`/api/recipes/${id}`);
      const data = await res.json();
      set({ recipeDetail: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchComments: async (id: string) => {
    try {
      const res = await fetch(`/api/recipes/${id}/comments`);
      const data = await res.json();
      set({ comments: data });
    } catch {
      // ignore
    }
  },

  addComment: async (id: string, content: string) => {
    try {
      const res = await fetch(`/api/recipes/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const newComment = await res.json();
      set((state) => ({ comments: [newComment, ...state.comments] }));
    } catch {
      // ignore
    }
  },

  toggleFavorite: (id: string) => {
    const favorites = new Set(get().favorites);
    if (favorites.has(id)) {
      favorites.delete(id);
    } else {
      favorites.add(id);
      get().showToast("已收藏");
    }
    set({ favorites });
  },

  likeComment: (commentId: string) => {
    set((state) => ({
      comments: state.comments.map((c) =>
        c.id === commentId ? { ...c, likes: c.likes + 1 } : c
      ),
    }));
  },

  showToast: (message: string) => {
    set({ toast: { message, visible: true } });
    setTimeout(() => {
      get().hideToast();
    }, 2000);
  },

  hideToast: () => {
    set({ toast: { message: "", visible: false } });
  },
}));
