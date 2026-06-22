import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DiaryEntry } from '../types';

interface DiaryStore {
  entries: DiaryEntry[];
  saveEntry: (entry: DiaryEntry) => void;
  getEntryByDate: (date: string) => DiaryEntry | undefined;
  getMonthEntries: (year: number, month: number) => DiaryEntry[];
}

export const useDiaryStore = create<DiaryStore>()(
  persist(
    (set, get) => ({
      entries: [],
      saveEntry: (entry: DiaryEntry) => {
        const state = get();
        const existsIndex = state.entries.findIndex(e => e.date === entry.date);
        if (existsIndex >= 0) {
          const updated = [...state.entries];
          updated[existsIndex] = entry;
          set({ entries: updated });
        } else {
          set({ entries: [...state.entries, entry] });
        }
      },
      getEntryByDate: (date: string) => {
        return get().entries.find(e => e.date === date);
      },
      getMonthEntries: (year: number, month: number) => {
        const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
        return get().entries.filter(e => e.date.startsWith(prefix));
      }
    }),
    {
      name: 'mood-diary-storage',
      version: 1
    }
  )
);
