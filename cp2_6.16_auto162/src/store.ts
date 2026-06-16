import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  Annotation,
  AppStatus,
  ExportParams,
  FrameData,
  RectangleAnnotation,
  ArrowAnnotation,
  TextAnnotation,
  ToolType,
} from '@/utils/types';

interface AnnotationSnapshot {
  annotations: Record<number, Annotation[]>;
}

interface AppState {
  videoFile: File | null;
  videoUrl: string | null;
  frames: FrameData[];
  currentFrameIndex: number;
  annotations: Record<number, Annotation[]>;
  selectedAnnotationId: string | null;
  focusedAnnotationId: string | null;
  appStatus: AppStatus;
  toolColor: string;
  lineWidth: number;
  activeTool: ToolType;
  history: AnnotationSnapshot[];
  historyIndex: number;
  exportProgress: number;
  showExportModal: boolean;
  sidebarOpen: boolean;

  setVideoFile: (file: File | null, url: string | null) => void;
  setFrames: (frames: FrameData[]) => void;
  setCurrentFrameIndex: (index: number) => void;
  setAppStatus: (status: AppStatus) => void;
  setToolColor: (color: string) => void;
  setLineWidth: (width: number) => void;
  setActiveTool: (tool: ToolType) => void;
  setExportProgress: (progress: number) => void;
  setShowExportModal: (show: boolean) => void;
  setSidebarOpen: (open: boolean) => void;

  addAnnotation: (annotation: Omit<Annotation, 'id' | 'createdAt'>) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  deleteAnnotation: (id: string) => void;
  selectAnnotation: (id: string | null) => void;
  focusAnnotation: (id: string | null) => void;
  getCurrentAnnotations: () => Annotation[];

  saveHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  reset: () => void;
  exportVideo: (params: ExportParams) => Promise<void>;
}

const initialState = {
  videoFile: null,
  videoUrl: null,
  frames: [],
  currentFrameIndex: 0,
  annotations: {},
  selectedAnnotationId: null,
  focusedAnnotationId: null,
  appStatus: 'idle' as AppStatus,
  toolColor: '#FF5252',
  lineWidth: 3,
  activeTool: 'select' as ToolType,
  history: [{ annotations: {} }],
  historyIndex: 0,
  exportProgress: 0,
  showExportModal: false,
  sidebarOpen: true,
};

export const useAppStore = create<AppState>((set, get) => ({
  ...initialState,

  setVideoFile: (file, url) => set({ videoFile: file, videoUrl: url }),
  setFrames: (frames) => set({ frames }),
  setCurrentFrameIndex: (index) => {
    const clamped = Math.max(0, Math.min(index, get().frames.length - 1));
    set({ currentFrameIndex: clamped, selectedAnnotationId: null });
  },
  setAppStatus: (status) => set({ appStatus: status }),
  setToolColor: (color) => set({ toolColor: color }),
  setLineWidth: (width) => set({ lineWidth: Math.max(1, Math.min(20, width)) }),
  setActiveTool: (tool) => set({ activeTool: tool, selectedAnnotationId: null }),
  setExportProgress: (progress) => set({ exportProgress: progress }),
  setShowExportModal: (show) => set({ showExportModal: show }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  addAnnotation: (annotation) => {
    const state = get();
    const frameIdx = state.currentFrameIndex;
    const newAnnotation: Annotation = {
      ...annotation,
      id: uuidv4(),
      createdAt: Date.now(),
    } as Annotation;

    const frameAnnotations = state.annotations[frameIdx] || [];
    const newAnnotations = {
      ...state.annotations,
      [frameIdx]: [...frameAnnotations, newAnnotation],
    };

    set({
      annotations: newAnnotations,
      selectedAnnotationId: newAnnotation.id,
    });
    get().saveHistory();
  },

  updateAnnotation: (id, updates) => {
    const state = get();
    const frameIdx = state.currentFrameIndex;
    const frameAnnotations = state.annotations[frameIdx] || [];

    const updatedAnnotations = frameAnnotations.map((a) =>
      a.id === id ? ({ ...a, ...updates } as Annotation) : a,
    );

    set({
      annotations: {
        ...state.annotations,
        [frameIdx]: updatedAnnotations,
      },
    });
  },

  deleteAnnotation: (id) => {
    const state = get();
    const frameIdx = state.currentFrameIndex;
    const frameAnnotations = state.annotations[frameIdx] || [];

    set({
      annotations: {
        ...state.annotations,
        [frameIdx]: frameAnnotations.filter((a) => a.id !== id),
      },
      selectedAnnotationId: state.selectedAnnotationId === id ? null : state.selectedAnnotationId,
    });
    get().saveHistory();
  },

  selectAnnotation: (id) => set({ selectedAnnotationId: id }),

  focusAnnotation: (id) => {
    set({ focusedAnnotationId: id, selectedAnnotationId: id });
    if (id) {
      setTimeout(() => set({ focusedAnnotationId: null }), 800);
    }
  },

  getCurrentAnnotations: () => {
    const state = get();
    return state.annotations[state.currentFrameIndex] || [];
  },

  saveHistory: () => {
    const state = get();
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push({ annotations: JSON.parse(JSON.stringify(state.annotations)) });
    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  undo: () => {
    const state = get();
    if (state.historyIndex > 0) {
      const newIndex = state.historyIndex - 1;
      set({
        annotations: JSON.parse(JSON.stringify(state.history[newIndex].annotations)),
        historyIndex: newIndex,
        selectedAnnotationId: null,
      });
    }
  },

  redo: () => {
    const state = get();
    if (state.historyIndex < state.history.length - 1) {
      const newIndex = state.historyIndex + 1;
      set({
        annotations: JSON.parse(JSON.stringify(state.history[newIndex].annotations)),
        historyIndex: newIndex,
        selectedAnnotationId: null,
      });
    }
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  reset: () => set({ ...initialState, history: [{ annotations: {} }] }),

  exportVideo: async () => {
    set({ appStatus: 'exporting' });
  },
}));

export type { RectangleAnnotation, ArrowAnnotation, TextAnnotation };
