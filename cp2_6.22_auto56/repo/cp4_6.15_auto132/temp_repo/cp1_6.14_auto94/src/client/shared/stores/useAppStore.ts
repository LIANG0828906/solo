import { create } from 'zustand';
import api from '../api/client';
import type { Client, Exercise, TrainingPlan, Session } from '../../../shared/types';

interface AppState {
  clients: Client[];
  exercises: Exercise[];
  currentPlan: TrainingPlan | null;
  currentSession: Session | null;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  fetchClients: () => Promise<void>;
  fetchExercises: (params?: { muscleGroup?: string; search?: string }) => Promise<void>;
  createClient: (data: Omit<Client, 'id' | 'createdAt'>) => Promise<Client>;
  createExercise: (data: Omit<Exercise, 'id'>) => Promise<Exercise>;
}

export const useAppStore = create<AppState>((set) => ({
  clients: [],
  exercises: [],
  currentPlan: null,
  currentSession: null,
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  fetchClients: async () => {
    try {
      const res = await api.get<Client[]>('/clients');
      set({ clients: res.data });
    } catch { /* ignore */ }
  },

  fetchExercises: async (params) => {
    try {
      const query = new URLSearchParams();
      if (params?.muscleGroup) query.set('muscleGroup', params.muscleGroup);
      if (params?.search) query.set('search', params.search);
      const res = await api.get<Exercise[]>(`/exercises${query.toString() ? `?${query.toString()}` : ''}`);
      set({ exercises: res.data });
    } catch { /* ignore */ }
  },

  createClient: async (data) => {
    const res = await api.post<Client>('/clients', data);
    set((state) => ({ clients: [...state.clients, res.data] }));
    return res.data;
  },

  createExercise: async (data) => {
    const res = await api.post<Exercise>('/exercises', data);
    set((state) => ({ exercises: [...state.exercises, res.data] }));
    return res.data;
  },
}));
