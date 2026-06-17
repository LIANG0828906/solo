import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Poem, SortType } from '@/types';
import {
  getAllPoems,
  getPoemById,
  addPoem,
  updatePoem as updatePoemDB,
  deletePoem as deletePoemDB,
} from '@/utils/db';

interface PoemState {
  poems: Poem[];
  currentPoem: Poem | null;
  isLoading: boolean;
  fetchPoems: () => Promise<void>;
  fetchPoemById: (id: string) => Promise<void>;
  createPoem: (title?: string, content?: string) => Promise<Poem>;
  updatePoem: (id: string, title: string, content: string) => Promise<void>;
  deletePoem: (id: string) => Promise<void>;
  getSortedAndFilteredPoems: (searchQuery: string, sortType: SortType) => Poem[];
}

export const usePoemStore = create<PoemState>((set, get) => ({
  poems: [],
  currentPoem: null,
  isLoading: false,

  fetchPoems: async () => {
    set({ isLoading: true });
    try {
      const poems = await getAllPoems();
      set({ poems, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch poems:', error);
      set({ isLoading: false });
    }
  },

  fetchPoemById: async (id: string) => {
    try {
      const poem = await getPoemById(id);
      set({ currentPoem: poem || null });
    } catch (error) {
      console.error('Failed to fetch poem:', error);
    }
  },

  createPoem: async (title = '无题', content = '') => {
    const now = Date.now();
    const newPoem: Poem = {
      id: uuidv4(),
      title,
      content,
      createdAt: now,
      updatedAt: now,
    };
    await addPoem(newPoem);
    set((state) => ({
      poems: [newPoem, ...state.poems],
      currentPoem: newPoem,
    }));
    return newPoem;
  },

  updatePoem: async (id: string, title: string, content: string) => {
    const existingPoem = get().poems.find((p) => p.id === id);
    if (!existingPoem) return;

    const updatedPoem: Poem = {
      ...existingPoem,
      title: title || '无题',
      content,
      updatedAt: Date.now(),
    };

    await updatePoemDB(updatedPoem);
    set((state) => ({
      poems: state.poems.map((p) => (p.id === id ? updatedPoem : p)),
      currentPoem: state.currentPoem?.id === id ? updatedPoem : state.currentPoem,
    }));
  },

  deletePoem: async (id: string) => {
    await deletePoemDB(id);
    set((state) => ({
      poems: state.poems.filter((p) => p.id !== id),
      currentPoem: state.currentPoem?.id === id ? null : state.currentPoem,
    }));
  },

  getSortedAndFilteredPoems: (searchQuery: string, sortType: SortType) => {
    const { poems } = get();
    let result = [...poems];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((p) => p.title.toLowerCase().includes(query));
    }

    result.sort((a, b) => {
      if (sortType === 'title') {
        return a.title.localeCompare(b.title, 'zh-CN');
      }
      return b[sortType] - a[sortType];
    });

    return result;
  },
}));
