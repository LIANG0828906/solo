import { create } from 'zustand';
import { DEFAULT_ENVIRONMENT, DEFAULT_PLANT_ID } from './PlantData';

interface PlantState {
  selectedPlantId: string;
  light: number;
  water: number;
  temperature: number;
  growthStage: number;
  isSimulating: boolean;
  plantTransitionKey: number;
  showStageLabel: boolean;
  currentStageName: string;

  setSelectedPlant: (id: string) => void;
  setLight: (value: number) => void;
  setWater: (value: number) => void;
  setTemperature: (value: number) => void;
  setGrowthStage: (value: number) => void;
  setIsSimulating: (value: boolean) => void;
  setShowStageLabel: (value: boolean) => void;
  setCurrentStageName: (value: string) => void;
  startGrowthSimulation: () => void;
  resetEnvironment: () => void;
  resetGrowth: () => void;
}

export const usePlantStore = create<PlantState>((set, get) => ({
  selectedPlantId: DEFAULT_PLANT_ID,
  light: DEFAULT_ENVIRONMENT.light,
  water: DEFAULT_ENVIRONMENT.water,
  temperature: DEFAULT_ENVIRONMENT.temperature,
  growthStage: 1,
  isSimulating: false,
  plantTransitionKey: 0,
  showStageLabel: false,
  currentStageName: '成熟期',

  setSelectedPlant: (id: string) => {
    set({ selectedPlantId: id, plantTransitionKey: get().plantTransitionKey + 1 });
  },
  setLight: (value: number) => set({ light: Math.max(0, Math.min(100, value)) }),
  setWater: (value: number) => set({ water: Math.max(0, Math.min(100, value)) }),
  setTemperature: (value: number) => set({ temperature: Math.max(10, Math.min(40, value)) }),
  setGrowthStage: (value: number) => set({ growthStage: Math.max(0, Math.min(1, value)) }),
  setIsSimulating: (value: boolean) => set({ isSimulating: value }),
  setShowStageLabel: (value: boolean) => set({ showStageLabel: value }),
  setCurrentStageName: (value: string) => set({ currentStageName: value }),

  startGrowthSimulation: () => {
    if (get().isSimulating) return;
    set({ isSimulating: true, growthStage: 0, showStageLabel: false });
  },

  resetEnvironment: () => {
    set({
      light: DEFAULT_ENVIRONMENT.light,
      water: DEFAULT_ENVIRONMENT.water,
      temperature: DEFAULT_ENVIRONMENT.temperature,
    });
  },

  resetGrowth: () => {
    set({
      growthStage: 1,
      isSimulating: false,
      showStageLabel: false,
      currentStageName: '成熟期',
    });
  },
}));
