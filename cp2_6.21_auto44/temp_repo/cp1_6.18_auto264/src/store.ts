import { create } from 'zustand';
import type { UserRole, TrainingPlan } from './types';

interface AppState {
  role: UserRole;
  currentPlan: TrainingPlan | null;
  plans: TrainingPlan[];
  setRole: (role: UserRole) => void;
  setCurrentPlan: (plan: TrainingPlan | null) => void;
  addPlan: (plan: TrainingPlan) => void;
}

export const useAppStore = create<AppState>((set) => ({
  role: null,
  currentPlan: null,
  plans: [],
  setRole: (role) => set({ role }),
  setCurrentPlan: (plan) => set({ currentPlan: plan }),
  addPlan: (plan) => set((state) => ({ plans: [...state.plans, plan] }))
}));
