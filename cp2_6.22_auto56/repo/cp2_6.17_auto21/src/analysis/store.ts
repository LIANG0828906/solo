import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { analyze } from './analyzer';
import { saveToDB, loadFromDB, cleanupOldHistory } from '../utils/db';
import type { AnalysisState, Thresholds, HistoryRecord } from '../utils/db';

const DEFAULT_THRESHOLDS: Thresholds = {
  duplicationLines: 3,
  complexity: 10,
  maxFunctionLines: 50,
};

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  code: '',
  filename: 'untitled.js',
  thresholds: DEFAULT_THRESHOLDS,
  result: null,
  selectedIssueId: null,
  isAnalyzing: false,
  highlightLineStart: null,
  highlightLineEnd: null,

  setCode: (code: string, filename?: string) => {
    set({ 
      code, 
      filename: filename || get().filename,
      result: null,
    });
  },

  setFilename: (filename: string) => {
    set({ filename });
  },

  setThresholds: async (newThresholds: Partial<Thresholds>) => {
    const updated = { ...get().thresholds, ...newThresholds };
    set({ thresholds: updated });
    try {
      await saveToDB('settings', 'thresholds', updated);
    } catch (e) {
      console.error('Failed to save thresholds:', e);
    }
  },

  loadThresholds: async () => {
    try {
      const saved = await loadFromDB('settings', 'thresholds');
      if (saved) {
        set({ thresholds: saved as Thresholds });
      }
    } catch (e) {
      console.error('Failed to load thresholds:', e);
    }
  },

  analyzeCode: async () => {
    const { code, thresholds, filename } = get();
    
    if (!code.trim()) {
      set({ result: null });
      return;
    }

    set({ isAnalyzing: true });
    
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const result = analyze(code, thresholds);
      
      const record: HistoryRecord = {
        id: uuidv4(),
        filename,
        code,
        result,
        thresholds: { ...thresholds },
        createdAt: Date.now(),
      };
      
      await saveToDB('history', record.id, record);
      await cleanupOldHistory(100);
      
      set({ result, isAnalyzing: false });
    } catch (e) {
      console.error('Analysis failed:', e);
      set({ isAnalyzing: false });
    }
  },

  selectIssue: (id: string | null) => {
    const { result } = get();
    if (!result || !id) {
      set({ 
        selectedIssueId: null, 
        highlightLineStart: null, 
        highlightLineEnd: null 
      });
      return;
    }
    
    const issue = result.issues.find(i => i.id === id);
    if (issue) {
      set({ 
        selectedIssueId: id,
        highlightLineStart: issue.lineStart,
        highlightLineEnd: issue.lineEnd,
      });
    }
  },

  clearHighlight: () => {
    set({ 
      selectedIssueId: null, 
      highlightLineStart: null, 
      highlightLineEnd: null 
    });
  },

  loadFromHistory: (record: HistoryRecord) => {
    set({
      code: record.code,
      filename: record.filename,
      thresholds: record.thresholds,
      result: record.result,
      selectedIssueId: null,
      highlightLineStart: null,
      highlightLineEnd: null,
    });
  },

  setHighlight: (start: number | null, end: number | null) => {
    set({ highlightLineStart: start, highlightLineEnd: end });
  },
}));
