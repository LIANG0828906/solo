import { create } from 'zustand';

export type PlantStage = 'seed' | 'sprouting' | 'stem' | 'branching' | 'flowering';

interface ControlState {
  lightIntensity: number;
  soilMoisture: number;
  temperature: number;
  growthProgress: number;
  plantStage: PlantStage;
  isGrowing: boolean;
  setLightIntensity: (v: number) => void;
  setSoilMoisture: (v: number) => void;
  setTemperature: (v: number) => void;
  setGrowthProgress: (v: number) => void;
  setPlantStage: (s: PlantStage) => void;
  startGrowing: () => void;
}

export const useControlStore = create<ControlState>((set) => ({
  lightIntensity: 50,
  soilMoisture: 50,
  temperature: 25,
  growthProgress: 0,
  plantStage: 'seed',
  isGrowing: false,
  setLightIntensity: (v) => set({ lightIntensity: v }),
  setSoilMoisture: (v) => set({ soilMoisture: v }),
  setTemperature: (v) => set({ temperature: v }),
  setGrowthProgress: (v) => set({ growthProgress: v }),
  setPlantStage: (s) => set({ plantStage: s }),
  startGrowing: () => set({ isGrowing: true, growthProgress: 0, plantStage: 'seed' }),
}));
