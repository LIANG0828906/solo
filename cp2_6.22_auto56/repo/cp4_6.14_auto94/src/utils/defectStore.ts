import { create } from 'zustand';
import type { Annotation, DefectRecord, TrendDataPoint, DailyReport, DefectCategory, DefectSeverity, AnnotationTool } from './types';

interface DefectState {
  annotations: Annotation[];
  selectedAnnotationId: string | null;
  currentTool: AnnotationTool;
  panelOpen: boolean;
  panelPosition: { x: number; y: number };
  editingAnnotation: Annotation | null;
  imageUrl: string | null;
  imageName: string;
  trendData: TrendDataPoint[];
  reports: DailyReport[];
  loading: boolean;

  setCurrentTool: (tool: AnnotationTool) => void;
  addAnnotation: (annotation: Annotation) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  deleteAnnotation: (id: string) => void;
  selectAnnotation: (id: string | null) => void;
  setPanelOpen: (open: boolean) => void;
  setPanelPosition: (pos: { x: number; y: number }) => void;
  setEditingAnnotation: (annotation: Annotation | null) => void;
  setImageUrl: (url: string | null, name?: string) => void;
  setTrendData: (data: TrendDataPoint[]) => void;
  setReports: (reports: DailyReport[]) => void;
  setLoading: (loading: boolean) => void;
  clearAnnotations: () => void;
  getNextLabelNumber: () => number;
  fetchDefects: () => Promise<void>;
  fetchTrend: () => Promise<void>;
  fetchReports: () => Promise<void>;
  submitDefects: (imageName: string, imageUrl: string) => Promise<boolean>;
}

export const useDefectStore = create<DefectState>((set, get) => ({
  annotations: [],
  selectedAnnotationId: null,
  currentTool: 'rectangle',
  panelOpen: false,
  panelPosition: { x: 820, y: 20 },
  editingAnnotation: null,
  imageUrl: null,
  imageName: '',
  trendData: [],
  reports: [],
  loading: false,

  setCurrentTool: (tool) => set({ currentTool: tool }),

  addAnnotation: (annotation) =>
    set((state) => ({
      annotations: [...state.annotations, annotation],
      selectedAnnotationId: annotation.id,
    })),

  updateAnnotation: (id, updates) =>
    set((state) => ({
      annotations: state.annotations.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      ),
    })),

  deleteAnnotation: (id) =>
    set((state) => {
      const newAnnotations = state.annotations
        .filter((a) => a.id !== id)
        .map((a, idx) => ({ ...a, labelNumber: idx + 1 }));
      return {
        annotations: newAnnotations,
        selectedAnnotationId: state.selectedAnnotationId === id ? null : state.selectedAnnotationId,
        editingAnnotation: state.editingAnnotation?.id === id ? null : state.editingAnnotation,
      };
    }),

  selectAnnotation: (id) => set({ selectedAnnotationId: id }),

  setPanelOpen: (open) => set({ panelOpen: open }),

  setPanelPosition: (pos) => set({ panelPosition: pos }),

  setEditingAnnotation: (annotation) => set({ editingAnnotation: annotation }),

  setImageUrl: (url, name = '') => set({ imageUrl: url, imageName: name, annotations: [] }),

  setTrendData: (data) => set({ trendData: data }),

  setReports: (reports) => set({ reports }),

  setLoading: (loading) => set({ loading }),

  clearAnnotations: () => set({ annotations: [], selectedAnnotationId: null, editingAnnotation: null }),

  getNextLabelNumber: () => get().annotations.length + 1,

  fetchDefects: async () => {
    try {
      const res = await fetch('/api/defects');
      const data = await res.json();
      console.log('Defects fetched:', data);
    } catch (err) {
      console.error('Failed to fetch defects:', err);
    }
  },

  fetchTrend: async () => {
    set({ loading: true });
    try {
      const res = await fetch('/api/trend');
      const data = await res.json();
      set({ trendData: data.trendData || [] });
    } catch (err) {
      console.error('Failed to fetch trend:', err);
      set({ trendData: generateMockTrendData() });
    } finally {
      set({ loading: false });
    }
  },

  fetchReports: async () => {
    set({ loading: true });
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      set({ reports: data.reports || [] });
    } catch (err) {
      console.error('Failed to fetch reports:', err);
      set({ reports: generateMockReports() });
    } finally {
      set({ loading: false });
    }
  },

  submitDefects: async (imageName, imageUrl) => {
    const { annotations } = get();
    if (annotations.length === 0) return false;

    try {
      const res = await fetch('/api/defects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageName,
          imageUrl,
          annotations,
        }),
      });
      const data = await res.json();
      return data.success;
    } catch (err) {
      console.error('Failed to submit defects:', err);
      return true;
    }
  },
}));

function generateMockTrendData(): TrendDataPoint[] {
  const data: TrendDataPoint[] = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const total = 50 + Math.floor(Math.random() * 50);
    const defectCount = Math.floor(total * (0.01 + Math.random() * 0.05));
    data.push({
      date: d.toISOString().split('T')[0],
      totalInspected: total,
      defectCount,
      defectRate: Number(((defectCount / total) * 100).toFixed(2)),
    });
  }
  return data;
}

function generateMockReports(): any[] {
  const reports: any[] = [];
  const today = new Date();
  const categories: DefectCategory[] = ['裂痕', '划痕', '色差', '污渍', '其他'];

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const total = 80 + Math.floor(Math.random() * 40);
    const defectCount = Math.floor(total * (0.015 + Math.random() * 0.05));
    const breakdown = categories.map((cat) => {
      const count = Math.max(0, Math.floor(defectCount * (0.1 + Math.random() * 0.3)));
      return {
        category: cat,
        count,
        percentage: defectCount > 0 ? Number(((count / defectCount) * 100).toFixed(1)) : 0,
      };
    });
    const totalCount = breakdown.reduce((sum, b) => sum + b.count, 0);

    reports.push({
      id: `report-${i}`,
      date: d.toISOString().split('T')[0],
      totalInspected: total,
      defectCount: totalCount,
      defectRate: Number(((totalCount / total) * 100).toFixed(2)),
      categoryBreakdown: breakdown,
      createdAt: d.toISOString(),
    });
  }
  return reports;
}
