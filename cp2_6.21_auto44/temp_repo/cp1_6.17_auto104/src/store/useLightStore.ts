import { create } from 'zustand';

export interface LightSource {
  intensity: number;
  colorTemp: number;
  direction: number;
}

interface LightState {
  building: LightSource;
  advertisement: LightSource;
  streetLamp: LightSource;
  particleCount: number;
  setBuildingLight: (params: Partial<LightSource>) => void;
  setAdvertisementLight: (params: Partial<LightSource>) => void;
  setStreetLampLight: (params: Partial<LightSource>) => void;
  setParticleCount: (count: number) => void;
}

export const useLightStore = create<LightState>((set) => ({
  building: { intensity: 1.0, colorTemp: 4500, direction: 0 },
  advertisement: { intensity: 1.2, colorTemp: 6500, direction: 180 },
  streetLamp: { intensity: 0.8, colorTemp: 2700, direction: 90 },
  particleCount: 0,

  setBuildingLight: (params) =>
    set((state) => ({ building: { ...state.building, ...params } })),

  setAdvertisementLight: (params) =>
    set((state) => ({ advertisement: { ...state.advertisement, ...params } })),

  setStreetLampLight: (params) =>
    set((state) => ({ streetLamp: { ...state.streetLamp, ...params } })),

  setParticleCount: (count) => set({ particleCount: count }),
}));
