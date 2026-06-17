import { create } from 'zustand';
import type { DiaryEntry, MoodType, Task } from '../types';
import { DiaryService } from '../services/DiaryService';

interface DiaryState {
  entries: DiaryEntry[];
  currentEntry: DiaryEntry | null;
  isLoading: boolean;
  error: string | null;
  view: 'calendar' | 'analytics' | 'editor';
  editingEntryId: string | null;

  setView: (view: 'calendar' | 'analytics' | 'editor') => void;
  setEditingEntryId: (id: string | null) => void;
  setCurrentEntry: (entry: DiaryEntry | null) => void;

  fetchEntriesByMonth: (month: string) => Promise<void>;
  fetchAllEntries: () => Promise<void>;
  createEntry: (entry: {
    date: string;
    mood: MoodType;
    title: string;
    content: string;
    tasks: Task[];
  }) => Promise<DiaryEntry | null>;
  updateEntry: (id: string, entry: Partial<DiaryEntry>) => Promise<DiaryEntry | null>;
  deleteEntry: (id: string) => Promise<boolean>;
}

export const useDiaryStore = create<DiaryState>((set, get) => ({
  entries: [],
  currentEntry: null,
  isLoading: false,
  error: null,
  view: 'calendar',
  editingEntryId: null,

  setView: (view) => set({ view }),
  setEditingEntryId: (id) => set({ editingEntryId: id }),
  setCurrentEntry: (entry) => set({ currentEntry: entry }),

  fetchEntriesByMonth: async (month) => {
    set({ isLoading: true, error: null });
    try {
      const entries = await DiaryService.getEntriesByMonth(month);
      set({ entries, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchAllEntries: async () => {
    set({ isLoading: true, error: null });
    try {
      const entries = await DiaryService.getAllEntries();
      set({ entries, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  createEntry: async (entry) => {
    set({ isLoading: true, error: null });
    try {
      const newEntry = await DiaryService.createEntry(entry);
      set((state) => ({
        entries: [newEntry, ...state.entries],
        isLoading: false
      }));
      return newEntry;
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      return null;
    }
  },

  updateEntry: async (id, entry) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await DiaryService.updateEntry(id, entry);
      set((state) => ({
        entries: state.entries.map((e) => (e.id === id ? updated : e)),
        isLoading: false
      }));
      return updated;
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      return null;
    }
  },

  deleteEntry: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await DiaryService.deleteEntry(id);
      set((state) => ({
        entries: state.entries.filter((e) => e.id !== id),
        isLoading: false
      }));
      return true;
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      return false;
    }
  }
}));
