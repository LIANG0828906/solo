import { create } from 'zustand';
import type { AppState, AnalysisResult } from '@/types';

const initialAnalysisResult: AnalysisResult = {
  badSmells: [],
  totalSmells: 0,
};

export const useAppStore = create<AppState>((set) => ({
  rawCode: '',
  fileName: '',
  analysisResult: initialAnalysisResult,
  isAnalyzing: false,
  progress: 0,
  selectedSmellId: null,
  expandedSmellIds: new Set(),

  setRawCode: (code, fileName) =>
    set({
      rawCode: code,
      fileName: fileName || '',
      selectedSmellId: null,
      expandedSmellIds: new Set(),
    }),

  setIsAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),

  setProgress: (progress) => set({ progress }),

  setAnalysisResult: (result) => set({ analysisResult: result }),

  selectSmell: (id) => set({ selectedSmellId: id }),

  toggleExpand: (id) =>
    set((state) => {
      const next = new Set(state.expandedSmellIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { expandedSmellIds: next };
    }),

  reset: () =>
    set({
      rawCode: '',
      fileName: '',
      analysisResult: initialAnalysisResult,
      isAnalyzing: false,
      progress: 0,
      selectedSmellId: null,
      expandedSmellIds: new Set(),
    }),
}));
