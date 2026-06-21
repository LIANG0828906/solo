import { create } from 'zustand';
import type { Snippet } from './types';
import * as api from './api';

interface State {
  snippets: Snippet[];
  searchQuery: string;
  selectedTag: string | null;
  loading: boolean;
  error: string | null;
}

interface Actions {
  setSnippets: (snippets: Snippet[]) => void;
  addSnippet: (snippet: Snippet) => void;
  removeSnippet: (id: string) => void;
  updateSnippet: (id: string, snippet: Partial<Snippet>) => void;
  setSearchQuery: (query: string) => void;
  setSelectedTag: (tag: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchSnippets: () => Promise<void>;
}

interface SnippetStore extends State, Actions {}

export const useSnippetStore = create<SnippetStore>((set) => ({
  snippets: [],
  searchQuery: '',
  selectedTag: null,
  loading: false,
  error: null,

  setSnippets: (snippets) => set({ snippets }),

  addSnippet: (snippet) =>
    set((state) => ({ snippets: [snippet, ...state.snippets] })),

  removeSnippet: (id) =>
    set((state) => ({
      snippets: state.snippets.filter((s) => s.id !== id),
    })),

  updateSnippet: (id, updatedSnippet) =>
    set((state) => ({
      snippets: state.snippets.map((s) =>
        s.id === id ? { ...s, ...updatedSnippet } : s
      ),
    })),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setSelectedTag: (tag) => set({ selectedTag: tag }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  fetchSnippets: async () => {
    set({ loading: true, error: null });
    try {
      const snippets = await api.fetchSnippets();
      set({ snippets, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch snippets',
        loading: false,
      });
    }
  },
}));
