import { create } from 'zustand';
import type { QuestionnaireTemplate, QuestionnaireResponse, Question } from './types';

interface AppState {
  template: QuestionnaireTemplate | null;
  responses: QuestionnaireResponse[];
  currentQuestionIndex: number;
  answers: Record<string, string | string[] | number>;
  pendingCount: number;
  setTemplate: (template: QuestionnaireTemplate) => void;
  addQuestion: (question: Question) => void;
  updateQuestion: (id: string, updates: Partial<Question>) => void;
  deleteQuestion: (id: string) => void;
  reorderQuestions: (questions: Question[]) => void;
  setAnswers: (answers: Record<string, string | string[] | number>) => void;
  setAnswer: (questionId: string, value: string | string[] | number) => void;
  addResponse: (response: QuestionnaireResponse) => void;
  setResponses: (responses: QuestionnaireResponse[]) => void;
  setCurrentQuestionIndex: (index: number) => void;
  setPendingCount: (count: number) => void;
  resetAnswers: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  template: null,
  responses: [],
  currentQuestionIndex: 0,
  answers: {},
  pendingCount: 0,
  setTemplate: (template) => set({ template }),
  addQuestion: (question) =>
    set((state) => ({
      template: state.template
        ? {
            ...state.template,
            questions: [...state.template.questions, question],
          }
        : null,
    })),
  updateQuestion: (id, updates) =>
    set((state) => ({
      template: state.template
        ? {
            ...state.template,
            questions: state.template.questions.map((q) =>
              q.id === id ? { ...q, ...updates } : q
            ),
          }
        : null,
    })),
  deleteQuestion: (id) =>
    set((state) => ({
      template: state.template
        ? {
            ...state.template,
            questions: state.template.questions.filter((q) => q.id !== id),
          }
        : null,
    })),
  reorderQuestions: (questions) =>
    set((state) => ({
      template: state.template
        ? {
            ...state.template,
            questions,
          }
        : null,
    })),
  setAnswers: (answers) => set({ answers }),
  setAnswer: (questionId, value) =>
    set((state) => ({
      answers: { ...state.answers, [questionId]: value },
    })),
  addResponse: (response) =>
    set((state) => ({
      responses: [...state.responses, response],
    })),
  setResponses: (responses) => set({ responses }),
  setCurrentQuestionIndex: (index) => set({ currentQuestionIndex: index }),
  setPendingCount: (count) => set({ pendingCount: count }),
  resetAnswers: () => set({ answers: {}, currentQuestionIndex: 0 }),
}));
