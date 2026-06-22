import { create } from 'zustand';
import type { CalligraphyWork } from './CalligraphyEngine';
import type { Critique } from './CritiqueManager';

interface User {
  id: string;
  name: string;
  avatar: string;
}

interface AppState {
  user: User;
  works: CalligraphyWork[];
  currentWork: CalligraphyWork | null;
  critiques: Critique[];
  isLoading: boolean;
  setUser: (user: User) => void;
  setWorks: (works: CalligraphyWork[]) => void;
  setCurrentWork: (work: CalligraphyWork | null) => void;
  setCritiques: (critiques: Critique[]) => void;
  setIsLoading: (loading: boolean) => void;
  addWork: (work: CalligraphyWork) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: {
    id: 'user_001',
    name: '墨客',
    avatar: ''
  },
  works: [],
  currentWork: null,
  critiques: [],
  isLoading: false,
  setUser: (user) => set({ user }),
  setWorks: (works) => set({ works }),
  setCurrentWork: (work) => set({ currentWork: work }),
  setCritiques: (critiques) => set({ critiques }),
  setIsLoading: (isLoading) => set({ isLoading }),
  addWork: (work) => set((state) => ({ works: [work, ...state.works] }))
}));
