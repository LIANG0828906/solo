import { create } from 'zustand';
import type { Drink, Ingredient, Sale, TodaySalesSummary, ReportData } from '@shared/types';
import { api } from '../api';

interface AppState {
  drinks: Drink[];
  ingredients: Ingredient[];
  sales: Sale[];
  todaySummary: TodaySalesSummary;
  reportData: ReportData | null;
  loading: boolean;
  error: string | null;

  loadDrinks: () => Promise<void>;
  loadIngredients: () => Promise<void>;
  loadTodaySummary: () => Promise<void>;
  loadReportData: () => Promise<void>;

  addDrink: (data: Parameters<typeof api.drinks.create>[0]) => Promise<void>;
  updateDrink: (id: string, data: Parameters<typeof api.drinks.update>[1]) => Promise<void>;
  deleteDrink: (id: string) => Promise<void>;

  addIngredient: (data: Parameters<typeof api.ingredients.create>[0]) => Promise<void>;
  updateIngredient: (id: string, data: Parameters<typeof api.ingredients.update>[1]) => Promise<void>;
  deleteIngredient: (id: string) => Promise<void>;

  addSale: (data: Parameters<typeof api.sales.create>[0]) => Promise<void>;

  setError: (error: string | null) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  drinks: [],
  ingredients: [],
  sales: [],
  todaySummary: {
    totalSales: 0,
    totalCost: 0,
    totalProfit: 0,
    orderCount: 0,
  },
  reportData: null,
  loading: false,
  error: null,

  loadDrinks: async () => {
    try {
      set({ loading: true, error: null });
      const drinks = await api.drinks.getAll();
      set({ drinks, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '加载失败', loading: false });
    }
  },

  loadIngredients: async () => {
    try {
      set({ loading: true, error: null });
      const ingredients = await api.ingredients.getAll();
      set({ ingredients, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '加载失败', loading: false });
    }
  },

  loadTodaySummary: async () => {
    try {
      set({ error: null });
      const summary = await api.sales.getTodaySummary();
      set({ todaySummary: summary });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '加载失败' });
    }
  },

  loadReportData: async () => {
    try {
      set({ loading: true, error: null });
      const data = await api.sales.get30DaysReport();
      set({ reportData: data, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '加载失败', loading: false });
    }
  },

  addDrink: async (data) => {
    try {
      set({ loading: true, error: null });
      await api.drinks.create(data);
      await get().loadDrinks();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '创建失败', loading: false });
      throw error;
    }
  },

  updateDrink: async (id, data) => {
    try {
      set({ loading: true, error: null });
      await api.drinks.update(id, data);
      await get().loadDrinks();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '更新失败', loading: false });
      throw error;
    }
  },

  deleteDrink: async (id) => {
    try {
      set({ loading: true, error: null });
      await api.drinks.delete(id);
      await get().loadDrinks();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '删除失败', loading: false });
      throw error;
    }
  },

  addIngredient: async (data) => {
    try {
      set({ loading: true, error: null });
      await api.ingredients.create(data);
      await get().loadIngredients();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '创建失败', loading: false });
      throw error;
    }
  },

  updateIngredient: async (id, data) => {
    try {
      set({ loading: true, error: null });
      await api.ingredients.update(id, data);
      await get().loadIngredients();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '更新失败', loading: false });
      throw error;
    }
  },

  deleteIngredient: async (id) => {
    try {
      set({ loading: true, error: null });
      await api.ingredients.delete(id);
      await get().loadIngredients();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '删除失败', loading: false });
      throw error;
    }
  },

  addSale: async (data) => {
    try {
      set({ loading: true, error: null });
      await api.sales.create(data);
      await Promise.all([get().loadTodaySummary(), get().loadIngredients()]);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '创建失败', loading: false });
      throw error;
    }
  },

  setError: (error) => set({ error }),
}));
