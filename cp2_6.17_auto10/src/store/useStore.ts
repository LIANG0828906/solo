import { create } from 'zustand';
import type { Work } from '@/types';
import { saveAll, loadAll } from './persistence';
import { generateSampleWorks } from '@/utils/sampleData';

interface AppState {
  works: Work[];
  selectedTag: string | null;
  isLoaded: boolean;
  addWork: (work: Omit<Work, 'id' | 'createdAt'>) => void;
  updateWork: (id: string, updates: Partial<Work>) => void;
  deleteWork: (id: string) => void;
  setSelectedTag: (tag: string | null) => void;
  loadWorks: () => Promise<void>;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export const useStore = create<AppState>((set, get) => ({
  works: [],
  selectedTag: null,
  isLoaded: false,

  addWork: (work) => {
    const newWork: Work = {
      ...work,
      id: generateId(),
      createdAt: Date.now(),
    };
    const newWorks = [...get().works, newWork];
    set({ works: newWorks });
    saveAll(newWorks);
  },

  updateWork: (id, updates) => {
    const newWorks = get().works.map((w) =>
      w.id === id ? { ...w, ...updates } : w
    );
    set({ works: newWorks });
    saveAll(newWorks);
  },

  deleteWork: (id) => {
    const newWorks = get().works.filter((w) => w.id !== id);
    set({ works: newWorks });
    saveAll(newWorks);
  },

  setSelectedTag: (tag) => {
    set({ selectedTag: tag });
  },

  loadWorks: async () => {
    let works = await loadAll();
    if (works.length === 0) {
      works = generateSampleWorks();
      saveAll(works);
    }
    set({ works, isLoaded: true });
  },
}));
