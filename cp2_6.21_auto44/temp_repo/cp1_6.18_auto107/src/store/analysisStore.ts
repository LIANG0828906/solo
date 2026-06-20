import { create } from 'zustand';
import { detectBadSmells } from '../analyzers/smellDetector';
import { BadSmell, AnalysisResult, AnalysisStatus } from '../types';

type NavKey = 'home' | 'analyze' | 'guide' | 'settings';

interface AnalysisState {
  rawCode: string;
  fileName: string;
  analysisResult: AnalysisResult;
  selectedSmellId: string | null;
  expandedSmellIds: Set<string>;
  activeNav: NavKey;
  setRawCode: (code: string, fname?: string) => void;
  startAnalysis: () => Promise<void>;
  toggleSmellExpand: (id: string) => void;
  selectSmell: (id: string) => void;
  setActiveNav: (nav: NavKey) => void;
  reset: () => void;
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  rawCode: '',
  fileName: '',
  analysisResult: {
    status: 'idle' as AnalysisStatus,
    progress: 0,
    badSmells: [] as BadSmell[]
  },
  selectedSmellId: null,
  expandedSmellIds: new Set<string>(),
  activeNav: 'analyze',

  setRawCode: (code: string, fname?: string) => {
    set({
      rawCode: code,
      fileName: fname ?? get().fileName
    });
  },

  startAnalysis: async () => {
    const { rawCode } = get();
    if (!rawCode.trim()) {
      return;
    }

    set({
      analysisResult: {
        status: 'analyzing',
        progress: 0,
        badSmells: []
      }
    });

    const progressSteps = [20, 40, 60, 80];

    for (const step of progressSteps) {
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          set((state) => ({
            analysisResult: {
              ...state.analysisResult,
              progress: step
            }
          }));
          resolve();
        }, 150);
      });
    }

    try {
      const badSmells = await detectBadSmells(rawCode);
      set((state) => ({
        analysisResult: {
          status: 'completed',
          progress: 100,
          badSmells
        }
      }));
    } catch (error) {
      set((state) => ({
        analysisResult: {
          ...state.analysisResult,
          status: 'error',
          progress: 100,
          error: error instanceof Error ? error.message : '分析失败'
        }
      }));
    }
  },

  toggleSmellExpand: (id: string) => {
    set((state) => {
      const newSet = new Set(state.expandedSmellIds);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return { expandedSmellIds: newSet };
    });
  },

  selectSmell: (id: string) => {
    set({ selectedSmellId: id });
  },

  setActiveNav: (nav: NavKey) => {
    set({ activeNav: nav });
  },

  reset: () => {
    set({
      rawCode: '',
      fileName: '',
      analysisResult: {
        status: 'idle',
        progress: 0,
        badSmells: []
      },
      selectedSmellId: null,
      expandedSmellIds: new Set<string>()
    });
  }
}));
