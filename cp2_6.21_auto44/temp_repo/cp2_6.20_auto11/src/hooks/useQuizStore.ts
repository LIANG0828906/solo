import { create } from 'zustand';
import type { Question, QuizRecord, PracticeResult } from '@/utils/api';

interface QuizState {
  quizBank: QuizRecord[];
  generatedQuestions: Question[];
  isGenerating: boolean;
  practiceHistory: PracticeResult[];
  setQuizBank: (records: QuizRecord[]) => void;
  addToQuizBank: (record: QuizRecord) => void;
  removeFromQuizBank: (id: string) => void;
  updateQuizRecord: (id: string, question: Partial<Question>) => void;
  setGeneratedQuestions: (questions: Question[]) => void;
  setIsGenerating: (val: boolean) => void;
  addPracticeResult: (result: PracticeResult) => void;
  loadFromStorage: () => void;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  quizBank: [],
  generatedQuestions: [],
  isGenerating: false,
  practiceHistory: [],

  setQuizBank: (records) => {
    set({ quizBank: records });
    saveToStorage('quiz_bank', records);
  },

  addToQuizBank: (record) => {
    const updated = [...get().quizBank, record];
    set({ quizBank: updated });
    saveToStorage('quiz_bank', updated);
  },

  removeFromQuizBank: (id) => {
    const updated = get().quizBank.filter((r) => r.id !== id);
    set({ quizBank: updated });
    saveToStorage('quiz_bank', updated);
  },

  updateQuizRecord: (id, question) => {
    const updated = get().quizBank.map((r) =>
      r.id === id ? { ...r, question: { ...r.question, ...question } } : r
    );
    set({ quizBank: updated });
    saveToStorage('quiz_bank', updated);
  },

  setGeneratedQuestions: (questions) => set({ generatedQuestions: questions }),
  setIsGenerating: (val) => set({ isGenerating: val }),

  addPracticeResult: (result) => {
    const updated = [...get().practiceHistory, result];
    set({ practiceHistory: updated });
    saveToStorage('practice_history', updated);
  },

  loadFromStorage: () => {
    const bank = loadFromStorage<QuizRecord[]>('quiz_bank') || [];
    const history = loadFromStorage<PracticeResult[]>('practice_history') || [];
    set({ quizBank: bank, practiceHistory: history });
  },
}));

function saveToStorage(key: string, data: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore storage errors
  }
}

function loadFromStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
