import { create } from 'zustand';
import type { AppState, ImageData, ClusterGroup } from './types';

export const useAppStore = create<AppState>((set) => ({
  images: [],
  clusters: [],
  threshold: 25,
  isProcessing: false,
  selectedCluster: null,
  fps: 60,

  resetCamera: () => {},

  setImages: (images: ImageData[]) => set({ images }),
  setClusters: (clusters: ClusterGroup[]) => set({ clusters }),
  setThreshold: (threshold: number) => set({ threshold }),
  setIsProcessing: (isProcessing: boolean) => set({ isProcessing }),
  setSelectedCluster: (selectedCluster: ClusterGroup | null) => set({ selectedCluster }),
  setFps: (fps: number) => set({ fps }),
  resetAll: () =>
    set({
      images: [],
      clusters: [],
      threshold: 25,
      selectedCluster: null,
    }),
}));
