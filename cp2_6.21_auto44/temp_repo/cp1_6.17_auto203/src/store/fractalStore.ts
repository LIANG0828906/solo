import { create } from "zustand";

interface FractalState {
  layers: number;
  rotation: number;
  scale: number;
  colorStart: string;
  colorEnd: string;
  setLayers: (n: number) => void;
  setRotation: (n: number) => void;
  setScale: (n: number) => void;
  setColorStart: (c: string) => void;
  setColorEnd: (c: string) => void;
  reset: () => void;
}

const defaultState = {
  layers: 6,
  rotation: 0,
  scale: 0.8,
  colorStart: "#FF6B6B",
  colorEnd: "#4ECDC4",
};

export const useFractalStore = create<FractalState>((set) => ({
  ...defaultState,
  setLayers: (n) => set({ layers: n }),
  setRotation: (n) => set({ rotation: n }),
  setScale: (n) => set({ scale: n }),
  setColorStart: (c) => set({ colorStart: c }),
  setColorEnd: (c) => set({ colorEnd: c }),
  reset: () => set(defaultState),
}));
