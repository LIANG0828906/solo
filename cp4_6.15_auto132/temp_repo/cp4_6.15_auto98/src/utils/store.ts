import { create } from 'zustand';

export interface SelectedPoint {
  lat: number;
  lon: number;
  intensity: number;
  inclination: number;
  x: number;
  y: number;
  z: number;
}

interface AppState {
  intensityScale: number;
  showHeatmap: boolean;
  showArrowGrid: boolean;
  panelCollapsed: boolean;
  selectedPoint: SelectedPoint | null;
  showFieldLines: boolean;
  reversalActive: boolean;

  setIntensityScale: (value: number) => void;
  setShowHeatmap: (value: boolean) => void;
  setShowArrowGrid: (value: boolean) => void;
  setPanelCollapsed: (value: boolean) => void;
  setSelectedPoint: (point: SelectedPoint | null) => void;
  setShowFieldLines: (value: boolean) => void;
  setReversalActive: (value: boolean) => void;
  togglePanel: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  intensityScale: 1.0,
  showHeatmap: false,
  showArrowGrid: false,
  panelCollapsed: false,
  selectedPoint: null,
  showFieldLines: true,
  reversalActive: false,

  setIntensityScale: (value: number) => set({ intensityScale: value }),
  setShowHeatmap: (value: boolean) => set({ showHeatmap: value }),
  setShowArrowGrid: (value: boolean) => set({ showArrowGrid: value }),
  setPanelCollapsed: (value: boolean) => set({ panelCollapsed: value }),
  setSelectedPoint: (point: SelectedPoint | null) => set({ selectedPoint: point }),
  setShowFieldLines: (value: boolean) => set({ showFieldLines: value }),
  setReversalActive: (value: boolean) => set({ reversalActive: value }),
  togglePanel: () => set((state) => ({ panelCollapsed: !state.panelCollapsed })),
}));
