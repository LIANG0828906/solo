import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { DiaryEntry, EmotionType, InkPoint } from './types';

const STORAGE_KEY = 'ink-mood-diary-entries';

function loadFromStorage(): DiaryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(entries: DiaryEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* ignore */
  }
}

export interface DiaryStore {
  entries: DiaryEntry[];
  selectedEmotion: EmotionType;
  searchQuery: string;
  filterEmotion: EmotionType | null;
  view: 'editor' | 'timeline';
  selectedEntryId: string | null;
  currentContent: string;
  currentInkPoints: InkPoint[];

  setSelectedEmotion: (emotion: EmotionType) => void;
  setSearchQuery: (query: string) => void;
  setFilterEmotion: (emotion: EmotionType | null) => void;
  setView: (view: 'editor' | 'timeline') => void;
  setSelectedEntryId: (id: string | null) => void;
  setCurrentContent: (content: string) => void;
  setCurrentInkPoints: (points: InkPoint[]) => void;
  appendInkPoint: (point: InkPoint) => void;
  resetEditor: () => void;

  saveDiary: (thumbnail: string) => void;
  getFilteredEntries: () => DiaryEntry[];
  getSelectedEntry: () => DiaryEntry | null;
  clearAll: () => void;
}

export const useDiaryStore = create<DiaryStore>((set, get) => ({
  entries: loadFromStorage(),
  selectedEmotion: 'calm',
  searchQuery: '',
  filterEmotion: null,
  view: 'editor',
  selectedEntryId: null,
  currentContent: '',
  currentInkPoints: [],

  setSelectedEmotion: (emotion) => set({ selectedEmotion: emotion }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilterEmotion: (emotion) => set({ filterEmotion: emotion }),
  setView: (view) => set({ view, selectedEntryId: null }),
  setSelectedEntryId: (id) => set({ selectedEntryId: id }),
  setCurrentContent: (content) => set({ currentContent: content }),
  setCurrentInkPoints: (points) => set({ currentInkPoints: points }),
  appendInkPoint: (point) =>
    set((state) => ({ currentInkPoints: [...state.currentInkPoints, point] })),

  resetEditor: () =>
    set({
      currentContent: '',
      currentInkPoints: [],
      selectedEntryId: null,
    }),

  saveDiary: (thumbnail) => {
    const { currentContent, currentInkPoints, selectedEmotion, entries } = get();
    if (!currentContent.trim() && currentInkPoints.length < 5) return;

    const now = new Date();
    const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;

    const entry: DiaryEntry = {
      id: uuidv4(),
      date: dateStr,
      content: currentContent,
      emotion: selectedEmotion,
      inkPoints: currentInkPoints,
      thumbnail,
      createdAt: now.getTime(),
    };

    const newEntries = [entry, ...entries];
    saveToStorage(newEntries);
    set({
      entries: newEntries,
      currentContent: '',
      currentInkPoints: [],
      view: 'timeline',
    });
  },

  getFilteredEntries: () => {
    const { entries, searchQuery, filterEmotion } = get();
    return entries
      .filter((e) => {
        if (filterEmotion && e.emotion !== filterEmotion) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          return (
            e.content.toLowerCase().includes(q) ||
            e.date.includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  getSelectedEntry: () => {
    const { entries, selectedEntryId } = get();
    return entries.find((e) => e.id === selectedEntryId) || null;
  },

  clearAll: () => {
    saveToStorage([]);
    set({ entries: [] });
  },
}));
