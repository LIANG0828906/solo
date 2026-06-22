import type { GameState, Plant } from '@/types';
import { STORAGE_KEY, MAX_OFFLINE_SIMULATION_SEC, SAVE_THROTTLE_MS } from '@/config/constants';
import { useGameStore } from '@/store/useGameStore';
import { simulatePlantGrowth } from './PlantGrowth';
import { getEnvironmentSnapshot } from './Environment';

interface SaveData {
  version: number;
  timestamp: number;
  state: Partial<GameState>;
}

function serializeState(state: GameState): Partial<GameState> {
  return {
    plants: state.plants,
    irrigators: state.irrigators,
    seedInventory: state.seedInventory,
    totalHarvested: state.totalHarvested,
    unlockedSpecies: state.unlockedSpecies,
    currentWeather: state.currentWeather,
    weatherDuration: state.weatherDuration,
    weatherProgress: state.weatherProgress,
    dayNightCycle: state.dayNightCycle,
    brightness: state.brightness,
    colorTemp: state.colorTemp,
    soilMoisture: state.soilMoisture,
    autoIrrigationHintShown: state.autoIrrigationHintShown,
    lastTickTime: Date.now(),
  };
}

export function saveGame(force = false): void {
  const state = useGameStore.getState();
  const now = Date.now();
  if (!force && now - state.lastSaveTime < SAVE_THROTTLE_MS) return;

  try {
    const data: SaveData = {
      version: 1,
      timestamp: now,
      state: serializeState(state),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    useGameStore.getState().setLastSaveTime(now);
  } catch (e) {
    console.warn('Failed to save game state:', e);
  }
}

export function loadGame(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const data: SaveData = JSON.parse(raw);
    if (!data || data.version !== 1 || !data.state) return false;

    const offlineSec = Math.min((Date.now() - data.timestamp) / 1000, MAX_OFFLINE_SIMULATION_SEC * 2);
    const isDormant = offlineSec > MAX_OFFLINE_SIMULATION_SEC;
    const simulateSec = Math.min(offlineSec, MAX_OFFLINE_SIMULATION_SEC);

    const saved = data.state as Partial<GameState>;
    const plants: Plant[] = (saved.plants ?? []).map((p) => ({ ...p }));

    if (simulateSec > 0) {
      simulateOfflineGrowth(plants, simulateSec, isDormant);
    }

    useGameStore.getState().loadState({
      ...useGameStore.getState(),
      plants,
      irrigators: saved.irrigators ?? [],
      particles: [],
      seedInventory: saved.seedInventory ?? useGameStore.getState().seedInventory,
      totalHarvested: saved.totalHarvested ?? useGameStore.getState().totalHarvested,
      unlockedSpecies: saved.unlockedSpecies ?? useGameStore.getState().unlockedSpecies,
      currentWeather: saved.currentWeather ?? useGameStore.getState().currentWeather,
      weatherDuration: saved.weatherDuration ?? useGameStore.getState().weatherDuration,
      weatherProgress: saved.weatherProgress ?? 0,
      dayNightCycle: saved.dayNightCycle ?? 0.25,
      brightness: saved.brightness ?? useGameStore.getState().brightness,
      colorTemp: saved.colorTemp ?? useGameStore.getState().colorTemp,
      soilMoisture: saved.soilMoisture ?? useGameStore.getState().soilMoisture,
      selectedTool: 'none',
      screenShake: null,
      showAutoIrrigationHint: false,
      autoIrrigationHintShown: saved.autoIrrigationHintShown ?? false,
      pendingUnlock: null,
      lastSaveTime: Date.now(),
      lastTickTime: Date.now(),
      dirtyRects: [],
    });

    return true;
  } catch (e) {
    console.warn('Failed to load game state:', e);
    return false;
  }
}

function simulateOfflineGrowth(plants: Plant[], totalSec: number, makeDormant: boolean): void {
  const steps = Math.min(Math.ceil(totalSec), 120);
  const dt = totalSec / steps;
  const env = getEnvironmentSnapshot();

  for (let s = 0; s < steps; s++) {
    for (let i = 0; i < plants.length; i++) {
      if (plants[i].isDormant) continue;
      const updates = simulatePlantGrowth(plants[i], dt);
      plants[i] = { ...plants[i], ...updates };
    }
  }

  if (makeDormant) {
    for (let i = 0; i < plants.length; i++) {
      plants[i].isDormant = true;
    }
  }
}

export function clearSave(): void {
  localStorage.removeItem(STORAGE_KEY);
}
