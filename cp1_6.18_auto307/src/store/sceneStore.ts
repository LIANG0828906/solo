import { create } from 'zustand';

export type GlowColorPreset = '#00BCD4' | '#FF4081' | '#FFB74D' | '#69F0AE' | '#B388FF';

export const GLOW_COLOR_PRESETS: GlowColorPreset[] = [
  '#00BCD4',
  '#FF4081',
  '#FFB74D',
  '#69F0AE',
  '#B388FF',
];

interface SceneState {
  density: number;
  glowColor: string;
  fps: number;
  particleDegraded: boolean;
  refreshKey: number;
  setDensity: (density: number) => void;
  setGlowColor: (color: string) => void;
  setFps: (fps: number) => void;
  setFPS: (fps: number) => void;
  setParticleDegraded: (degraded: boolean) => void;
  triggerRefresh: () => void;
}

export const useSceneStore = create<SceneState>((set) => ({
  density: 10,
  glowColor: '#00BCD4',
  fps: 60,
  particleDegraded: false,
  refreshKey: 0,
  setDensity: (density) => set({ density }),
  setGlowColor: (glowColor) => set({ glowColor }),
  setFps: (fps) => set({ fps }),
  setFPS: (fps) => set({ fps }),
  setParticleDegraded: (particleDegraded) => set({ particleDegraded }),
  triggerRefresh: () => set((state) => ({ refreshKey: state.refreshKey + 1 })),
}));
