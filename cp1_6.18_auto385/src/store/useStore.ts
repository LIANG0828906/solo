import { create } from 'zustand';

export type MaterialType = 'matte' | 'metal' | 'glass';

interface AppState {
  imageData: ImageData | null;
  imageWidth: number;
  imageHeight: number;
  depthMap: number[] | null;
  depthWidth: number;
  depthHeight: number;
  bumpStrength: number;
  lightX: number;
  lightY: number;
  material: MaterialType;
  fps: number;
  isProcessing: boolean;
  processingProgress: number;
  setImageData: (data: ImageData | null, w: number, h: number) => void;
  setDepthMap: (map: number[] | null, w: number, h: number) => void;
  setBumpStrength: (v: number) => void;
  setLightX: (v: number) => void;
  setLightY: (v: number) => void;
  setMaterial: (m: MaterialType) => void;
  setFps: (f: number) => void;
  setProcessing: (processing: boolean, progress?: number) => void;
  resetAll: () => void;
}

const DEFAULT_BUMP = 1.0;
const DEFAULT_LIGHT_X = 0.5;
const DEFAULT_LIGHT_Y = 0.8;
const DEFAULT_MATERIAL: MaterialType = 'matte';

export const useStore = create<AppState>((set) => ({
  imageData: null,
  imageWidth: 0,
  imageHeight: 0,
  depthMap: null,
  depthWidth: 0,
  depthHeight: 0,
  bumpStrength: DEFAULT_BUMP,
  lightX: DEFAULT_LIGHT_X,
  lightY: DEFAULT_LIGHT_Y,
  material: DEFAULT_MATERIAL,
  fps: 0,
  isProcessing: false,
  processingProgress: 0,
  setImageData: (data, w, h) => set({ imageData: data, imageWidth: w, imageHeight: h }),
  setDepthMap: (map, w, h) => set({ depthMap: map, depthWidth: w, depthHeight: h }),
  setBumpStrength: (v) => set({ bumpStrength: v }),
  setLightX: (v) => set({ lightX: v }),
  setLightY: (v) => set({ lightY: v }),
  setMaterial: (m) => set({ material: m }),
  setFps: (f) => set({ fps: f }),
  setProcessing: (processing, progress) =>
    set((s) => ({
      isProcessing: processing,
      processingProgress: progress !== undefined ? progress : s.processingProgress,
    })),
  resetAll: () =>
    set({
      bumpStrength: DEFAULT_BUMP,
      lightX: DEFAULT_LIGHT_X,
      lightY: DEFAULT_LIGHT_Y,
      material: DEFAULT_MATERIAL,
    }),
}));
