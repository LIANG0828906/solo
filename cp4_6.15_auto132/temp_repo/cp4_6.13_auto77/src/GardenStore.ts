import { create } from 'zustand';
import {
  PlantState,
  PlantType,
  GrowthStage,
  advanceGrowth,
  PLANT_CONFIGS,
  getStageName
} from './Plant';
import { EnvironmentParams } from './Environment';

export interface LogEntry {
  id: string;
  timestamp: number;
  message: string;
  type: 'water' | 'light' | 'nutrients' | 'plant' | 'remove' | 'tag' | 'time' | 'info';
}

interface Toast {
  id: string;
  message: string;
  plantId?: string;
  gridIndex: number;
}

interface GardenState {
  plants: PlantState[];
  environment: EnvironmentParams;
  selectedSeed: PlantType | null;
  selectedPlantId: string | null;
  logs: LogEntry[];
  toasts: Toast[];
  logExpanded: boolean;
  seedPanelOpen: boolean;

  setEnvironment: (params: Partial<EnvironmentParams>) => void;
  selectSeed: (type: PlantType | null) => void;
  selectPlant: (id: string | null) => void;
  addPlant: (type: PlantType, gridIndex: number) => void;
  removePlant: (id: string) => void;
  updatePlantTag: (id: string, tag: string) => void;
  addLog: (message: string, type: LogEntry['type']) => void;
  clearLogs: () => void;
  exportLogs: () => void;
  toggleLogExpanded: () => void;
  toggleSeedPanel: () => void;
  advanceAllPlants: (deltaSeconds: number) => void;
  advanceTime: (hours: number) => void;
  removeToast: (id: string) => void;
  getPlantByGridIndex: (gridIndex: number) => PlantState | undefined;
}

const generateId = () => Math.random().toString(36).substring(2, 11);

export const useGardenStore = create<GardenState>((set, get) => ({
  plants: [],
  environment: {
    light: 60,
    water: 50,
    nutrients: 45
  },
  selectedSeed: null,
  selectedPlantId: null,
  logs: [],
  toasts: [],
  logExpanded: false,
  seedPanelOpen: false,

  setEnvironment: (params) =>
    set((state) => {
      const newEnv = { ...state.environment, ...params };

      const logMessages: string[] = [];
      if (params.light !== undefined) {
        logMessages.push(`光照调至 ${Math.round(params.light)}%`);
      }
      if (params.water !== undefined) {
        logMessages.push(`水分调至 ${Math.round(params.water)}%`);
      }
      if (params.nutrients !== undefined) {
        logMessages.push(`养分调至 ${Math.round(params.nutrients)}%`);
      }

      let newLogs = state.logs;
      if (logMessages.length > 0) {
        newLogs = [
          {
            id: generateId(),
            timestamp: Date.now(),
            message: logMessages.join('，'),
            type: 'info'
          },
          ...state.logs
        ];
      }

      return {
        environment: newEnv,
        logs: newLogs
      };
    }),

  selectSeed: (type) => set({ selectedSeed: type }),

  selectPlant: (id) => set({ selectedPlantId: id }),

  addPlant: (type, gridIndex) => {
    const config = PLANT_CONFIGS[type];
    const now = Date.now();
    const newPlant: PlantState = {
      id: generateId(),
      type,
      stage: GrowthStage.Seed,
      growthProgress: 0,
      health: 80,
      plantedAt: now,
      lastGrowthCheck: now,
      gridIndex
    };

    set((state) => ({
      plants: [...state.plants, newPlant],
      selectedSeed: null,
      logs: [
        {
          id: generateId(),
          timestamp: now,
          message: `种植了${config.name}`,
          type: 'plant'
        },
        ...state.logs
      ]
    }));
  },

  removePlant: (id) => {
    const plant = get().plants.find((p) => p.id === id);
    if (!plant) return;

    const config = PLANT_CONFIGS[plant.type];

    set((state) => ({
      plants: state.plants.filter((p) => p.id !== id),
      selectedPlantId: state.selectedPlantId === id ? null : state.selectedPlantId,
      logs: [
        {
          id: generateId(),
          timestamp: Date.now(),
          message: `移除了${config.name}`,
          type: 'remove'
        },
        ...state.logs
      ]
    }));
  },

  updatePlantTag: (id, tag) => {
    set((state) => ({
      plants: state.plants.map((p) => (p.id === id ? { ...p, tag } : p)),
      logs: tag
        ? [
            {
              id: generateId(),
              timestamp: Date.now(),
              message: `为植物添加标签：${tag}`,
              type: 'tag'
            },
            ...state.logs
          ]
        : state.logs
    }));
  },

  addLog: (message, type) =>
    set((state) => ({
      logs: [
        {
          id: generateId(),
          timestamp: Date.now(),
          message,
          type
        },
        ...state.logs
      ]
    })),

  clearLogs: () => set({ logs: [] }),

  exportLogs: () => {
    const { logs } = get();
    const content = logs
      .map((log) => {
        const date = new Date(log.timestamp);
        const timeStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        return `[${timeStr}] ${log.message}`;
      })
      .join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `garden_log_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  },

  toggleLogExpanded: () => set((state) => ({ logExpanded: !state.logExpanded })),

  toggleSeedPanel: () => set((state) => ({ seedPanelOpen: !state.seedPanelOpen })),

  advanceAllPlants: (deltaSeconds) => {
    const { environment, plants } = get();
    const updatedPlants: PlantState[] = [];
    const newToasts: Toast[] = [];

    for (const plant of plants) {
      const result = advanceGrowth(
        plant,
        environment.light,
        environment.water,
        environment.nutrients,
        deltaSeconds
      );
      updatedPlants.push(result.plant);

      if (result.stageChanged && result.newStage !== undefined) {
        const config = PLANT_CONFIGS[plant.type];
        const stageName = getStageName(result.newStage);
        newToasts.push({
          id: generateId(),
          message: `你的${config.name}进入${stageName}！`,
          plantId: plant.id,
          gridIndex: plant.gridIndex
        });
      }
    }

    if (newToasts.length > 0) {
      set((state) => ({
        plants: updatedPlants,
        toasts: [...state.toasts, ...newToasts]
      }));

      newToasts.forEach((toast) => {
        setTimeout(() => {
          get().removeToast(toast.id);
        }, 3000);
      });
    } else {
      set({ plants: updatedPlants });
    }
  },

  advanceTime: (hours) => {
    const deltaSeconds = hours * 3600;
    get().advanceAllPlants(deltaSeconds);

    set((state) => ({
      logs: [
        {
          id: generateId(),
          timestamp: Date.now(),
          message: `使用时间沙漏加速 ${hours} 小时`,
          type: 'time'
        },
        ...state.logs
      ]
    }));
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    })),

  getPlantByGridIndex: (gridIndex) => {
    return get().plants.find((p) => p.gridIndex === gridIndex);
  }
}));
