import { create } from 'zustand';
import type { Food, UserSettings, MealPlan } from '../types';

interface FoodState {
  foods: Food[];
  settings: UserSettings;
  mealPlan: MealPlan;
  loading: boolean;
  error: string | null;
  selectedIds: Set<string>;
  fetchFoods: () => Promise<void>;
  addFood: (food: Food) => Promise<void>;
  updateFood: (id: string, food: Partial<Food>) => Promise<void>;
  deleteFood: (id: string) => Promise<void>;
  batchDelete: (ids: string[]) => Promise<void>;
  batchExpire: (ids: string[]) => Promise<void>;
  fetchSettings: () => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  fetchMealPlan: (goal?: string) => Promise<void>;
  toggleSelect: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
}

export const useFoodStore = create<FoodState>((set, get) => ({
  foods: [],
  settings: {
    goalType: 'balanced',
    dailyCalories: 2500,
    proteinRatio: 20,
    fatRatio: 30,
    carbRatio: 50,
  },
  mealPlan: { breakfast: [], lunch: [], dinner: [] },
  loading: false,
  error: null,
  selectedIds: new Set<string>(),

  fetchFoods: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/foods');
      const data = await res.json();
      set({ foods: data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  addFood: async (food: Food) => {
    try {
      const res = await fetch('/api/foods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(food),
      });
      if (res.ok) {
        const newFood = await res.json();
        set((state) => ({ foods: [newFood, ...state.foods] }));
      }
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  updateFood: async (id: string, food: Partial<Food>) => {
    try {
      const res = await fetch(`/api/foods/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(food),
      });
      if (res.ok) {
        set((state) => ({
          foods: state.foods.map((f) => (f.id === id ? { ...f, ...food } : f)),
        }));
      }
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  deleteFood: async (id: string) => {
    try {
      const res = await fetch(`/api/foods/${id}`, { method: 'DELETE' });
      if (res.ok) {
        set((state) => ({ foods: state.foods.filter((f) => f.id !== id) }));
      }
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  batchDelete: async (ids: string[]) => {
    try {
      const res = await fetch('/api/foods/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (res.ok) {
        set((state) => ({
          foods: state.foods.filter((f) => !ids.includes(f.id)),
          selectedIds: new Set(),
        }));
      }
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  batchExpire: async (ids: string[]) => {
    try {
      const res = await fetch('/api/foods/batch-expire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (res.ok) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const expiredDate = yesterday.toISOString().split('T')[0];
        set((state) => ({
          foods: state.foods.map((f) =>
            ids.includes(f.id) ? { ...f, expiryDate: expiredDate } : f
          ),
          selectedIds: new Set(),
        }));
      }
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  fetchSettings: async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      set({ settings: data });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  updateSettings: async (settings: Partial<UserSettings>) => {
    try {
      const current = get().settings;
      const newSettings = { ...current, ...settings };
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      if (res.ok) {
        set({ settings: newSettings });
      }
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  fetchMealPlan: async (goal?: string) => {
    set({ loading: true, error: null });
    try {
      const goalParam = goal || get().settings.goalType;
      const res = await fetch(`/api/meal-plan?goal=${goalParam}`);
      const data = await res.json();
      set({ mealPlan: data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  toggleSelect: (id: string) => {
    set((state) => {
      const newSet = new Set(state.selectedIds);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return { selectedIds: newSet };
    });
  },

  selectAll: () => {
    set((state) => ({ selectedIds: new Set(state.foods.map((f) => f.id)) }));
  },

  clearSelection: () => {
    set({ selectedIds: new Set() });
  },
}));
