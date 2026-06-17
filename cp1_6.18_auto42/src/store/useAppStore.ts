import { create } from 'zustand';
import { PathPoint } from '../modules/SampleApi';
import { ThemeType, SelectedPathInfo } from '../modules/ThreeRenderer';

interface AppState {
  paths: PathPoint[][];
  originalImage: HTMLCanvasElement | null;
  currentTheme: ThemeType;
  isLoading: boolean;
  selectedPath: SelectedPathInfo | null;
  error: string | null;
  
  setPaths: (paths: PathPoint[][], originalImage?: HTMLCanvasElement) => void;
  setTheme: (theme: ThemeType) => void;
  setLoading: (loading: boolean) => void;
  setSelectedPath: (path: SelectedPathInfo | null) => void;
  setError: (error: string | null) => void;
  clearSketch: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  paths: [],
  originalImage: null,
  currentTheme: 'neon',
  isLoading: false,
  selectedPath: null,
  error: null,
  
  setPaths: (paths, originalImage) => set({ paths, originalImage: originalImage || null }),
  setTheme: (theme) => set({ currentTheme: theme }),
  setLoading: (loading) => set({ isLoading: loading }),
  setSelectedPath: (path) => set({ selectedPath: path }),
  setError: (error) => set({ error }),
  clearSketch: () => set({ paths: [], originalImage: null, selectedPath: null })
}));
