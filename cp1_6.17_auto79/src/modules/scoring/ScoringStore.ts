import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ScoreRecord, InterviewMeta } from '@/types';

interface ScoringState {
  scores: ScoreRecord[];
  interviews: InterviewMeta[];
  addScore: (record: ScoreRecord) => void;
  addInterview: (meta: InterviewMeta) => void;
  getAllScores: () => ScoreRecord[];
  getScoresByInterview: (interviewId: string) => ScoreRecord[];
  getInterviews: () => InterviewMeta[];
}

export const useScoringStore = create<ScoringState>()(
  persist(
    (set, get) => ({
      scores: [],
      interviews: [],

      addScore: (record: ScoreRecord) => {
        set((state) => {
          const existingIndex = state.scores.findIndex(
            (s) => s.interviewId === record.interviewId && s.questionId === record.questionId
          );
          if (existingIndex >= 0) {
            const updated = [...state.scores];
            updated[existingIndex] = record;
            return { scores: updated };
          }
          return { scores: [...state.scores, record] };
        });
      },

      addInterview: (meta: InterviewMeta) => {
        set((state) => {
          const exists = state.interviews.some((i) => i.interviewId === meta.interviewId);
          if (exists) return state;
          return { interviews: [...state.interviews, meta] };
        });
      },

      getAllScores: () => get().scores,

      getScoresByInterview: (interviewId: string) =>
        get().scores.filter((s) => s.interviewId === interviewId),

      getInterviews: () => get().interviews,
    }),
    {
      name: 'interview-scoring-storage',
    }
  )
);
