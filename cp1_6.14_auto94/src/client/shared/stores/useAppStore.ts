import { create } from 'zustand';
import type {
  Client,
  Exercise,
  TrainingPlan,
  Session,
  BaselineScores,
  SelfAssessment,
  AdjustRequest,
} from '@/shared/types';
import {
  clientApi,
  exerciseApi,
  trainingPlanApi,
  sessionApi,
} from '@client/shared/api/client';

interface AppState {
  clients: Client[];
  exercises: Exercise[];
  currentPlan: TrainingPlan | null;
  currentSession: Session | null;
  sidebarOpen: boolean;

  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  fetchClients: () => Promise<void>;
  createClient: (data: Omit<Client, 'id' | 'createdAt'>) => Promise<Client>;
  updateBaseline: (id: string, baseline: BaselineScores) => Promise<void>;

  fetchExercises: () => Promise<void>;
  createExercise: (data: Omit<Exercise, 'id'>) => Promise<Exercise>;
  updateExercise: (id: string, data: Partial<Omit<Exercise, 'id'>>) => Promise<void>;

  fetchClientPlan: (clientId: string) => Promise<void>;
  createPlan: (data: Omit<TrainingPlan, 'id' | 'createdAt'>) => Promise<TrainingPlan>;
  updatePlan: (id: string, data: Partial<Omit<TrainingPlan, 'id' | 'createdAt'>>) => Promise<void>;
  adjustPlan: (id: string, data: AdjustRequest) => Promise<void>;

  fetchTodaySession: (clientId: string) => Promise<void>;
  fetchSession: (id: string) => Promise<void>;
  recordSession: (data: Omit<Session, 'id'>) => Promise<Session>;
  submitSelfAssessment: (sessionId: string, data: SelfAssessment) => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  clients: [],
  exercises: [],
  currentPlan: null,
  currentSession: null,
  sidebarOpen: false,

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  fetchClients: async () => {
    const clients = await clientApi.getClients();
    set({ clients });
  },

  createClient: async (data) => {
    const client = await clientApi.createClient(data);
    set((s) => ({ clients: [...s.clients, client] }));
    return client;
  },

  updateBaseline: async (id, baseline) => {
    const updated = await clientApi.updateBaseline(id, baseline);
    set((s) => ({
      clients: s.clients.map((c) => (c.id === id ? updated : c)),
    }));
  },

  fetchExercises: async () => {
    const exercises = await exerciseApi.getExercises();
    set({ exercises });
  },

  createExercise: async (data) => {
    const exercise = await exerciseApi.createExercise(data);
    set((s) => ({ exercises: [...s.exercises, exercise] }));
    return exercise;
  },

  updateExercise: async (id, data) => {
    const updated = await exerciseApi.updateExercise(id, data);
    set((s) => ({
      exercises: s.exercises.map((e) => (e.id === id ? updated : e)),
    }));
  },

  fetchClientPlan: async (clientId) => {
    const currentPlan = await trainingPlanApi.getClientPlan(clientId);
    set({ currentPlan });
  },

  createPlan: async (data) => {
    const plan = await trainingPlanApi.createPlan(data);
    set({ currentPlan: plan });
    return plan;
  },

  updatePlan: async (id, data) => {
    const updated = await trainingPlanApi.updatePlan(id, data);
    set({ currentPlan: updated });
  },

  adjustPlan: async (id, data) => {
    const updated = await trainingPlanApi.adjustPlan(id, data);
    set({ currentPlan: updated });
  },

  fetchTodaySession: async (clientId) => {
    const currentSession = await sessionApi.getTodaySession(clientId);
    set({ currentSession });
  },

  fetchSession: async (id) => {
    const currentSession = await sessionApi.getSession(id);
    set({ currentSession });
  },

  recordSession: async (data) => {
    const session = await sessionApi.recordSession(data);
    set({ currentSession: session });
    return session;
  },

  submitSelfAssessment: async (sessionId, data) => {
    const updated = await sessionApi.submitSelfAssessment(sessionId, data);
    set({ currentSession: updated });
  },
}));
