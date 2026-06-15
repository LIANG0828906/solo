import { create } from 'zustand';

export interface GrowthSnapshot {
  trunkLength: number;
  branchAngle: number;
  leafCount: number;
  leafSize: number;
  leafColorSat: number;
  leafColorLight: number;
  branchSpacing: number;
  trunkThickness: number;
  flowerSize: number;
}

export interface GrowthState {
  light: number;
  water: number;
  temperature: number;
  growthProgress: number;
  isGrowing: boolean;
  isPaused: boolean;
  seed: number;
  snapshot: GrowthSnapshot;

  setLight: (v: number) => void;
  setWater: (v: number) => void;
  setTemperature: (v: number) => void;
  setGrowthProgress: (v: number) => void;
  startGrowing: () => void;
  pauseGrowing: () => void;
  resumeGrowing: () => void;
  resetGrowing: () => void;
  randomSeed: () => void;
  reset: () => void;
  computeSnapshot: () => GrowthSnapshot;
}

function computeFromParams(light: number, water: number, temperature: number): GrowthSnapshot {
  const l = light / 100;
  const w = water / 100;
  const t = temperature / 100;

  const trunkThickness = 0.03 + l * 0.04;
  const trunkLength = 0.8 + w * 0.6 + t * 0.2;
  const branchAngle = 0.3 + (1 - l) * 0.4 + (1 - t) * 0.15;
  const branchSpacing = 0.25 + t * 0.35;
  const leafCount = Math.round(2 + w * 4 + l * 2);
  const leafSize = 0.12 + w * 0.1 - l * 0.04;
  const leafColorSat = 0.3 + w * 0.6;
  const leafColorLight = 0.25 + l * 0.35;
  const flowerSize = 0.04 + l * 0.04 + w * 0.03;

  return {
    trunkLength,
    branchAngle,
    leafCount: Math.max(1, leafCount),
    leafSize: Math.max(0.05, leafSize),
    leafColorSat: Math.min(1, Math.max(0, leafColorSat)),
    leafColorLight: Math.min(0.65, Math.max(0.15, leafColorLight)),
    branchSpacing,
    trunkThickness,
    flowerSize,
  };
}

export const useGrowthStore = create<GrowthState>((set, get) => ({
  light: 50,
  water: 50,
  temperature: 50,
  growthProgress: 0,
  isGrowing: false,
  isPaused: false,
  seed: 42,
  snapshot: computeFromParams(50, 50, 50),

  setLight: (v) => {
    const snap = computeFromParams(v, get().water, get().temperature);
    set({ light: v, snapshot: snap });
  },
  setWater: (v) => {
    const snap = computeFromParams(get().light, v, get().temperature);
    set({ water: v, snapshot: snap });
  },
  setTemperature: (v) => {
    const snap = computeFromParams(get().light, get().water, v);
    set({ temperature: v, snapshot: snap });
  },
  setGrowthProgress: (v) => set({ growthProgress: v }),
  startGrowing: () => set({ isGrowing: true, isPaused: false, growthProgress: 0 }),
  pauseGrowing: () => set({ isPaused: true }),
  resumeGrowing: () => set({ isPaused: false }),
  resetGrowing: () => set({ isGrowing: false, isPaused: false, growthProgress: 0 }),
  randomSeed: () => {
    const newLight = Math.round(20 + Math.random() * 60);
    const newWater = Math.round(20 + Math.random() * 60);
    const newTemp = Math.round(20 + Math.random() * 60);
    const snap = computeFromParams(newLight, newWater, newTemp);
    set({
      light: newLight,
      water: newWater,
      temperature: newTemp,
      seed: Math.round(Math.random() * 10000),
      snapshot: snap,
      isGrowing: false,
      isPaused: false,
      growthProgress: 0,
    });
  },
  reset: () => {
    const snap = computeFromParams(50, 50, 50);
    set({
      light: 50,
      water: 50,
      temperature: 50,
      seed: 42,
      snapshot: snap,
      isGrowing: false,
      isPaused: false,
      growthProgress: 0,
    });
  },
  computeSnapshot: () => {
    const { light, water, temperature } = get();
    return computeFromParams(light, water, temperature);
  },
}));
