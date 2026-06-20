import { create } from 'zustand';
import type { QuizStoreState, Quiz, Answer, Score } from './types';

export const useQuizStore = create<QuizStoreState>((set) => ({
  quizzes: [],
  currentQuizId: null,
  currentQuestionIndex: 0,
  userAnswers: [],
  scoreResult: null,
  allScores: [],
  questionStartTime: 0,

  setQuizzes: (quizzes: Quiz[]) => set({ quizzes }),

  setCurrentQuiz: (quizId: string) =>
    set({
      currentQuizId: quizId,
      currentQuestionIndex: 0,
      userAnswers: [],
      scoreResult: null,
    }),

  setCurrentQuestionIndex: (index: number) =>
    set({ currentQuestionIndex: index }),

  addAnswer: (answer: Answer) =>
    set((state) => ({
      userAnswers: [...state.userAnswers, answer],
    })),

  setScoreResult: (score: Score | null) => set({ scoreResult: score }),

  setAllScores: (scores: Score[]) => set({ allScores: scores }),

  setQuestionStartTime: (time: number) => set({ questionStartTime: time }),

  resetQuiz: () =>
    set({
      currentQuizId: null,
      currentQuestionIndex: 0,
      userAnswers: [],
      scoreResult: null,
      questionStartTime: 0,
    }),
}));
