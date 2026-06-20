import { create } from 'zustand';
import axios from 'axios';

export interface Word {
  id: number;
  word: string;
  definition: string;
  corpus_id: string;
  example_sentence: string;
  example_translation: string;
  audio_url: string;
  master_count: number;
  review_count: number;
  forgetting_index: number;
  created_at: string;
  last_reviewed_at: string | null;
}

interface WordStore {
  words: Word[];
  currentIndex: number;
  isLoading: boolean;
  page: number;
  pageSize: number;
  totalCount: number;
  searchQuery: string;
  sortBy: string;
  fetchWords: (page?: number, search?: string, sortBy?: string) => Promise<void>;
  addWord: (word: string, definition: string, corpusId?: string) => Promise<void>;
  deleteWord: (wordId: number) => Promise<void>;
  markWord: (wordId: number, isMastered: boolean) => Promise<void>;
  setCurrentIndex: (index: number) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: string) => void;
  getCurrentWord: () => Word | null;
  goToNextWord: () => void;
  hasMoreWords: () => boolean;
}

export const useWordStore = create<WordStore>((set, get) => ({
  words: [],
  currentIndex: 0,
  isLoading: false,
  page: 1,
  pageSize: 20,
  totalCount: 0,
  searchQuery: '',
  sortBy: 'created_at',

  fetchWords: async (page = 1, search, sortBy) => {
    set({ isLoading: true });
    try {
      const currentSearch = search !== undefined ? search : get().searchQuery;
      const currentSort = sortBy || get().sortBy;
      const response = await axios.get('/api/words', {
        params: {
          page,
          page_size: get().pageSize,
          search: currentSearch,
          sort_by: currentSort,
        },
      });
      const words = response.data;
      set({
        words,
        page,
        searchQuery: currentSearch,
        sortBy: currentSort,
        isLoading: false,
        currentIndex: 0,
      });
    } catch (error) {
      set({ isLoading: false });
      console.error('Failed to fetch words:', error);
    }
  },

  addWord: async (word, definition, corpusId = '') => {
    set({ isLoading: true });
    try {
      await axios.post('/api/words', { word, definition, corpus_id: corpusId });
      set({ isLoading: false });
      await get().fetchWords(1);
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  deleteWord: async (wordId) => {
    try {
      await axios.delete(`/api/words/${wordId}`);
      const words = get().words.filter((w) => w.id !== wordId);
      set({ words });
    } catch (error) {
      console.error('Failed to delete word:', error);
    }
  },

  markWord: async (wordId, isMastered) => {
    try {
      await axios.post('/api/learn', { word_id: wordId, is_mastered: isMastered });
      const words = get().words.map((w) => {
        if (w.id === wordId) {
          const newMasterCount = isMastered ? w.master_count + 1 : w.master_count;
          const newReviewCount = isMastered ? w.review_count : w.review_count + 1;
          const total = newMasterCount + newReviewCount;
          const newForgettingIndex = total > 0 ? newReviewCount / total : 0;
          return {
            ...w,
            master_count: newMasterCount,
            review_count: newReviewCount,
            forgetting_index: newForgettingIndex,
            last_reviewed_at: new Date().toISOString(),
          };
        }
        return w;
      });
      set({ words });
    } catch (error) {
      console.error('Failed to mark word:', error);
    }
  },

  setCurrentIndex: (index) => set({ currentIndex: index }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setSortBy: (sort) => set({ sortBy: sort }),

  getCurrentWord: () => {
    const { words, currentIndex } = get();
    return words[currentIndex] || null;
  },

  goToNextWord: () => {
    const { currentIndex, words } = get();
    if (currentIndex < words.length - 1) {
      set({ currentIndex: currentIndex + 1 });
    }
  },

  hasMoreWords: () => {
    const { currentIndex, words } = get();
    return currentIndex < words.length - 1;
  },
}));
