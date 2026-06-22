import { create } from 'zustand';
import type { Unit, Abilities, Subject, Level, QuizResult, LearningRecord } from '@/types';
import { generatePath, adjustPath, submitQuiz } from '@/utils/api';

interface LearningState {
  subject: Subject;
  level: Level;
  units: Unit[];
  isGenerating: boolean;
  isAdjusting: boolean;
  abilities: Abilities;
  learningRecords: LearningRecord[];
  error: string | null;
  isFirstUnitHighlight: boolean;

  setSubject: (s: Subject) => void;
  setLevel: (l: Level) => void;
  generatePath: () => Promise<void>;
  adjustPath: () => Promise<void>;
  updateAbility: (key: keyof Abilities, value: number) => void;
  submitQuiz: (unitId: string, answers: Record<string, number>) => Promise<QuizResult | null>;
  toggleUnitExpand: (unitId: string) => void;
  setUnitInProgress: (unitId: string) => void;
  clearFirstUnitHighlight: () => void;
}

const initialAbilities: Abilities = {
  basicKnowledge: 5,
  problemSpeed: 5,
  reasoning: 5,
  memory: 5,
  comprehensive: 5,
};

export const useLearningStore = create<LearningState>((set, get) => ({
  subject: 'math',
  level: 'elementary',
  units: [],
  isGenerating: false,
  isAdjusting: false,
  abilities: initialAbilities,
  learningRecords: [],
  error: null,
  isFirstUnitHighlight: false,

  setSubject: (s) => set({ subject: s }),

  setLevel: (l) => set({ level: l }),

  generatePath: async () => {
    set({ isGenerating: true, error: null, isFirstUnitHighlight: false });
    try {
      const { subject, level, abilities } = get();
      const units = await generatePath(subject, level, abilities);
      set({ units, isGenerating: false, isFirstUnitHighlight: true });
      setTimeout(() => {
        set({ isFirstUnitHighlight: false });
      }, 2000);
    } catch (err) {
      set({ error: '路径生成失败，请重试', isGenerating: false });
    }
  },

  adjustPath: async () => {
    set({ isAdjusting: true });
    try {
      const { subject, abilities, units } = get();
      const adjustedUnits = await adjustPath(subject, abilities, units);
      set({ units: adjustedUnits, isAdjusting: false });
    } catch (err) {
      set({ error: '路径调整失败', isAdjusting: false });
    }
  },

  updateAbility: (key, value) => {
    set((state) => ({
      abilities: {
        ...state.abilities,
        [key]: value,
      },
    }));
  },

  submitQuiz: async (unitId, answers) => {
    set({ error: null });
    try {
      const result = await submitQuiz(unitId, answers);
      
      set((state) => {
        const updatedUnits = state.units.map((unit) => {
          if (unit.id === unitId) {
            const status: Unit['status'] = result.score < 60 ? 'warning' : 'completed';
            return {
              ...unit,
              score: result.score,
              timeSpent: result.timeSpent,
              status,
            };
          }
          return unit;
        });

        const unit = state.units.find((u) => u.id === unitId);
        const newRecord: LearningRecord | null = unit
          ? {
              unitId,
              unitTitle: unit.title,
              order: unit.order,
              score: result.score,
              timeSpent: result.timeSpent,
              completedAt: new Date().toISOString(),
            }
          : null;

        return {
          units: updatedUnits,
          learningRecords: newRecord
            ? [...state.learningRecords, newRecord]
            : state.learningRecords,
        };
      });

      return result;
    } catch (err) {
      set({ error: '提交失败，请重试' });
      return null;
    }
  },

  toggleUnitExpand: (unitId) => {
    set((state) => ({
      units: state.units.map((unit) =>
        unit.id === unitId ? { ...unit, isExpanded: !unit.isExpanded } : unit
      ),
    }));
  },

  setUnitInProgress: (unitId) => {
    set((state) => ({
      units: state.units.map((unit) =>
        unit.id === unitId && unit.status === 'pending'
          ? { ...unit, status: 'in-progress' }
          : unit
      ),
    }));
  },

  clearFirstUnitHighlight: () => set({ isFirstUnitHighlight: false }),
}));
