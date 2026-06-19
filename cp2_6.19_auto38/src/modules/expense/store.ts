import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Trip, TripFormData } from '../trip/types';
import type { Expense, ExpenseFormData } from './types';

const STORAGE_KEY = 'trip_expense_tracker_data';

interface AppState {
  trips: Trip[];
  expenses: Expense[];
  currentTripId: string | null;
  highlightedExpenseId: string | null;
  
  addTrip: (trip: TripFormData) => void;
  addExpense: (expense: ExpenseFormData & { amount: number }) => void;
  switchTrip: (tripId: string | null) => void;
  setHighlightedExpense: (id: string | null) => void;
  getTotalExpenses: (tripId: string) => number;
  getExpensesByTrip: (tripId: string) => Expense[];
  getTripById: (tripId: string) => Trip | undefined;
  getBudgetPercentage: (tripId: string) => number;
  getDailyBudget: (tripId: string) => number;
  getCategoryTotals: (tripId: string) => Record<string, number>;
  getCumulativeExpenses: (tripId: string) => { date: string; amount: number }[];
}

const loadFromStorage = (): { trips: Trip[]; expenses: Expense[] } | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load from storage:', e);
  }
  return null;
};

const saveToStorage = (trips: Trip[], expenses: Expense[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ trips, expenses }));
  } catch (e) {
    console.error('Failed to save to storage:', e);
  }
};

const generateMockData = (): { trips: Trip[]; expenses: Expense[] } => {
  const tripId1 = uuidv4();
  const tripId2 = uuidv4();
  
  const trips: Trip[] = [
    {
      id: tripId1,
      destination: '东京之旅',
      currency: 'JPY',
      budget: 150000,
      startDate: '2026-06-01',
      endDate: '2026-06-10',
    },
    {
      id: tripId2,
      destination: '欧洲环游',
      currency: 'EUR',
      budget: 3000,
      startDate: '2026-07-15',
      endDate: '2026-08-05',
    },
  ];
  
  const categories: Expense['category'][] = ['交通', '住宿', '餐饮', '景点', '购物'];
  const expenses: Expense[] = [];
  
  const mockExpenses1 = [
    { category: '交通' as const, origAmount: 500, origCurr: 'CNY', note: '机票', date: '2026-06-01T08:00:00' },
    { category: '住宿' as const, origAmount: 8000, origCurr: 'JPY', note: '酒店首晚', date: '2026-06-01T14:00:00' },
    { category: '餐饮' as const, origAmount: 300, origCurr: 'JPY', note: '拉面', date: '2026-06-01T19:00:00' },
    { category: '景点' as const, origAmount: 2000, origCurr: 'JPY', note: '迪士尼门票', date: '2026-06-02T09:00:00' },
    { category: '交通' as const, origAmount: 500, origCurr: 'JPY', note: '地铁卡', date: '2026-06-02T08:00:00' },
    { category: '餐饮' as const, origAmount: 2500, origCurr: 'JPY', note: '寿司', date: '2026-06-02T12:30:00' },
    { category: '购物' as const, origAmount: 300, origCurr: 'CNY', note: '药妆店', date: '2026-06-03T15:00:00' },
    { category: '住宿' as const, origAmount: 8000, origCurr: 'JPY', note: '酒店第二晚', date: '2026-06-02T14:00:00' },
    { category: '餐饮' as const, origAmount: 1500, origCurr: 'JPY', note: '早餐', date: '2026-06-03T08:00:00' },
    { category: '景点' as const, origAmount: 1500, origCurr: 'JPY', note: '浅草寺', date: '2026-06-03T10:00:00' },
  ];
  
  const jpyRate = 149.50;
  const cnyRate = 7.24;
  
  mockExpenses1.forEach((e) => {
    const amount = e.origCurr === 'JPY' ? e.origAmount : (e.origAmount / cnyRate) * jpyRate;
    expenses.push({
      id: uuidv4(),
      tripId: tripId1,
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
    const amount = Math.floor(Math.random() * 5000) + 500;
    const day = Math.floor(i / 4) + 1;
    const hour = Math.floor(Math.random() * 12) + 8;
    const minute = Math.floor(Math.random() * 60);
    expenses.push({
      id: uuidv4(),
      tripId: tripId1,
      category,
      amount,
      originalAmount: amount,
      originalCurrency: 'JPY',
      note: `随机开销 ${i + 1}`,
      timestamp: `2026-06-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`,
    });
  }
  
  const mockExpenses2 = [
    { category: '交通' as const, amount: 500, note: '机票', date: '2026-07-15T10:00:00' },
    { category: '住宿' as const, amount: 150, note: '巴黎酒店', date: '2026-07-15T16:00:00' },
    { category: '餐饮' as const, amount: 80, note: '法式晚餐', date: '2026-07-15T20:00:00' },
  ];
  
  mockExpenses2.forEach((e) => {
    expenses.push({
      id: uuidv4(),
      tripId: tripId2,
      category: e.category,
      amount: e.amount,
      originalAmount: e.amount,
      originalCurrency: 'EUR',
      note: e.note,
      timestamp: e.date,
    });
  });
  
  return { trips, expenses };
};

const persistedData = loadFromStorage();
const initialData = persistedData || generateMockData();

export const useAppStore = create<AppState>((set, get) => ({
  trips: initialData.trips,
  expenses: initialData.expenses,
  currentTripId: initialData.trips.length > 0 ? initialData.trips[0].id : null,
  highlightedExpenseId: null,
  
  addTrip: (tripData) => {
    const newTrip: Trip = {
      ...tripData,
      id: uuidv4(),
    };
    set((state) => {
      const trips = [...state.trips, newTrip];
      saveToStorage(trips, state.expenses);
      return { trips, currentTripId: newTrip.id };
    });
  },
  
  addExpense: (expenseData) => {
    const newExpense: Expense = {
      ...expenseData,
      id: uuidv4(),
    };
    set((state) => {
      const expenses = [...state.expenses, newExpense];
      saveToStorage(state.trips, expenses);
      return { expenses, highlightedExpenseId: newExpense.id };
    });
  },
  
  switchTrip: (tripId) => {
    set({ currentTripId: tripId });
  },
  
  setHighlightedExpense: (id) => {
    set({ highlightedExpenseId: id });
  },
  
  getTotalExpenses: (tripId) => {
    return get()
      .expenses.filter((e) => e.tripId === tripId)
      .reduce((sum, e) => sum + e.amount, 0);
  },
  
  getExpensesByTrip: (tripId) => {
    return get()
      .expenses.filter((e) => e.tripId === tripId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },
  
  getTripById: (tripId) => {
    return get().trips.find((t) => t.id === tripId);
  },
  
  getBudgetPercentage: (tripId) => {
    const trip = get().getTripById(tripId);
    if (!trip) return 0;
    const total = get().getTotalExpenses(tripId);
    return Math.min(100, Math.round((total / trip.budget) * 100));
  },
  
  getDailyBudget: (tripId) => {
    const trip = get().getTripById(tripId);
    if (!trip) return 0;
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
  
  getCumulativeExpenses: (tripId) => {
    const expenses = get().getExpensesByTrip(tripId);
    const trip = get().getTripById(tripId);
    if (!trip) return [];
    
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
}));
