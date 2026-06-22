import { create } from 'zustand';
import type { AppState, VisualizationMode, HoverInfo, DatasetResult } from './shared/types';

export const useAppStore = create<AppState>((set) => ({
  selectedDataset: null,
  visualizationMode: 'vector',
  altitudeLevel: 0.5,
  isLoading: false,
  hoverInfo: { speed: 0, direction: 0, pressure: 0, altitude: 0, screenX: 0, screenY: 0, visible: false },
  datasetResult: null,
  setSelectedDataset: (key: string | null) => set({ selectedDataset: key }),
  setVisualizationMode: (mode: VisualizationMode) => set({ visualizationMode: mode }),
  setAltitudeLevel: (level: number) => set({ altitudeLevel: level }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setHoverInfo: (info: HoverInfo) => set({ hoverInfo: info }),
  setDatasetResult: (result: DatasetResult | null) => set({ datasetResult: result }),
}));
