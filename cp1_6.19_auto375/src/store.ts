import { create } from 'zustand';

export interface ParticleClickData {
  x: number;
  y: number;
  z: number;
  r: number;
  g: number;
  b: number;
  radius: number;
  screenX: number;
  screenY: number;
}

interface ParticleState {
  morphology: number;
  turbulence: number;
  colorTemp: number;
  fps: number;
  particleCount: number;
  clickedParticle: ParticleClickData | null;
  setMorphology: (v: number) => void;
  setTurbulence: (v: number) => void;
  setColorTemp: (v: number) => void;
  setFps: (v: number) => void;
  setClickedParticle: (data: ParticleClickData | null) => void;
}

export const useParticleStore = create<ParticleState>((set) => ({
  morphology: 0,
  turbulence: 1,
  colorTemp: 0,
  fps: 60,
  particleCount: 8000,
  clickedParticle: null,
  setMorphology: (v: number) => set({ morphology: v }),
  setTurbulence: (v: number) => set({ turbulence: v }),
  setColorTemp: (v: number) => set({ colorTemp: v }),
  setFps: (v: number) => set({ fps: v }),
  setClickedParticle: (data: ParticleClickData | null) =>
    set({ clickedParticle: data }),
}));
