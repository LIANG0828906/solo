import { create } from 'zustand';
import type { Transaction, SavingsGoal, GoalProgress } from '@/types';
import { fetchTransactions, fetchGoals, fetchGoalProgress } from '@/utils/api';

export type PageKey = 'home' | 'transactions' | 'stats' | 'goals' | 'settings';

interface AppState {
  transactions: Transaction[];
  goals: SavingsGoal[];
  goalProgressMap: Record<string, GoalProgress>;
  loading: boolean;
  activePage: PageKey;
  setActivePage: (page: PageKey) => void;
  loadTransactions: () => Promise<void>;
  loadGoals: () => Promise<void>;
  loadGoalProgress: (id: string) => Promise<void>;
  setTransactions: (transactions: Transaction[]) => void;
  setGoals: (goals: SavingsGoal[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useStore = create<AppState>((set, get) => ({
  transactions: [],
  goals: [],
  goalProgressMap: {},
  loading: false,
  activePage: 'home',

  setActivePage: (page) => set({ activePage: page }),
  setTransactions: (transactions) => set({ transactions }),
  setGoals: (goals) => set({ goals }),
  setLoading: (loading) => set({ loading }),

  loadTransactions: async () => {
    set({ loading: true });
    try {
      const data = await fetchTransactions();
      set({ transactions: data });
    } finally {
      set({ loading: false });
    }
  },

  loadGoals: async () => {
    set({ loading: true });
    try {
      const data = await fetchGoals();
      set({ goals: data });
    } finally {
      set({ loading: false });
    }
  },

  loadGoalProgress: async (id) => {
    const existing = get().goalProgressMap[id];
    if (existing) return;
    try {
      const data = await fetchGoalProgress(id);
      set((state) => ({
        goalProgressMap: { ...state.goalProgressMap, [id]: data },
      }));
    } catch {
    }
  },
}));
