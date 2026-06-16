import { create } from 'zustand';
import { DreamEntry, SymbolMatch, Connection } from '@/types';

interface DreamStore {
  dreams: DreamEntry[];
  selectedDream: DreamEntry | null;
  decodedSymbols: SymbolMatch[];
  connections: Connection[];
  addDream: (dream: DreamEntry) => void;
  selectDream: (dream: DreamEntry | null) => void;
  setDecodedSymbols: (symbols: SymbolMatch[]) => void;
  setConnections: (connections: Connection[]) => void;
  loadDreams: () => void;
}

const STORAGE_KEY = 'dream-journal-entries';

function loadFromStorage(): DreamEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveToStorage(dreams: DreamEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dreams));
  } catch {
    // storage full, ignore
  }
}

export const useDreamStore = create<DreamStore>((set, get) => ({
  dreams: [],
  selectedDream: null,
  decodedSymbols: [],
  connections: [],

  loadDreams: () => {
    const dreams = loadFromStorage();
    set({ dreams });
  },

  addDream: (dream: DreamEntry) => {
    const dreams = [dream, ...get().dreams];
    saveToStorage(dreams);
    set({ dreams });
  },

  selectDream: (dream: DreamEntry | null) => {
    set({ selectedDream: dream, decodedSymbols: [], connections: [] });
  },

  setDecodedSymbols: (symbols: SymbolMatch[]) => {
    set({ decodedSymbols: symbols });
  },

  setConnections: (connections: Connection[]) => {
    set({ connections });
  },
}));
