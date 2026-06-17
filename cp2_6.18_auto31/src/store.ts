import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { MoodEntry, MoodType, MOOD_THEME } from './types';

interface MoodStore {
  entries: MoodEntry[];
  selectedId: string | null;
  sidebarOpen: boolean;
  addEntry: (mood: MoodType, text: string) => void;
  selectEntry: (id: string | null) => void;
  toggleSidebar: () => void;
  removeEntry: (id: string) => void;
}

export const useMoodStore = create<MoodStore>((set) => ({
  entries: [],
  selectedId: null,
  sidebarOpen: true,
  addEntry: (mood, text) => {
    const newEntry: MoodEntry = {
      id: uuidv4(),
      mood,
      text,
      color: MOOD_THEME[mood].color,
      timestamp: Date.now(),
    };
    set((state) => ({
      entries: [newEntry, ...state.entries],
      selectedId: newEntry.id,
    }));
  },
  selectEntry: (id) => set({ selectedId: id }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  removeEntry: (id) =>
    set((state) => {
      const newEntries = state.entries.filter((e) => e.id !== id);
      let newSelectedId = state.selectedId;
      if (state.selectedId === id) {
        newSelectedId = newEntries.length > 0 ? newEntries[0].id : null;
      }
      return {
        entries: newEntries,
        selectedId: newSelectedId,
      };
    }),
}));
