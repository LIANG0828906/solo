import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Smell, Emotion, TabType } from './types';

interface StoreState {
  smells: Smell[];
  searchQuery: string;
  emotionFilter: Emotion | null;
  currentTab: TabType;
  setSmells: (smells: Smell[]) => void;
  setSearchQuery: (query: string) => void;
  setEmotionFilter: (emotion: Emotion | null) => void;
  setCurrentTab: (tab: TabType) => void;
  fetchSmells: () => Promise<void>;
  getFilteredSmells: () => Smell[];
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      smells: [],
      searchQuery: '',
      emotionFilter: null,
      currentTab: 'hall',
      setSmells: (smells) => set({ smells }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setEmotionFilter: (emotion) => set({ emotionFilter: emotion }),
      setCurrentTab: (tab) => set({ currentTab: tab }),
      fetchSmells: async () => {
        try {
          const response = await fetch('/api/smells');
          const data = await response.json();
          set({ smells: data });
        } catch (error) {
          console.error('获取气味数据失败:', error);
        }
      },
      getFilteredSmells: () => {
        const { smells, searchQuery, emotionFilter } = get();
        let filtered = smells;

        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(
            (s) =>
              s.name.toLowerCase().includes(query) ||
              s.description.toLowerCase().includes(query)
          );
        }

        if (emotionFilter) {
          filtered = filtered.filter((s) => s.emotion === emotionFilter);
        }

        return filtered;
      }
    }),
    {
      name: 'smell-memory-storage',
      partialize: (state) => ({
        smells: state.smells,
        searchQuery: state.searchQuery,
        emotionFilter: state.emotionFilter,
        currentTab: state.currentTab
      })
    }
  )
);
