import { create } from 'zustand';
import type { Food, FoodRecord, UserProfile, NutritionGoals, WeeklyMealPlan } from '@/types';

interface AppState {
  foods: Food[];
  records: FoodRecord[];
  profile: UserProfile | null;
  goals: NutritionGoals | null;
  mealPlan: WeeklyMealPlan | null;
  isLoading: boolean;
  fetchFoods: (search?: string) => Promise<void>;
  fetchRecords: (date?: string) => Promise<void>;
  fetchProfile: () => Promise<void>;
  fetchGoals: () => Promise<void>;
  fetchMealPlan: () => Promise<void>;
  addRecord: (record: Omit<FoodRecord, 'id'>) => Promise<FoodRecord | null>;
  deleteRecord: (id: string) => Promise<boolean>;
  updateProfile: (profile: UserProfile) => Promise<UserProfile | null>;
}

const API_BASE = 'http://localhost:3001/api';

if (typeof window !== 'undefined') {
  const currentPort = window.location.port;
  if (currentPort && currentPort !== '3000') {
    console.warn(`Frontend running on port ${currentPort}, but API is configured for port 3001. Make sure backend is running on port 3001.`);
  }
}

export const useStore = create<AppState>((set) => ({
  foods: [],
  records: [],
  profile: null,
  goals: null,
  mealPlan: null,
  isLoading: false,

  fetchFoods: async (search?: string) => {
    try {
      const url = search ? `${API_BASE}/foods?name=${encodeURIComponent(search)}` : `${API_BASE}/foods`;
      const res = await fetch(url);
      const data: Food[] = await res.json();
      set({ foods: data });
    } catch (error) {
      console.error('Failed to fetch foods:', error);
    }
  },

  fetchRecords: async (date?: string) => {
    try {
      const url = date ? `${API_BASE}/records?date=${date}` : `${API_BASE}/records`;
      const res = await fetch(url);
      const data: FoodRecord[] = await res.json();
      set({ records: data });
    } catch (error) {
      console.error('Failed to fetch records:', error);
    }
  },

  fetchProfile: async () => {
    try {
      const res = await fetch(`${API_BASE}/profile`);
      const data: UserProfile = await res.json();
      set({ profile: data });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  },

  fetchGoals: async () => {
    try {
      const res = await fetch(`${API_BASE}/goals`);
      const data: NutritionGoals = await res.json();
      set({ goals: data });
    } catch (error) {
      console.error('Failed to fetch goals:', error);
    }
  },

  fetchMealPlan: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_BASE}/plan`);
      const data: WeeklyMealPlan = await res.json();
      set({ mealPlan: data });
    } catch (error) {
      console.error('Failed to fetch meal plan:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addRecord: async (record: Omit<FoodRecord, 'id'>) => {
    try {
      const res = await fetch(`${API_BASE}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
      const data: FoodRecord = await res.json();
      if (res.ok) {
        set((state: AppState) => ({ records: [...state.records, data] }));
        return data;
      }
    } catch (error) {
      console.error('Failed to add record:', error);
    }
    return null;
  },

  deleteRecord: async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/records/${id}`, { method: 'DELETE' });
      if (res.ok) {
        set((state: AppState) => ({ records: state.records.filter((r: FoodRecord) => r.id !== id) }));
        return true;
      }
    } catch (error) {
      console.error('Failed to delete record:', error);
    }
    return false;
  },

  updateProfile: async (profile: UserProfile) => {
    try {
      const res = await fetch(`${API_BASE}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const data: UserProfile = await res.json();
      if (res.ok) {
        set({ profile: data });
        return data;
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
    return null;
  },
}));
