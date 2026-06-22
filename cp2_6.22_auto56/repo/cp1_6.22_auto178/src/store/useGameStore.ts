import { create } from 'zustand';
import type { GameState, Plant, AutoIrrigator, Particle, PlantSpecies, WeatherType, SelectedTool, ScreenShake } from '@/types';
import { randRange } from '@/utils/random';
import { WEATHER_CONFIG, DAY_DURATION_SEC, DAY_BRIGHTNESS, DAY_COLOR_TEMP } from '@/config/constants';

function createInitialState(): GameState {
  const now = Date.now();
  const initialWeather: WeatherType = 'sunny';
  const weatherCfg = WEATHER_CONFIG[initialWeather];

  return {
    plants: [],
    irrigators: [],
    particles: [],
    seedInventory: { sunflower: 5, cactus: 0, dandelion: 0 },
    totalHarvested: { sunflower: 0, cactus: 0, dandelion: 0 },
    unlockedSpecies: ['sunflower'],
    currentWeather: initialWeather,
    weatherDuration: randRange(weatherCfg.duration[0], weatherCfg.duration[1]),
    weatherProgress: 0,
    dayNightCycle: 0.25,
    brightness: DAY_BRIGHTNESS,
    colorTemp: { ...DAY_COLOR_TEMP },
    soilMoisture: 70,
    selectedTool: 'none',
    screenShake: null,
    showAutoIrrigationHint: false,
    autoIrrigationHintShown: false,
    pendingUnlock: null,
    lastSaveTime: now,
    lastTickTime: now,
    dirtyRects: [],
  };
}

interface GameActions {
  setState: (patch: Partial<GameState>) => void;
  addPlant: (plant: Plant) => void;
  updatePlant: (id: string, patch: Partial<Plant>) => void;
  removePlant: (id: string) => void;
  replaceAllPlants: (plants: Plant[]) => void;
  addIrrigator: (irrigator: AutoIrrigator) => void;
  removeIrrigator: (id: string) => void;
  replaceAllIrrigators: (irrigators: AutoIrrigator[]) => void;
  addParticle: (particle: Particle) => void;
  addParticles: (particles: Particle[]) => void;
  replaceAllParticles: (particles: Particle[]) => void;
  setSelectedTool: (tool: SelectedTool) => void;
  updateSeedInventory: (species: PlantSpecies, delta: number) => void;
  setSeedInventory: (inv: Record<PlantSpecies, number>) => void;
  incrementTotalHarvested: (species: PlantSpecies, amount: number) => void;
  setTotalHarvested: (tot: Record<PlantSpecies, number>) => void;
  unlockSpecies: (species: PlantSpecies) => void;
  setUnlockedSpecies: (species: PlantSpecies[]) => void;
  setWeather: (weather: WeatherType, duration: number, progress?: number) => void;
  setDayNight: (cycle: number, brightness: number, colorTemp: { r: number; g: number; b: number }) => void;
  setSoilMoisture: (value: number) => void;
  setPendingUnlock: (species: PlantSpecies | null) => void;
  triggerScreenShake: (intensity: number, duration: number) => void;
  clearScreenShake: () => void;
  setShowAutoIrrigationHint: (show: boolean) => void;
  markAutoIrrigationHintShown: () => void;
  addDirtyRect: (rect: { x: number; y: number; w: number; h: number }) => void;
  clearDirtyRects: () => void;
  setLastTickTime: (time: number) => void;
  setLastSaveTime: (time: number) => void;
  resetAll: () => void;
  loadState: (state: GameState) => void;
}

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...createInitialState(),

  setState: (patch) => set(patch),

  addPlant: (plant) => set((s) => ({ plants: [...s.plants, plant] })),

  updatePlant: (id, patch) =>
    set((s) => ({
      plants: s.plants.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    })),

  removePlant: (id) => set((s) => ({ plants: s.plants.filter((p) => p.id !== id) })),

  replaceAllPlants: (plants) => set({ plants }),

  addIrrigator: (irrigator) => set((s) => ({ irrigators: [...s.irrigators, irrigator] })),

  removeIrrigator: (id) => set((s) => ({ irrigators: s.irrigators.filter((i) => i.id !== id) })),

  replaceAllIrrigators: (irrigators) => set({ irrigators }),

  addParticle: (particle) => set((s) => ({ particles: [...s.particles, particle] })),

  addParticles: (particles) => set((s) => ({ particles: [...s.particles, ...particles] })),

  replaceAllParticles: (particles) => set({ particles }),

  setSelectedTool: (tool) => set({ selectedTool: tool }),

  updateSeedInventory: (species, delta) =>
    set((s) => ({
      seedInventory: {
        ...s.seedInventory,
        [species]: Math.max(0, s.seedInventory[species] + delta),
      },
    })),

  setSeedInventory: (inv) => set({ seedInventory: inv }),

  incrementTotalHarvested: (species, amount) =>
    set((s) => ({
      totalHarvested: {
        ...s.totalHarvested,
        [species]: s.totalHarvested[species] + amount,
      },
    })),

  setTotalHarvested: (tot) => set({ totalHarvested: tot }),

  unlockSpecies: (species) =>
    set((s) => ({
      unlockedSpecies: s.unlockedSpecies.includes(species) ? s.unlockedSpecies : [...s.unlockedSpecies, species],
    })),

  setUnlockedSpecies: (species) => set({ unlockedSpecies: species }),

  setWeather: (weather, duration, progress = 0) =>
    set({ currentWeather: weather, weatherDuration: duration, weatherProgress: progress }),

  setDayNight: (cycle, brightness, colorTemp) =>
    set({ dayNightCycle: cycle, brightness, colorTemp }),

  setSoilMoisture: (value) => set({ soilMoisture: Math.max(0, Math.min(100, value)) }),

  setPendingUnlock: (species) => set({ pendingUnlock: species }),

  triggerScreenShake: (intensity, duration) =>
    set({
      screenShake: {
        intensity,
        duration,
        startTime: Date.now(),
      },
    }),

  clearScreenShake: () => set({ screenShake: null }),

  setShowAutoIrrigationHint: (show) => set({ showAutoIrrigationHint: show }),

  markAutoIrrigationHintShown: () => set({ autoIrrigationHintShown: true }),

  addDirtyRect: (rect) =>
    set((s) => ({
      dirtyRects: [...s.dirtyRects, rect],
    })),

  clearDirtyRects: () => set({ dirtyRects: [] }),

  setLastTickTime: (time) => set({ lastTickTime: time }),

  setLastSaveTime: (time) => set({ lastSaveTime: time }),

  resetAll: () => set(createInitialState()),

  loadState: (state) => set(state),
}));

export const _unused: typeof DAY_DURATION_SEC = DAY_DURATION_SEC;
