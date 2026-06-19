import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Assignment, EvaluationResult } from '../types';

interface StoreState {
  assignments: Assignment[];
  currentAssignment: Assignment | null;
  evaluationResult: EvaluationResult | null;
  code: string;
  language: 'python' | 'javascript' | 'java';
  isEvaluating: boolean;
  isLoading: boolean;
  error: string | null;
  fetchAssignments: () => Promise<void>;
  fetchAssignment: (id: string) => Promise<void>;
  evaluateCode: () => Promise<void>;
  setCode: (code: string) => void;
  setLanguage: (lang: 'python' | 'javascript' | 'java') => void;
  resetEvaluation: () => void;
}

export const useStore = create<StoreState>((set, get) => ({
  assignments: [],
  currentAssignment: null,
  evaluationResult: null,
  code: '',
  language: 'python',
  isEvaluating: false,
  isLoading: false,
  error: null,

  fetchAssignments: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/assignments');
      if (!res.ok) throw new Error('Failed to fetch assignments');
      const data: Assignment[] = await res.json();
      set({ assignments: data, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchAssignment: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/assignments/${id}`);
      if (!res.ok) throw new Error('Failed to fetch assignment');
      const data: Assignment = await res.json();
      set({
        currentAssignment: data,
        code: data.templateCode,
        language: data.language,
        evaluationResult: null,
        isLoading: false,
      });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  evaluateCode: async () => {
    const { code, language, currentAssignment } = get();
    if (!currentAssignment) return;
    set({ isEvaluating: true, error: null });
    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: currentAssignment.id,
          code,
          language,
        }),
      });
      if (!res.ok) throw new Error('Evaluation failed');
      const data: EvaluationResult = await res.json();
      set({ evaluationResult: data, isEvaluating: false });
    } catch (err) {
      set({ error: (err as Error).message, isEvaluating: false });
    }
  },

  setCode: (code: string) => set({ code }),
  setLanguage: (lang: 'python' | 'javascript' | 'java') => set({ language: lang }),
  resetEvaluation: () => set({ evaluationResult: null }),
}));
