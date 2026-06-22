import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { loadData, saveData } from '@/utils/localStorage';

export interface Tea {
  id: string;
  name: string;
  origin: string;
  year: string;
  scoreAppearance: number;
  scoreLiquorColor: number;
  scoreAroma: number;
  scoreTaste: number;
  scoreLeafBase: number;
  scoreOverall: number;
  notes: string;
  images: string[];
  createdAt: number;
  updatedAt: number;
}

export type ScoreKey = 'scoreAppearance' | 'scoreLiquorColor' | 'scoreAroma' | 'scoreTaste' | 'scoreLeafBase' | 'scoreOverall';

export const SCORE_LABELS: Record<ScoreKey, string> = {
  scoreAppearance: '外形',
  scoreLiquorColor: '汤色',
  scoreAroma: '香气',
  scoreTaste: '滋味',
  scoreLeafBase: '叶底',
  scoreOverall: '综合',
};

export const SCORE_KEYS: ScoreKey[] = [
  'scoreAppearance',
  'scoreLiquorColor',
  'scoreAroma',
  'scoreTaste',
  'scoreLeafBase',
  'scoreOverall',
];

export function createEmptyTea(): Tea {
  return {
    id: uuidv4(),
    name: '',
    origin: '',
    year: '',
    scoreAppearance: 5,
    scoreLiquorColor: 5,
    scoreAroma: 5,
    scoreTaste: 5,
    scoreLeafBase: 5,
    scoreOverall: 5,
    notes: '',
    images: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

interface TeaState {
  teas: Tea[];
  selectedTeaId: string | null;
  searchQuery: string;
  addTea: (tea?: Tea) => string;
  updateTea: (id: string, updates: Partial<Tea>) => void;
  deleteTea: (id: string) => void;
  setSelectedTeaId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  importTeas: (teas: Tea[]) => void;
  getFilteredTeas: () => Tea[];
}

const persistedData = loadData<Tea[]>();
const initialTeas = persistedData || [];

const useTeaStore = create<TeaState>((set, get) => ({
  teas: initialTeas,
  selectedTeaId: null,
  searchQuery: '',

  addTea: (tea?: Tea) => {
    const newTea = tea || createEmptyTea();
    set((state) => {
      const teas = [newTea, ...state.teas];
      saveData(teas);
      return { teas, selectedTeaId: newTea.id };
    });
    return newTea.id;
  },

  updateTea: (id, updates) => {
    set((state) => {
      const teas = state.teas.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t
      );
      saveData(teas);
      return { teas };
    });
  },

  deleteTea: (id) => {
    set((state) => {
      const teas = state.teas.filter((t) => t.id !== id);
      saveData(teas);
      const selectedTeaId = state.selectedTeaId === id ? null : state.selectedTeaId;
      return { teas, selectedTeaId };
    });
  },

  setSelectedTeaId: (id) => set({ selectedTeaId: id }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  importTeas: (importedTeas) => {
    set((state) => {
      const existingIds = new Set(state.teas.map((t) => t.id));
      const newTeas = importedTeas.filter((t) => !existingIds.has(t.id));
      const teas = [...newTeas, ...state.teas];
      saveData(teas);
      return { teas };
    });
  },

  getFilteredTeas: () => {
    const { teas, searchQuery } = get();
    if (!searchQuery.trim()) return teas;
    const q = searchQuery.toLowerCase();
    return teas.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.origin.toLowerCase().includes(q) ||
        t.year.includes(q)
    );
  },
}));

export default useTeaStore;
