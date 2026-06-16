import { create } from 'zustand';
import {
  fetchUsers,
  fetchSummary,
  createTransaction as apiCreateTransaction,
  updateTransaction as apiUpdateTransaction,
  deleteTransaction as apiDeleteTransaction,
  updateBudget as apiUpdateBudget,
  createBudget as apiCreateBudget,
} from '../api';
import type {
  User,
  Transaction,
  Budget,
  MonthlySummary,
  TrendData,
} from '../types';

interface AppState {
  users: User[];
  currentUser: User | null;
  transactions: Transaction[];
  budgets: Budget[];
  balance: number;
  monthlySummary: MonthlySummary;
  trendData: TrendData[];
  loading: boolean;
  setCurrentUser: (user: User) => void;
  loadUsers: () => Promise<void>;
  loadAllData: (userId: string) => Promise<void>;
  addTransaction: (data: Omit<Transaction, 'id'>) => Promise<void>;
  editTransaction: (id: string, data: Partial<Transaction>) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
  editBudget: (id: string, data: Partial<Budget>) => Promise<void>;
  addBudget: (data: Omit<Budget, 'id'>) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  users: [],
  currentUser: null,
  transactions: [],
  budgets: [],
  balance: 0,
  monthlySummary: { income: 0, expense: 0 },
  trendData: [],
  loading: false,

  setCurrentUser: (user) => set({ currentUser: user }),

  loadUsers: async () => {
    const users = await fetchUsers();
    set({ users });
  },

  loadAllData: async (userId) => {
    set({ loading: true });
    try {
      const data = await fetchSummary(userId);
      const currentMonthPrefix = new Date().toISOString().slice(0, 7);
      const budgetsWithUsage = data.budgets.map((b) => {
        const used = data.transactions
          .filter(
            (t) =>
              t.type === 'expense' &&
              t.category === b.category &&
              t.date.startsWith(currentMonthPrefix)
          )
          .reduce((sum, t) => sum + t.amount, 0);
        return { ...b, used };
      });
      set({
        transactions: data.transactions,
        budgets: budgetsWithUsage,
        balance: data.balance,
        monthlySummary: data.monthlySummary,
        trendData: data.trendData,
      });
    } finally {
      set({ loading: false });
    }
  },

  addTransaction: async (data) => {
    set({ loading: true });
    try {
      const res = await apiCreateTransaction(data);
      const state = get();
      const allTransactions = [...state.transactions, res.transaction];
      const currentMonthPrefix = new Date().toISOString().slice(0, 7);
      const budgetsWithUsage = res.budgets.map((b) => {
        const used = allTransactions
          .filter(
            (t) =>
              t.type === 'expense' &&
              t.category === b.category &&
              t.date.startsWith(currentMonthPrefix)
          )
          .reduce((sum, t) => sum + t.amount, 0);
        return { ...b, used };
      });
      set({
        transactions: allTransactions,
        balance: res.balance,
        monthlySummary: res.monthlySummary,
        budgets: budgetsWithUsage,
      });
    } finally {
      set({ loading: false });
    }
  },

  editTransaction: async (id, data) => {
    set({ loading: true });
    try {
      const res = await apiUpdateTransaction(id, data);
      const state = get();
      const allTransactions = state.transactions.map((t) =>
        t.id === id ? res.transaction : t
      );
      const currentMonthPrefix = new Date().toISOString().slice(0, 7);
      const budgetsWithUsage = res.budgets.map((b) => {
        const used = allTransactions
          .filter(
            (t) =>
              t.type === 'expense' &&
              t.category === b.category &&
              t.date.startsWith(currentMonthPrefix)
          )
          .reduce((sum, t) => sum + t.amount, 0);
        return { ...b, used };
      });
      set({
        transactions: allTransactions,
        balance: res.balance,
        monthlySummary: res.monthlySummary,
        budgets: budgetsWithUsage,
      });
    } finally {
      set({ loading: false });
    }
  },

  removeTransaction: async (id) => {
    set({ loading: true });
    try {
      const res = await apiDeleteTransaction(id);
      const state = get();
      const allTransactions = state.transactions.filter((t) => t.id !== id);
      const currentMonthPrefix = new Date().toISOString().slice(0, 7);
      const budgetsWithUsage = res.budgets.map((b) => {
        const used = allTransactions
          .filter(
            (t) =>
              t.type === 'expense' &&
              t.category === b.category &&
              t.date.startsWith(currentMonthPrefix)
          )
          .reduce((sum, t) => sum + t.amount, 0);
        return { ...b, used };
      });
      set({
        transactions: allTransactions,
        balance: res.balance,
        monthlySummary: res.monthlySummary,
        budgets: budgetsWithUsage,
      });
    } finally {
      set({ loading: false });
    }
  },

  editBudget: async (id, data) => {
    const updated = await apiUpdateBudget(id, data);
    const state = get();
    set({
      budgets: state.budgets.map((b) => (b.id === id ? { ...updated, used: b.used } : b)),
    });
  },

  addBudget: async (data) => {
    const created = await apiCreateBudget(data);
    const state = get();
    set({ budgets: [...state.budgets, { ...created, used: 0 }] });
  },
}));
