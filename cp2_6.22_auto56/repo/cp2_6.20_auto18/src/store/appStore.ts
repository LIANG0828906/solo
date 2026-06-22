import { create } from 'zustand';
import type {
  Interview,
  EvaluationResult,
  UserInfo,
  ScoreItem,
  VoiceComment,
} from '../types';

interface AppState {
  user: UserInfo | null;
  interviews: Interview[];
  currentInterview: Interview | null;
  evaluations: EvaluationResult[];
  currentEvaluation: EvaluationResult | null;
  scores: ScoreItem[];
  voiceComments: VoiceComment[];
  isLoading: boolean;
  error: string | null;

  setUser: (user: UserInfo | null) => void;
  setInterviews: (interviews: Interview[]) => void;
  setCurrentInterview: (interview: Interview | null) => void;
  setEvaluations: (evaluations: EvaluationResult[]) => void;
  setCurrentEvaluation: (evaluation: EvaluationResult | null) => void;
  setScores: (scores: ScoreItem[]) => void;
  updateScore: (questionId: string, score: number, comment?: string) => void;
  addVoiceComment: (comment: VoiceComment) => void;
  setVoiceComments: (comments: VoiceComment[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetEvaluationState: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  interviews: [],
  currentInterview: null,
  evaluations: [],
  currentEvaluation: null,
  scores: [],
  voiceComments: [],
  isLoading: false,
  error: null,

  setUser: (user) => set({ user }),
  setInterviews: (interviews) => set({ interviews }),
  setCurrentInterview: (interview) => set({ currentInterview: interview }),
  setEvaluations: (evaluations) => set({ evaluations }),
  setCurrentEvaluation: (evaluation) => set({ currentEvaluation: evaluation }),
  setScores: (scores) => set({ scores }),

  updateScore: (questionId, score, comment) =>
    set((state) => {
      const existingIndex = state.scores.findIndex((s) => s.questionId === questionId);
      const newScores = [...state.scores];

      if (existingIndex >= 0) {
        newScores[existingIndex] = { ...newScores[existingIndex], score, comment };
      } else {
        newScores.push({ questionId, score, comment });
      }

      return { scores: newScores };
    }),

  addVoiceComment: (comment) =>
    set((state) => ({
      voiceComments: [...state.voiceComments, comment],
    })),

  setVoiceComments: (comments) => set({ voiceComments: comments }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  resetEvaluationState: () =>
    set({
      scores: [],
      voiceComments: [],
      currentEvaluation: null,
    }),
}));
