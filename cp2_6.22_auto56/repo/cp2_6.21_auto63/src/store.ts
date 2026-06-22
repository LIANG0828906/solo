import { create } from 'zustand';
import {
  GardenState,
  GardenGrid,
  Plant,
  PlantType,
  EnvironmentParams,
  SoilType,
  PLANT_PARAMS,
  FlowerParticle,
} from './types';
import {
  calcGrowth,
  getGrowthStage,
  createPlant,
  createFlowerParticles,
  updateParticle,
  isParticleAlive,
  validateGardenData,
} from './gameLogic';

const GRID_WIDTH = 10;
const GRID_HEIGHT = 10;

function createEmptyGrid(): GardenGrid {
  const cells: (Plant | null)[][] = [];
  for (let y = 0; y < GRID_HEIGHT; y++) {
    const row: (Plant | null)[] = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
      row.push(null);
    }
    cells.push(row);
  }
  return { width: GRID_WIDTH, height: GRID_HEIGHT, cells };
}

interface GardenStore extends GardenState {
  plantSeed: (type: PlantType, x: number, y: number) => { success: boolean; message?: string };
  isCellOccupied: (x: number, y: number) => boolean;
  setLight: (intensity: number) => void;
  addWater: (amount: number) => void;
  setSoil: (soilType: SoilType) => void;
  nextTurn: () => void;
  selectPlant: (plantId: string | null) => void;
  saveGarden: () => string;
  loadGarden: (jsonString: string) => { success: boolean; error?: string };
  updateParticles: () => void;
  setTransitioning: (value: boolean) => void;
}

export const useGardenStore = create<GardenStore>((set, get) => ({
  grid: createEmptyGrid(),
  environment: {
    lightIntensity: 50,
    waterAmount: 1,
    soilType: 'loam',
  },
  turnCount: 0,
  isTransitioning: false,
  selectedPlantId: null,
  flowerParticles: [],

  isCellOccupied: (x: number, y: number) => {
    const { grid } = get();
    if (x < 0 || x >= grid.width || y < 0 || y >= grid.height) return false;
    return grid.cells[y][x] !== null;
  },

  plantSeed: (type: PlantType, x: number, y: number) => {
    const { grid } = get();
    if (x < 0 || x >= grid.width || y < 0 || y >= grid.height) {
      return { success: false, message: '位置超出花园范围' };
    }
    if (grid.cells[y][x] !== null) {
      return { success: false, message: '该位置已有植物' };
    }

    const newPlant = createPlant(type, x, y);
    set((state) => {
      const newCells = state.grid.cells.map((row) => [...row]);
      newCells[y][x] = newPlant;
      return {
        grid: { ...state.grid, cells: newCells },
      };
    });
    return { success: true };
  },

  setLight: (intensity: number) => {
    set((state) => ({
      environment: { ...state.environment, lightIntensity: Math.max(0, Math.min(100, intensity)) },
    }));
  },

  addWater: (amount: number) => {
    set((state) => ({
      environment: {
        ...state.environment,
        waterAmount: Math.max(0, Math.min(5, state.environment.waterAmount + amount)),
      },
    }));
  },

  setSoil: (soilType: SoilType) => {
    set((state) => ({
      environment: { ...state.environment, soilType },
    }));
  },

  nextTurn: () => {
    const { grid, environment } = get();
    const newCells: (Plant | null)[][] = [];
    const newParticles: FlowerParticle[] = [...get().flowerParticles];

    for (let y = 0; y < grid.height; y++) {
      const row: (Plant | null)[] = [];
      for (let x = 0; x < grid.width; x++) {
        const plant = grid.cells[y][x];
        if (plant) {
          const plantParams = PLANT_PARAMS[plant.type];
          const { newProgress, healthDelta } = calcGrowth(
            plantParams,
            environment,
            plant.growthProgress
          );
          const newStage = getGrowthStage(newProgress, plantParams);
          const newHealth = Math.max(0, Math.min(1, plant.health + healthDelta));

          const wasFlowering = plant.stage === 'flowering' || plant.stage === 'fruiting';
          const isNowFlowering = newStage === 'flowering' || newStage === 'fruiting';
          let hasTriggered = plant.hasTriggeredFlowerParticles;

          if (isNowFlowering && !wasFlowering && !hasTriggered) {
            const cellSize = 50;
            const plantPixelX = x * cellSize + cellSize / 2;
            const plantPixelY = y * cellSize + cellSize / 2;
            const particles = createFlowerParticles(
              plantPixelX,
              plantPixelY,
              plantParams.petalColor
            );
            newParticles.push(...particles);
            hasTriggered = true;
          }

          row.push({
            ...plant,
            growthProgress: newProgress,
            stage: newStage,
            health: newHealth,
            hasTriggeredFlowerParticles: hasTriggered,
          });
        } else {
          row.push(null);
        }
      }
      newCells.push(row);
    }

    set((state) => ({
      grid: { ...state.grid, cells: newCells },
      turnCount: state.turnCount + 1,
      isTransitioning: true,
      flowerParticles: newParticles,
      environment: {
        ...state.environment,
        waterAmount: 0,
      },
    }));

    setTimeout(() => {
      set({ isTransitioning: false });
    }, 300);
  },

  selectPlant: (plantId: string | null) => {
    set({ selectedPlantId: plantId });
  },

  saveGarden: () => {
    const state = get();
    const saveData = {
      grid: state.grid,
      environment: state.environment,
      turnCount: state.turnCount,
      version: '1.0',
      savedAt: new Date().toISOString(),
    };
    return JSON.stringify(saveData, null, 2);
  },

  loadGarden: (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      const validation = validateGardenData(data);
      if (!validation.valid) {
        return { success: false, error: validation.error || '数据格式错误' };
      }

      set({
        grid: data.grid,
        environment: data.environment,
        turnCount: data.turnCount,
        selectedPlantId: null,
        flowerParticles: [],
      });
      return { success: true };
    } catch (e) {
      return { success: false, error: 'JSON 解析失败' };
    }
  },

  updateParticles: () => {
    set((state) => ({
      flowerParticles: state.flowerParticles
        .map((p) => updateParticle(p))
        .filter(isParticleAlive),
    }));
  },

  setTransitioning: (value: boolean) => {
    set({ isTransitioning: value });
  },
}));
