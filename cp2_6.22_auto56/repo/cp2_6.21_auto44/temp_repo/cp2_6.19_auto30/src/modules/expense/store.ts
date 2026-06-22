import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Trip } from '@/modules/trip/types';

export interface Expense {
  id: string;
  tripId: string;
  category: 'transport' | 'hotel' | 'food' | 'attraction' | 'shopping';
  amount: number;
  originalAmount: number;
  originalCurrency: string;
  note: string;
  date: string;
}

export type ExpenseCategory = Expense['category'];

export const categoryLabels: { [key in ExpenseCategory]: string } = {
  transport: '交通',
  hotel: '住宿',
  food: '餐饮',
  attraction: '景点',
  shopping: '购物',
};

export const categoryColors: { [key in ExpenseCategory]: string } = {
  transport: '#00d2ff',
  hotel: '#9c59ff',
  food: '#ff9f43',
  attraction: '#ffd93d',
  shopping: '#ff6b6b',
};

interface AppState {
  trips: Trip[];
  expenses: Expense[];
  currentTripId: string | null;
  addTrip: (trip: Omit<Trip, 'id'>) => Trip;
  switchTrip: (tripId: string | null) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => Expense;
  getExpensesByTrip: (tripId: string) => Expense[];
  getTotalSpent: (tripId: string) => number;
  getBudgetPercentage: (tripId: string) => number;
  getExpensesByCategory: (tripId: string) => { category: ExpenseCategory; amount: number }[];
  getDailyExpenses: (tripId: string) => { date: string; amount: number }[];
}

const sampleTrips: Trip[] = [
  {
    id: 'trip-1',
    destination: '东京',
    currency: 'JPY',
    budget: 200000,
    startDate: '2026-07-01',
    endDate: '2026-07-07',
  },
  {
    id: 'trip-2',
    destination: '巴黎',
    currency: 'EUR',
    budget: 1500,
    startDate: '2026-08-15',
    endDate: '2026-08-22',
  },
  {
    id: 'trip-3',
    destination: '北京',
    currency: 'CNY',
    budget: 5000,
    startDate: '2026-06-20',
    endDate: '2026-06-24',
  },
];

const sampleExpenses: Expense[] = [
  { id: 'e1', tripId: 'trip-1', category: 'transport', amount: 15000, originalAmount: 15000, originalCurrency: 'JPY', note: '成田机场到市区', date: '2026-07-01 14:30' },
  { id: 'e2', tripId: 'trip-1', category: 'hotel', amount: 45000, originalAmount: 45000, originalCurrency: 'JPY', note: '新宿酒店3晚', date: '2026-07-01 16:00' },
  { id: 'e3', tripId: 'trip-1', category: 'food', amount: 3500, originalAmount: 3500, originalCurrency: 'JPY', note: '晚餐寿司', date: '2026-07-01 19:00' },
  { id: 'e4', tripId: 'trip-1', category: 'attraction', amount: 2000, originalAmount: 2000, originalCurrency: 'JPY', note: '东京塔门票', date: '2026-07-02 10:00' },
  { id: 'e5', tripId: 'trip-1', category: 'food', amount: 1800, originalAmount: 1800, originalCurrency: 'JPY', note: '拉面', date: '2026-07-02 12:30' },
  { id: 'e6', tripId: 'trip-1', category: 'shopping', amount: 8500, originalAmount: 8500, originalCurrency: 'JPY', note: '动漫周边', date: '2026-07-02 15:00' },
  { id: 'e7', tripId: 'trip-1', category: 'food', amount: 2500, originalAmount: 2500, originalCurrency: 'JPY', note: '烤肉晚餐', date: '2026-07-02 18:30' },
  { id: 'e8', tripId: 'trip-1', category: 'transport', amount: 1200, originalAmount: 1200, originalCurrency: 'JPY', note: '地铁一日券', date: '2026-07-03 09:00' },
  { id: 'e9', tripId: 'trip-1', category: 'attraction', amount: 5000, originalAmount: 5000, originalCurrency: 'JPY', note: '迪士尼门票', date: '2026-07-03 10:00' },
  { id: 'e10', tripId: 'trip-1', category: 'food', amount: 1500, originalAmount: 1500, originalCurrency: 'JPY', note: '午餐', date: '2026-07-03 12:00' },
  { id: 'e11', tripId: 'trip-2', category: 'transport', amount: 85, originalAmount: 85, originalCurrency: 'EUR', note: '机场快线', date: '2026-08-15 14:00' },
  { id: 'e12', tripId: 'trip-2', category: 'hotel', amount: 450, originalAmount: 450, originalCurrency: 'EUR', note: '酒店3晚', date: '2026-08-15 16:00' },
  { id: 'e13', tripId: 'trip-3', category: 'transport', amount: 280, originalAmount: 280, originalCurrency: 'CNY', note: '高铁票', date: '2026-06-20 10:00' },
  { id: 'e14', tripId: 'trip-3', category: 'hotel', amount: 1200, originalAmount: 1200, originalCurrency: 'CNY', note: '酒店2晚', date: '2026-06-20 14:00' },
  { id: 'e15', tripId: 'trip-3', category: 'food', amount: 150, originalAmount: 150, originalCurrency: 'CNY', note: '烤鸭晚餐', date: '2026-06-20 18:00' },
];

export const useStore = create<AppState>((set, get) => ({
  trips: sampleTrips,
  expenses: sampleExpenses,
  currentTripId: 'trip-1',

  addTrip: (tripData) => {
    const newTrip: Trip = {
      ...tripData,
      id: uuidv4(),
    };
    set((state) => ({
      trips: [...state.trips, newTrip],
    }));
    return newTrip;
  },

  switchTrip: (tripId) => {
    set({ currentTripId: tripId });
  },

  addExpense: (expenseData) => {
    const newExpense: Expense = {
      ...expenseData,
      id: uuidv4(),
    };
    set((state) => ({
      expenses: [...state.expenses, newExpense],
    }));
    return newExpense;
  },

  getExpensesByTrip: (tripId) => {
    return get()
      .expenses.filter((e) => e.tripId === tripId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  getTotalSpent: (tripId) => {
    return get()
      .expenses.filter((e) => e.tripId === tripId)
      .reduce((sum, e) => sum + e.amount, 0);
  },

  getBudgetPercentage: (tripId) => {
    const trip = get().trips.find((t) => t.id === tripId);
    if (!trip) return 0;
    const totalSpent = get().getTotalSpent(tripId);
    return Math.min((totalSpent / trip.budget) * 100, 100);
  },

  getExpensesByCategory: (tripId) => {
    const expenses = get().expenses.filter((e) => e.tripId === tripId);
    const categories: ExpenseCategory[] = ['transport', 'hotel', 'food', 'attraction', 'shopping'];
    return categories.map((cat) => ({
      category: cat,
      amount: expenses.filter((e) => e.category === cat).reduce((sum, e) => sum + e.amount, 0),
    }));
  },

  getDailyExpenses: (tripId) => {
    const trip = get().trips.find((t) => t.id === tripId);
    if (!trip) return [];

    const expenses = get().expenses.filter((e) => e.tripId === tripId);
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const daily: { date: string; amount: number }[] = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayExpenses = expenses.filter((e) => e.date.startsWith(dateStr));
      const amount = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
      daily.push({ date: dateStr, amount });
    }

    return daily;
  },
}));
