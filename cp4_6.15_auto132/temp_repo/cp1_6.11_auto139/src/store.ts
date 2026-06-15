import { create } from 'zustand';
import { Decision, DecisionType, FilterType, ViewMode } from './types';
import * as api from './api';

interface DecisionStore {
  decisions: Decision[];
  filter: FilterType;
  searchKeyword: string;
  viewMode: ViewMode;
  selectedId: string | null;
  isLoading: boolean;
  isModalOpen: boolean;
  editingDecision: Decision | null;
  filteredDecisions: () => Decision[];
  fetchDecisions: () => Promise<void>;
  addDecision: (data: { title: string; description: string; type: DecisionType; author: string }) => Promise<void>;
  updateDecision: (id: string, data: Partial<Pick<Decision, 'title' | 'description' | 'type'>>) => Promise<void>;
  removeDecision: (id: string) => Promise<void>;
  addComment: (id: string, data: { author: string; content: string }) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  setFilter: (filter: FilterType) => void;
  setSearchKeyword: (keyword: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedId: (id: string | null) => void;
  setIsModalOpen: (open: boolean) => void;
  setEditingDecision: (decision: Decision | null) => void;
}

export const useDecisionStore = create<DecisionStore>((set, get) => ({
  decisions: [],
  filter: 'all',
  searchKeyword: '',
  viewMode: 'timeline',
  selectedId: null,
  isLoading: false,
  isModalOpen: false,
  editingDecision: null,

  filteredDecisions: () => {
    const { decisions, filter, searchKeyword } = get();
    let result = decisions;

    if (filter !== 'all') {
      result = result.filter(d => d.type === filter);
    }

    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase();
      result = result.filter(
        d => d.title.toLowerCase().includes(keyword) || d.description.toLowerCase().includes(keyword)
      );
    }

    result = [...result].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return result;
  },

  fetchDecisions: async () => {
    set({ isLoading: true });
    try {
      const decisions = await api.fetchDecisions();
      set({ decisions });
    } finally {
      set({ isLoading: false });
    }
  },

  addDecision: async (data) => {
    const decision = await api.createDecision(data);
    set(state => ({ decisions: [decision, ...state.decisions] }));
  },

  updateDecision: async (id, data) => {
    const updated = await api.updateDecision(id, data);
    set(state => ({
      decisions: state.decisions.map(d => (d.id === id ? updated : d)),
    }));
  },

  removeDecision: async (id) => {
    await api.deleteDecision(id);
    set(state => ({
      decisions: state.decisions.filter(d => d.id !== id),
    }));
  },

  addComment: async (id, data) => {
    const comment = await api.addComment(id, data);
    set(state => ({
      decisions: state.decisions.map(d =>
        d.id === id ? { ...d, comments: [...d.comments, comment] } : d
      ),
    }));
  },

  togglePin: async (id) => {
    const updated = await api.togglePin(id);
    set(state => ({
      decisions: state.decisions.map(d => (d.id === id ? updated : d)),
    }));
  },

  setFilter: (filter) => set({ filter }),
  setSearchKeyword: (searchKeyword) => set({ searchKeyword }),
  setViewMode: (viewMode) => set({ viewMode }),
  setSelectedId: (selectedId) => set({ selectedId }),
  setIsModalOpen: (isModalOpen) => set({ isModalOpen }),
  setEditingDecision: (editingDecision) => set({ editingDecision }),
}));
