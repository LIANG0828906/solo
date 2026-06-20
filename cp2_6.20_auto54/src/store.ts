import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  GridCell,
  Plant,
  PlantType,
  GrowthStage,
  ActionType,
  GrowthLogEntry,
  PLANT_CONFIGS,
  GROWTH_THRESHOLDS,
  FERTILIZE_COOLDOWN,
  GRID_SIZE,
  STAGE_LABELS
} from './types';
import { soundManager } from './utils/sound';

interface GardenState {
  grid: GridCell[][];
  selectedCell: { row: number; col: number } | null;
  showPlantPanel: boolean;
  expandedPlantId: string | null;
  fertilizeCooldowns: Record<string, number>;
  currentTime: number;

  initGrid: () => void;
  openPlantPanel: (row: number, col: number) => void;
  closePlantPanel: () => void;
  plantInCell: (row: number, col: number, plantType: PlantType) => void;
  removePlant: (row: number, col: number) => void;
  waterPlant: (plantId: string) => void;
  fertilizePlant: (plantId: string) => boolean;
  toggleExpandPlant: (plantId: string) => void;
  updateTime: () => void;
  getFertilizeCooldownRemaining: (plantId: string) => number;
  playSound: (type: 'click' | 'success' | 'fail') => void;
}

const calculateStage = (progress: number): GrowthStage => {
  if (progress >= GROWTH_THRESHOLDS[GrowthStage.MATURE]) return GrowthStage.MATURE;
  if (progress >= GROWTH_THRESHOLDS[GrowthStage.GROWING]) return GrowthStage.GROWING;
  return GrowthStage.SEEDLING;
};

const createEmptyGrid = (): GridCell[][] => {
  const grid: GridCell[][] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    const rowCells: GridCell[] = [];
    for (let col = 0; col < GRID_SIZE; col++) {
      rowCells.push({ row, col, plant: null });
    }
    grid.push(rowCells);
  }
  return grid;
};

const findCellByPlantId = (
  grid: GridCell[][],
  plantId: string
): { row: number; col: number } | null => {
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      if (grid[row][col].plant?.id === plantId) {
        return { row, col };
      }
    }
  }
  return null;
};

const getStageLabel = (stage: GrowthStage): string => STAGE_LABELS[stage];

export const useGardenStore = create<GardenState>((set, get) => ({
  grid: [],
  selectedCell: null,
  showPlantPanel: false,
  expandedPlantId: null,
  fertilizeCooldowns: {},
  currentTime: Date.now(),

  playSound: (type) => {
    soundManager.play(type);
  },

  initGrid: () => {
    set({ grid: createEmptyGrid() });
  },

  openPlantPanel: (row, col) => {
    set({ selectedCell: { row, col }, showPlantPanel: true });
  },

  closePlantPanel: () => {
    set({ selectedCell: null, showPlantPanel: false });
  },

  plantInCell: (row, col, plantType) => {
    const plantId = uuidv4();
    const now = Date.now();
    const initialProgress = 5;
    const logEntry: GrowthLogEntry = {
      id: uuidv4(),
      timestamp: now,
      action: ActionType.PLANT,
      description: `种植了${PLANT_CONFIGS[plantType].name}，初始成长值 ${initialProgress}%`,
      details: {
        oldProgress: 0,
        newProgress: initialProgress,
        boostValue: initialProgress,
        stageChanged: true,
        oldStage: GrowthStage.SEEDLING,
        newStage: GrowthStage.SEEDLING
      }
    };

    const newPlant: Plant = {
      id: plantId,
      type: plantType,
      stage: GrowthStage.SEEDLING,
      progress: initialProgress,
      plantedAt: now,
      lastWateredAt: null,
      lastFertilizedAt: null,
      isWatering: false,
      isFertilizing: false,
      logs: [logEntry]
    };

    set((state) => {
      const newGrid = state.grid.map((r, ri) =>
        r.map((c, ci) =>
          ri === row && ci === col ? { ...c, plant: newPlant } : c
        )
      );
      return {
        grid: newGrid,
        showPlantPanel: false,
        selectedCell: null
      };
    });
    soundManager.play('success');
  },

  removePlant: (row, col) => {
    set((state) => {
      const newGrid = state.grid.map((r, ri) =>
        r.map((c, ci) =>
          ri === row && ci === col ? { ...c, plant: null } : c
        )
      );
      return { grid: newGrid };
    });
  },

  waterPlant: (plantId) => {
    const state = get();
    const cellPos = findCellByPlantId(state.grid, plantId);
    if (!cellPos) return;

    const cell = state.grid[cellPos.row][cellPos.col];
    if (!cell.plant) return;
    if (cell.plant.progress >= 100) {
      soundManager.play('fail');
      return;
    }

    const config = PLANT_CONFIGS[cell.plant.type];
    const now = Date.now();
    const oldProgress = cell.plant.progress;
    const oldStage = cell.plant.stage;
    const newProgress = Math.min(100, oldProgress + config.waterBoost);
    const newStage = calculateStage(newProgress);
    const stageChanged = oldStage !== newStage;

    let description = `浇水：成长值 ${oldProgress}% → ${newProgress}%（+${config.waterBoost}%）`;
    if (stageChanged) {
      description += `，进入${getStageLabel(newStage)}`;
    }

    const logEntry: GrowthLogEntry = {
      id: uuidv4(),
      timestamp: now,
      action: ActionType.WATER,
      description,
      details: {
        oldProgress,
        newProgress,
        boostValue: config.waterBoost,
        stageChanged,
        oldStage,
        newStage
      }
    };

    set((state) => {
      const newGrid = state.grid.map((r, ri) =>
        r.map((c, ci) => {
          if (ri === cellPos.row && ci === cellPos.col && c.plant) {
            return {
              ...c,
              plant: {
                ...c.plant,
                progress: newProgress,
                stage: newStage,
                lastWateredAt: now,
                isWatering: true,
                logs: [logEntry, ...c.plant.logs]
              }
            };
          }
          return c;
        })
      );
      return { grid: newGrid };
    });

    soundManager.play('success');

    setTimeout(() => {
      set((state) => {
        const newGrid = state.grid.map((r, ri) =>
          r.map((c, ci) => {
            if (ri === cellPos.row && ci === cellPos.col && c.plant) {
              return { ...c, plant: { ...c.plant, isWatering: false } };
            }
            return c;
          })
        );
        return { grid: newGrid };
      });
    }, 800);
  },

  fertilizePlant: (plantId) => {
    const state = get();
    const remaining = state.getFertilizeCooldownRemaining(plantId);
    if (remaining > 0) {
      soundManager.play('fail');
      return false;
    }

    const cellPos = findCellByPlantId(state.grid, plantId);
    if (!cellPos) return false;

    const cell = state.grid[cellPos.row][cellPos.col];
    if (!cell.plant) return false;
    if (cell.plant.progress >= 100) {
      soundManager.play('fail');
      return false;
    }

    const config = PLANT_CONFIGS[cell.plant.type];
    const now = Date.now();
    const oldProgress = cell.plant.progress;
    const oldStage = cell.plant.stage;
    const newProgress = Math.min(100, oldProgress + config.fertilizerBoost);
    const newStage = calculateStage(newProgress);
    const stageChanged = oldStage !== newStage;

    let description = `施肥：成长值 ${oldProgress}% → ${newProgress}%（+${config.fertilizerBoost}%）`;
    if (stageChanged) {
      description += `，进入${getStageLabel(newStage)}`;
    }

    const logEntry: GrowthLogEntry = {
      id: uuidv4(),
      timestamp: now,
      action: ActionType.FERTILIZE,
      description,
      details: {
        oldProgress,
        newProgress,
        boostValue: config.fertilizerBoost,
        stageChanged,
        oldStage,
        newStage
      }
    };

    set((state) => {
      const newGrid = state.grid.map((r, ri) =>
        r.map((c, ci) => {
          if (ri === cellPos.row && ci === cellPos.col && c.plant) {
            return {
              ...c,
              plant: {
                ...c.plant,
                progress: newProgress,
                stage: newStage,
                lastFertilizedAt: now,
                isFertilizing: true,
                logs: [logEntry, ...c.plant.logs]
              }
            };
          }
          return c;
        })
      );
      return {
        grid: newGrid,
        fertilizeCooldowns: {
          ...state.fertilizeCooldowns,
          [plantId]: now
        }
      };
    });

    soundManager.play('success');

    setTimeout(() => {
      set((state) => {
        const newGrid = state.grid.map((r, ri) =>
          r.map((c, ci) => {
            if (ri === cellPos.row && ci === cellPos.col && c.plant) {
              return { ...c, plant: { ...c.plant, isFertilizing: false } };
            }
            return c;
          })
        );
        return { grid: newGrid };
      });
    }, 800);

    return true;
  },

  toggleExpandPlant: (plantId) => {
    set((state) => ({
      expandedPlantId: state.expandedPlantId === plantId ? null : plantId
    }));
  },

  updateTime: () => {
    set({ currentTime: Date.now() });
  },

  getFertilizeCooldownRemaining: (plantId) => {
    const state = get();
    const lastFertilized = state.fertilizeCooldowns[plantId];
    if (!lastFertilized) return 0;
    const elapsed = Date.now() - lastFertilized;
    return Math.max(0, FERTILIZE_COOLDOWN - elapsed);
  }
}));
