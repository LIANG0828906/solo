import { create } from 'zustand';

export type StyleType = 'lowpoly' | 'toon' | 'wireframe' | 'watercolor';

interface AppState {
  currentStyle: StyleType;
  detailIntensity: number;
  isLoading: boolean;
  modelLoaded: boolean;
  isExporting: boolean;
  isTransitioning: boolean;
  showFlash: boolean;
  showSaveMessage: boolean;
  uploadedFile: File | null;
  exportHandler: (() => void) | null;
  setStyle: (style: StyleType) => void;
  setDetailIntensity: (value: number) => void;
  setLoading: (loading: boolean) => void;
  setModelLoaded: (loaded: boolean) => void;
  setExporting: (exporting: boolean) => void;
  setTransitioning: (transitioning: boolean) => void;
  triggerFlash: () => void;
  triggerSaveMessage: () => void;
  setUploadedFile: (file: File | null) => void;
  setExportHandler: (handler: (() => void) | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentStyle: 'lowpoly',
  detailIntensity: 50,
  isLoading: false,
  modelLoaded: false,
  isExporting: false,
  isTransitioning: false,
  showFlash: false,
  showSaveMessage: false,
  uploadedFile: null,
  exportHandler: null,
  setStyle: (style) => set({ currentStyle: style, isTransitioning: true }),
  setDetailIntensity: (value) => set({ detailIntensity: value }),
  setLoading: (loading) => set({ isLoading: loading }),
  setModelLoaded: (loaded) => set({ modelLoaded: loaded }),
  setExporting: (exporting) => set({ isExporting: exporting }),
  setTransitioning: (transitioning) => set({ isTransitioning: transitioning }),
  triggerFlash: () => {
    set({ showFlash: true });
    setTimeout(() => set({ showFlash: false }), 200);
  },
  triggerSaveMessage: () => {
    set({ showSaveMessage: true });
    setTimeout(() => set({ showSaveMessage: false }), 2000);
  },
  setUploadedFile: (file) => set({ uploadedFile: file }),
  setExportHandler: (handler) => set({ exportHandler: handler }),
}));
