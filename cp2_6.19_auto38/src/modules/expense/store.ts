import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Trip } from '../trip/types';
import type { Expense, ExpenseFormData } from './types';

const STORAGE_KEY = 'trip_tracker_expenses';

interface ExpenseState {
  expenses: Expense[];
  highlightedExpenseId: string | null;
  
  addExpense: (expense: ExpenseFormData & { amount: number }) => void;
  setHighlightedExpense: (id: string | null) => void;
  getExpensesByTrip: (tripId: string) => Expense[];
  getTotalExpenses: (tripId: string) => number;
  getBudgetPercentage: (tripId: string, budget: number) => number;
  getDailyBudget: (trip: Trip) => number;
  getCategoryTotals: (tripId: string) => Record<string, number>;
  getCumulativeExpenses: (trip: Trip) => { date: string; amount: number }[];
  deleteExpense: (expenseId: string) => void;
}

const loadFromStorage = (): Expense[] | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load expenses from storage:', e);
  }
  return null;
};

const saveToStorage = (expenses: Expense[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  } catch (e) {
    console.error('Failed to save expenses to storage:', e);
  }
};

const generateMockExpenses = (tripIds: string[]): Expense[] => {
  const expenses: Expense[] = [];
  const categories: Expense['category'][] = ['交通', '住宿', '餐饮', '景点', '购物'];
  
  const jpyRate = 149.50;
  const cnyRate = 7.24;
  
  const mockExpenses1 = [
    { category: '交通' as const, origAmount: 500, origCurr: 'CNY', note: '机票', date: '2026-06-01T08:00:00' },
    { category: '住宿' as const, origAmount: 8000, origCurr: 'JPY', note: '酒店首晚', date: '2026-06-01T14:00:00' },
    { category: '餐饮' as const, origAmount: 3000, origCurr: 'JPY', note: '拉面', date: '2026-06-01T19:00:00' },
    { category: '景点' as const, origAmount: 20000, origCurr: 'JPY', note: '迪士尼门票', date: '2026-06-02T09:00:00' },
    { category: '交通' as const, origAmount: 5000, origCurr: 'JPY', note: '地铁卡', date: '2026-06-02T08:00:00' },
    { category: '餐饮' as const, origAmount: 25000, origCurr: 'JPY', note: '寿司', date: '2026-06-02T12:30:00' },
    { category: '购物' as const, origAmount: 3000, origCurr: 'CNY', note: '药妆店', date: '2026-06-03T15:00:00' },
    { category: '住宿' as const, origAmount: 8000, origCurr: 'JPY', note: '酒店第二晚', date: '2026-06-02T14:00:00' },
    { category: '餐饮' as const, origAmount: 15000, origCurr: 'JPY', note: '早餐', date: '2026-06-03T08:00:00' },
    { category: '景点' as const, origAmount: 15000, origCurr: 'JPY', note: '浅草寺', date: '2026-06-03T10:00:00' },
  ];
  
  mockExpenses1.forEach((e) => {
    const amount = e.origCurr === 'JPY' ? e.origAmount : (e.origAmount / cnyRate) * jpyRate;
    expenses.push({
      id: uuidv4(),
      tripId: tripIds[0],
      category: e.category,
      amount: Math.round(amount),
      originalAmount: e.origAmount,
      originalCurrency: e.origCurr,
      note: e.note,
      timestamp: e.date,
    });
  });
  
  for (let i = 0; i < 40; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const amount = Math.floor(Math.random() * 15000) + 1000;
    const day = Math.floor(i / 4) + 1;
    const hour = Math.floor(Math.random() * 12) + 8;
    const minute = Math.floor(Math.random() * 60);
    expenses.push({
      id: uuidv4(),
      tripId: tripIds[0],
      category,
      amount,
      originalAmount: amount,
      originalCurrency: 'JPY',
      note: `开销 ${i + 1}`,
      timestamp: `2026-06-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`,
    });
  }
  
  const mockExpenses2 = [
    { category: '交通' as const, amount: 500, note: '机票', date: '2026-07-15T10:00:00' },
    { category: '住宿' as const, amount: 150, note: '巴黎酒店', date: '2026-07-15T16:00:00' },
    { category: '餐饮' as const, amount: 80, note: '法式晚餐', date: '2026-07-15T20:00:00' },
    { category: '景点' as const, amount: 60, note: '卢浮宫', date: '2026-07-16T10:00:00' },
    { category: '购物' as const, amount: 200, note: '香水', date: '2026-07-16T15:00:00' },
  ];
  
  mockExpenses2.forEach((e) => {
    expenses.push({
      id: uuidv4(),
      tripId: tripIds[1],
      category: e.category,
      amount: e.amount,
      originalAmount: e.amount,
      originalCurrency: 'EUR',
      note: e.note,
      timestamp: e.date,
    });
  });
  
  const mockExpenses3 = [
    { category: '交通' as const, amount: 2000, note: '机票', date: '2026-09-01T08:00:00' },
    { category: '住宿' as const, amount: 1500, note: '酒店', date: '2026-09-01T14:00:00' },
    { category: '餐饮' as const, amount: 300, note: '泰式料理', date: '2026-09-01T19:00:00' },
  ];
  
  mockExpenses3.forEach((e) => {
    expenses.push({
      id: uuidv4(),
      tripId: tripIds[2],
      category: e.category,
      amount: e.amount,
      originalAmount: e.amount,
      originalCurrency: 'CNY',
      note: e.note,
      timestamp: e.date,
    });
  });
  
  return expenses;
};

const persistedExpenses = loadFromStorage();
const initialExpenses = persistedExpenses || [];

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: initialExpenses,
  highlightedExpenseId: null,
  
  addExpense: (expenseData) => {
    const newExpense: Expense = {
      ...expenseData,
      id: uuidv4(),
    };
    set((state) => {
      const expenses = [...state.expenses, newExpense];
      saveToStorage(expenses);
      return { expenses, highlightedExpenseId: newExpense.id };
    });
  },
  
  setHighlightedExpense: (id) => {
    set({ highlightedExpenseId: id });
  },
  
  getExpensesByTrip: (tripId) => {
    return get()
      .expenses.filter((e) => e.tripId === tripId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },
  
  getTotalExpenses: (tripId) => {
    return get()
      .expenses.filter((e) => e.tripId === tripId)
      .reduce((sum, e) => sum + e.amount, 0);
  },
  
  getBudgetPercentage: (tripId, budget) => {
    if (budget <= 0) return 0;
    const total = get().getTotalExpenses(tripId);
    return Math.min(100, Math.round((total / budget) * 100));
  },
  
  getDailyBudget: (trip) => {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return Math.round((trip.budget / days) * 100) / 100;
  },
  
  getCategoryTotals: (tripId) => {
    const expenses = get().getExpensesByTrip(tripId);
    const totals: Record<string, number> = {
      '交通': 0,
      '住宿': 0,
      '餐饮': 0,
      '景点': 0,
      '购物': 0,
    };
    expenses.forEach((e) => {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    });
    return totals;
  },
  
  getCumulativeExpenses: (trip) => {
    const expenses = get().getExpensesByTrip(trip.id);
    
    const dailyTotals: Record<string, number> = {};
    
    expenses.forEach((e) => {
      const date = e.timestamp.split('T')[0];
      dailyTotals[date] = (dailyTotals[date] || 0) + e.amount;
    });
    
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const result: { date: string; amount: number }[] = [];
    let cumulative = 0;
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      cumulative += dailyTotals[dateStr] || 0;
      result.push({ date: dateStr, amount: Math.round(cumulative) });
    }
    
    return result;
  },
  
  deleteExpense: (expenseId) => {
    set((state) => {
      const expenses = state.expenses.filter((e) => e.id !== expenseId);
      saveToStorage(expenses);
      return { expenses };
    });
  },
}));

export const initializeMockData = (tripIds: string[]) => {
  const persisted = loadFromStorage();
  if (!persisted || persisted.length === 0) {
    const mockData = generateMockExpenses(tripIds);
    useExpenseStore.setState({ expenses: mockData });
    saveToStorage(mockData);
  }
};

export default useExpenseStore;
