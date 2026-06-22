import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface PlantData {
  id: string;
  position: { x: number; z: number };
  createdAt: number;
  initialHeight: number;
  targetHeight: number;
  currentHeight: number;
  leafCount: number;
  earParticleCount: number;
  earParticleScale: number;
}

export interface WindState {
  direction: number;
  strength: number;
  targetDirection: number;
  targetStrength: number;
}

interface AppStore {
  plants: PlantData[];
  wind: WindState;
  selectedPlantId: string | null;
  addPlant: (position: { x: number; z: number }) => void;
  updatePlant: (id: string, data: Partial<PlantData>) => void;
  setWind: (wind: Partial<WindState>) => void;
  selectPlant: (id: string | null) => void;
}

export const useStore = create<AppStore>((set) => ({
  plants: [],
  wind: {
    direction: 0,
    strength: 1,
    targetDirection: 0,
    targetStrength: 1,
  },
  selectedPlantId: null,
  addPlant: (position) => {
    const initialHeight = 0.6 + Math.random() * 0.4;
    const newPlant: PlantData = {
      id: uuidv4(),
      position,
      createdAt: Date.now(),
      initialHeight,
      targetHeight: initialHeight * 1.2,
      currentHeight: initialHeight,
      leafCount: 2,
      earParticleCount: 10,
      earParticleScale: 0.3,
    };
    set((state) => {
      if (state.plants.length >= 100) return state;
      return { plants: [...state.plants, newPlant] };
    });
  },
  updatePlant: (id, data) => {
    set((state) => ({
      plants: state.plants.map((p) =>
        p.id === id ? { ...p, ...data } : p
      ),
    }));
  },
  setWind: (wind) => {
    set((state) => ({
      wind: { ...state.wind, ...wind },
    }));
  },
  selectPlant: (id) => {
    set({ selectedPlantId: id });
  },
}));
