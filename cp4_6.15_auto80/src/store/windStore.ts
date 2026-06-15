import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface WindTurbineData {
  id: string;
  index: number;
  position: { x: number; z: number };
  windSpeed: number;
  powerOutput: number;
  healthStatus: 'healthy' | 'faulty';
  rotationSpeed: number;
  targetRotationSpeed: number;
}

interface WindStore {
  turbines: WindTurbineData[];
  selectedTurbineId: string | null;
  animationTimestamp: number;
  totalPowerOutput: number;
  healthyCount: number;
  faultyCount: number;
  isWindFluctuation: boolean;
  selectTurbine: (id: string | null) => void;
  updateTurbines: (data: WindTurbineData[]) => void;
  setWindFluctuation: (active: boolean) => void;
  updateAnimationTimestamp: (ts: number) => void;
}

const ROWS = 5;
const COLS = 5;
const ROW_SPACING = 300;
const COL_SPACING = 250;

function generateInitialTurbines(): WindTurbineData[] {
  const turbines: WindTurbineData[] = [];
  let index = 0;
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const baseWindSpeed = 3 + Math.random() * 12;
      turbines.push({
        id: uuidv4(),
        index: index++,
        position: {
          x: (col - (COLS - 1) / 2) * COL_SPACING,
          z: (row - (ROWS - 1) / 2) * ROW_SPACING,
        },
        windSpeed: baseWindSpeed,
        powerOutput: Math.min(100, baseWindSpeed * 6),
        healthStatus: Math.random() > 0.15 ? 'healthy' : 'faulty',
        rotationSpeed: 0.5,
        targetRotationSpeed: 0.5,
      });
    }
  }
  return turbines;
}

export const useWindStore = create<WindStore>((set) => {
  const initialTurbines = generateInitialTurbines();
  return {
    turbines: initialTurbines,
    selectedTurbineId: null,
    animationTimestamp: 0,
    totalPowerOutput: initialTurbines.reduce((sum, t) => sum + t.powerOutput, 0),
    healthyCount: initialTurbines.filter((t) => t.healthStatus === 'healthy').length,
    faultyCount: initialTurbines.filter((t) => t.healthStatus === 'faulty').length,
    isWindFluctuation: false,
    selectTurbine: (id) => set({ selectedTurbineId: id }),
    updateTurbines: (data) =>
      set({
        turbines: data,
        totalPowerOutput: data.reduce((sum, t) => sum + t.powerOutput, 0),
        healthyCount: data.filter((t) => t.healthStatus === 'healthy').length,
        faultyCount: data.filter((t) => t.healthStatus === 'faulty').length,
      }),
    setWindFluctuation: (active) => set({ isWindFluctuation: active }),
    updateAnimationTimestamp: (ts) => set({ animationTimestamp: ts }),
  };
});
