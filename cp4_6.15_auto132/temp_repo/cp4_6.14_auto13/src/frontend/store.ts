import { create } from 'zustand';
import type { Member, MealGrid } from './types';
import { generateWeekPlan } from './utils/mealPlanner';
import { membersApi } from './api/members';

interface AppState {
  members: Member[];
  mealPlan: MealGrid;
  loading: boolean;
  fetchMembers: () => Promise<void>;
  addMember: (m: Omit<Member, 'id'>) => Promise<void>;
  updateMember: (id: string, patch: Partial<Member>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  generatePlan: () => void;
  setMealPlan: (plan: MealGrid) => void;
  swapMeals: (a: [number, number], b: [number, number]) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  members: [],
  mealPlan: Array.from({ length: 7 }, () => [null, null, null]),
  loading: false,

  fetchMembers: async () => {
    try {
      const data = await membersApi.getAll();
      set({ members: data });
    } catch (e) {
      console.warn('无法加载成员列表:', e);
    }
  },

  addMember: async (m) => {
    const data = await membersApi.create(m);
    set((s) => ({ members: [...s.members, data] }));
  },

  updateMember: async (id, patch) => {
    const data = await membersApi.update(id, patch);
    set((s) => ({
      members: s.members.map((m) => (m.id === id ? data : m)),
    }));
  },

  deleteMember: async (id) => {
    await membersApi.remove(id);
    set((s) => ({ members: s.members.filter((m) => m.id !== id) }));
  },

  generatePlan: () => {
    const plan = generateWeekPlan(get().members);
    set({ mealPlan: plan });
  },

  setMealPlan: (plan) => set({ mealPlan: plan }),

  swapMeals: (a, b) => {
    const plan = get().mealPlan.map((row) => [...row]);
    const [d1, m1] = a;
    const [d2, m2] = b;
    [plan[d1][m1], plan[d2][m2]] = [plan[d2][m2], plan[d1][m1]];
    set({ mealPlan: plan });
  },
}));
