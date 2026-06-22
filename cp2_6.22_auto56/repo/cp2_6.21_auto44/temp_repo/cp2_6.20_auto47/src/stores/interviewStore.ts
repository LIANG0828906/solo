import { create } from 'zustand';
import type { InterviewSession, GenerateQuestionsRequest, SubmitAnswerRequest } from '@/types';
import { interviewService } from '@/modules/interview/services/interviewService';

interface InterviewState {
  currentSession: InterviewSession | null;
  history: InterviewSession[];
  isLoading: boolean;
  error: string | null;

  generateSession: (request: GenerateQuestionsRequest) => Promise<InterviewSession>;
  submitAnswer: (request: SubmitAnswerRequest) => Promise<void>;
  fetchSession: (id: string) => Promise<void>;
  fetchHistory: () => Promise<void>;
}

export const useInterviewStore = create<InterviewState>((set) => ({
  currentSession: null,
  history: [],
  isLoading: false,
  error: null,

  generateSession: async (request: GenerateQuestionsRequest) => {
    set({ isLoading: true, error: null });
    try {
      const session = await interviewService.generateQuestions(request);
      set({ currentSession: session, isLoading: false });
      return session;
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      throw err;
    }
  },

  submitAnswer: async (request: SubmitAnswerRequest) => {
    set({ error: null });
    try {
      const { session, feedback } = await interviewService.submitAnswer(request);
      set((state) => ({
        currentSession: session,
        history: state.history.map((h) => (h.id === session.id ? session : h)),
      }));
      void feedback;
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  fetchSession: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const session = await interviewService.getSession(id);
      set({ currentSession: session, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchHistory: async () => {
    set({ isLoading: true, error: null });
    try {
      const history = await interviewService.getHistory();
      set({ history, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },
}));
