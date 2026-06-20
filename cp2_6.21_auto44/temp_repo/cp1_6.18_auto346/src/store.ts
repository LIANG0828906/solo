import { create } from 'zustand';
import { WindVector, BuildingAttributes } from './types';
import { v4 as uuidv4 } from 'uuid';

interface CityStore {
  buildings: BuildingAttributes[];
  wind: WindVector;
  greenCount: number;
  averageSpeed: number;
  particleCount: number;

  setBuildings: (buildings: BuildingAttributes[]) => void;
  addBuilding: (building: BuildingAttributes) => boolean;
  removeBuilding: (id: string) => void;
  setWind: (wind: Partial<WindVector>) => void;
  setAverageSpeed: (speed: number) => void;
  setParticleCount: (count: number) => void;
}

export const useCityStore = create<CityStore>((set, get) => ({
  buildings: [],
  wind: { direction: 45, speed: 2 },
  greenCount: 0,
  averageSpeed: 0,
  particleCount: 200,

  setBuildings: (buildings) => set({ buildings }),

  addBuilding: (building) => {
    const state = get();
    if (building.type === 'green' && state.greenCount >= 5) return false;
    if (state.buildings.length >= 100) return false;
    const exists = state.buildings.some(
      (b) => b.gridX === building.gridX && b.gridZ === building.gridZ
    );
    if (exists) return false;
    set({
      buildings: [...state.buildings, building],
      greenCount:
        building.type === 'green' ? state.greenCount + 1 : state.greenCount,
    });
    return true;
  },

  removeBuilding: (id) => {
    const state = get();
    const building = state.buildings.find((b) => b.id === id);
    if (!building) return;
    set({
      buildings: state.buildings.filter((b) => b.id !== id),
      greenCount:
        building.type === 'green' ? state.greenCount - 1 : state.greenCount,
    });
  },

  setWind: (wind) =>
    set((state) => ({
      wind: { ...state.wind, ...wind },
    })),

  setAverageSpeed: (speed) => set({ averageSpeed: speed }),
  setParticleCount: (count) => set({ particleCount: count }),
}));
