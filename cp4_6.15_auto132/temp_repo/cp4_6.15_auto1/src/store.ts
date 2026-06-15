import { create } from 'zustand';
import type { Question, ScoreRecord, GlobalStats } from '@/types';
import { saveData, loadData } from '@/utils/storage';

interface AppState {
  questions: Question[];
  scoreRecords: ScoreRecord[];
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;

  loadFromStorage: () => void;
  addQuestion: (q: Question) => void;
  updateQuestion: (q: Question) => void;
  deleteQuestion: (id: string) => void;
  importQuestions: (qs: Question[]) => void;
  addScoreRecord: (r: ScoreRecord) => void;
  toggleSidebar: () => void;
  toggleMobileMenu: () => void;
  getGlobalStats: () => GlobalStats;
}

export const useStore = create<AppState>((set, get) => ({
  questions: [],
  scoreRecords: [],
  sidebarCollapsed: false,
  mobileMenuOpen: false,

  loadFromStorage: () => {
    const questions = loadData<Question[]>('questions') || [];
    const scoreRecords = loadData<ScoreRecord[]>('scoreRecords') || [];
    set({ questions, scoreRecords });
  },

  addQuestion: (q) => {
    const questions = [...get().questions, q];
    saveData('questions', questions);
    set({ questions });
  },

  updateQuestion: (q) => {
    const questions = get().questions.map((item) => (item.id === q.id ? q : item));
    saveData('questions', questions);
    set({ questions });
  },

  deleteQuestion: (id) => {
    const questions = get().questions.filter((item) => item.id !== id);
    saveData('questions', questions);
    set({ questions });
  },

  importQuestions: (qs) => {
    const existing = get().questions;
    const existingIds = new Set(existing.map((q) => q.id));
    const newOnes = qs.filter((q) => !existingIds.has(q.id));
    const questions = [...existing, ...newOnes];
    saveData('questions', questions);
    set({ questions });
  },

  addScoreRecord: (r) => {
    const scoreRecords = [...get().scoreRecords, r];
    saveData('scoreRecords', scoreRecords);
    set({ scoreRecords });
  },

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleMobileMenu: () => set((s) => ({ mobileMenuOpen: !s.mobileMenuOpen })),

  getGlobalStats: () => {
    const records = get().scoreRecords;
    if (records.length === 0) {
      return { totalSubmissions: 0, averageScore: 0, highestScore: 0, lowestScore: 0 };
    }
    const scores = records.map((r) => r.totalScore);
    return {
      totalSubmissions: records.length,
      averageScore: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
    };
  },
}));
