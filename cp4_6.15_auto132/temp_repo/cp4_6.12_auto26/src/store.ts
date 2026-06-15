import { create } from 'zustand';

export interface Point {
  x: number;
  y: number;
}

export interface LinePath {
  points: Point[];
}

export interface PreprocessParams {
  brightness: number;
  contrast: number;
  blur: number;
}

export interface EdgeParams {
  lowThreshold: number;
  highThreshold: number;
  simplify: number;
}

export interface ExportSettings {
  strokeColor: string;
  strokeWidth: number;
}

export type ViewMode = 'original' | 'result' | 'overlay';

interface AppState {
  originalImage: HTMLImageElement | null;
  originalImageData: string | null;
  processedImageData: ImageData | null;
  edgesData: boolean[][] | null;
  simplifiedLines: LinePath[];
  preprocessParams: PreprocessParams;
  edgeParams: EdgeParams;
  exportSettings: ExportSettings;
  viewMode: ViewMode;
  isLoading: boolean;
  loadingType: 'upload' | 'extract' | 'export' | null;
  showSuccessToast: boolean;
  expandedModules: Record<string, boolean>;
  highlightedControl: string | null;
  setOriginalImage: (img: HTMLImageElement | null, dataUrl: string | null) => void;
  setProcessedImageData: (data: ImageData | null) => void;
  setEdgesData: (data: boolean[][] | null) => void;
  setSimplifiedLines: (lines: LinePath[]) => void;
  updatePreprocessParam: (key: keyof PreprocessParams, value: number) => void;
  updateEdgeParam: (key: keyof EdgeParams, value: number) => void;
  updateExportSetting: (key: keyof ExportSettings, value: string | number) => void;
  setViewMode: (mode: ViewMode) => void;
  setLoading: (loading: boolean, type?: 'upload' | 'extract' | 'export' | null) => void;
  setShowSuccessToast: (show: boolean) => void;
  toggleModule: (moduleName: string) => void;
  setHighlightedControl: (key: string | null) => void;
  resetState: () => void;
}

const defaultPreprocessParams: PreprocessParams = {
  brightness: 50,
  contrast: 50,
  blur: 0,
};

const defaultEdgeParams: EdgeParams = {
  lowThreshold: 3,
  highThreshold: 7,
  simplify: 3,
};

const defaultExportSettings: ExportSettings = {
  strokeColor: '#1A1A1A',
  strokeWidth: 2,
};

export const useAppStore = create<AppState>((set) => ({
  originalImage: null,
  originalImageData: null,
  processedImageData: null,
  edgesData: null,
  simplifiedLines: [],
  preprocessParams: defaultPreprocessParams,
  edgeParams: defaultEdgeParams,
  exportSettings: defaultExportSettings,
  viewMode: 'overlay',
  isLoading: false,
  loadingType: null,
  showSuccessToast: false,
  expandedModules: {
    upload: true,
    preprocess: true,
    edge: true,
    export: true,
  },
  highlightedControl: null,

  setOriginalImage: (img, dataUrl) =>
    set({ originalImage: img, originalImageData: dataUrl }),

  setProcessedImageData: (data) => set({ processedImageData: data }),

  setEdgesData: (data) => set({ edgesData: data }),

  setSimplifiedLines: (lines) => set({ simplifiedLines: lines }),

  updatePreprocessParam: (key, value) =>
    set((state) => ({
      preprocessParams: { ...state.preprocessParams, [key]: value },
    })),

  updateEdgeParam: (key, value) =>
    set((state) => ({
      edgeParams: { ...state.edgeParams, [key]: value },
    })),

  updateExportSetting: (key, value) =>
    set((state) => ({
      exportSettings: { ...state.exportSettings, [key]: value },
    })),

  setViewMode: (mode) => set({ viewMode: mode }),