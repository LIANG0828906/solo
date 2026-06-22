import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export type BuildingType = 'miner' | 'powerplant' | 'factory' | 'habitat' | 'warehouse';

export interface Building {
  id: string;
  type: BuildingType;
  x: number;
  y: number;
  productionProgress: number;
  isPreparing: boolean;
  placedAt: number;
}

export interface Resources {
  energy: number;
  mineral: number;
  population: number;
  processedGoods: number;
}

export interface ProductionHistoryPoint {
  timestamp: number;
  energy: number;
  mineral: number;
}

export interface EventLogEntry {
  id: string;
  timestamp: number;
  type: 'success' | 'warning' | 'info';
  icon: string;
  message: string;
}

export interface Transport {
  id: string;
  resourceType: 'energy' | 'mineral' | 'processedGoods';
  amount: number;
  startTime: number;
  duration: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  isOverflow: boolean;
}

export interface BuildingConfig {
  cost: Partial<Resources>;
  cycleMs: number;
  input: Partial<Resources>;
  output: Partial<Resources>;
}

export const BUILDING_CONFIGS: Record<BuildingType, BuildingConfig> = {
  powerplant: {
    cost: { mineral: 100 },
    cycleMs: 2000,
    input: {},
    output: { energy: 2 },
  },
  miner: {
    cost: { energy: 20, mineral: 50 },
    cycleMs: 3000,
    input: { energy: 1 },
    output: { mineral: 1 },
  },
  factory: {
    cost: { energy: 30, mineral: 80 },
    cycleMs: 5000,
    input: { mineral: 2, energy: 1 },
    output: { processedGoods: 1 },
  },
  habitat: {
    cost: { energy: 10, mineral: 30 },
    cycleMs: 3000,
    input: { energy: 1, processedGoods: 1 },
    output: { population: 1 },
  },
  warehouse: {
    cost: { mineral: 60 },
    cycleMs: 0,
    input: {},
    output: {},
  },
};

export const BUILDING_NAMES: Record<BuildingType, string> = {
  miner: '采矿机',
  powerplant: '发电厂',
  factory: '加工厂',
  habitat: '居住舱',
  warehouse: '仓库',
};

export const RESOURCE_NAMES: Record<string, string> = {
  energy: '能量',
  mineral: '矿物',
  processedGoods: '加工品',
  population: '人口',
};

let _nextId = 0;
export const genId = () => `${_nextId++}_${Date.now()}`;

function createEmptyGrid(size: number): (Building | null)[][] {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null)
  );
}

function findNearestWarehouse(buildings: Building[], x: number, y: number): Building | null {
  let nearest: Building | null = null;
  let minDist = Infinity;
  for (const b of buildings) {
    if (b.type !== 'warehouse') continue;
    const dist = Math.abs(b.x - x) + Math.abs(b.y - y);
    if (dist < minDist) {
      minDist = dist;
      nearest = b;
    }
  }
  return nearest;
}

export function canAfford(resources: Resources, cost: Partial<Resources>): boolean {
  return (cost.energy ?? 0) <= resources.energy &&
    (cost.mineral ?? 0) <= resources.mineral &&
    (cost.processedGoods ?? 0) <= resources.processedGoods &&
    (cost.population ?? 0) <= resources.population;
}

export function hasInputResources(resources: Resources, input: Partial<Resources>): boolean {
  return (input.energy ?? 0) <= resources.energy &&
    (input.mineral ?? 0) <= resources.mineral &&
    (input.processedGoods ?? 0) <= resources.processedGoods;
}

export function hasAdjacentBuilding(gridMap: (Building | null)[][], x: number, y: number, gridSize: number): boolean {
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
        if (gridMap[ny][nx] !== null) return true;
      }
    }
  }
  return false;
}

function pushEvent(
  eventLog: EventLogEntry[],
  gameStartTime: number,
  type: EventLogEntry['type'],
  icon: string,
  message: string
) {
  eventLog.push({
    id: genId(),
    timestamp: Date.now() - gameStartTime,
    type,
    icon,
    message,
  });
  if (eventLog.length > 5) {
    eventLog.splice(0, eventLog.length - 5);
  }
}

export interface GameState {
  gridMap: (Building | null)[][];
  buildings: Building[];
  resources: Resources;
  productionHistory: ProductionHistoryPoint[];
  eventLog: EventLogEntry[];
  timeOfDay: 'day' | 'night';
  dayNightTimer: number;
  selectedBuildingType: BuildingType | null;
  gridSize: number;
  transports: Transport[];
  totalProduction: number;
  gameStartTime: number;
  lastHistorySampleTime: number;
  showInsufficientWarning: boolean;
  insufficientWarningMessage: string;
  warehouseCapacity: number;
  warningFlashActive: boolean;

  selectBuildingType: (type: BuildingType | null) => void;
  tryPlaceBuilding: (x: number, y: number) => boolean;
  removeBuilding: (x: number, y: number) => void;
  tick: (deltaMs: number, frameCount: number) => void;
  toggleTimeOfDay: () => void;
  setGridSize: (size: number) => void;
  dismissWarning: () => void;
  triggerWarningFlash: () => void;
  addEvent: (type: EventLogEntry['type'], icon: string, message: string) => void;
}

const INITIAL_GRID_SIZE = 18;

export const useGameStore = create<GameState>()(
  immer((set, get) => ({
    gridMap: createEmptyGrid(INITIAL_GRID_SIZE),
    buildings: [],
    resources: { energy: 100, mineral: 200, population: 0, processedGoods: 0 },
    productionHistory: [],
    eventLog: [],
    timeOfDay: 'day' as const,
    dayNightTimer: 0,
    selectedBuildingType: null,
    gridSize: INITIAL_GRID_SIZE,
    transports: [],
    totalProduction: 0,
    gameStartTime: Date.now(),
    lastHistorySampleTime: 0,
    showInsufficientWarning: false,
    insufficientWarningMessage: '',
    warehouseCapacity: 200,
    warningFlashActive: false,

    selectBuildingType: (type) =>
      set((s) => {
        s.selectedBuildingType = type;
      }),

    tryPlaceBuilding: (x, y) => {
      const state = get();
      const type = state.selectedBuildingType;
      if (!type) return false;

      if (x < 0 || x >= state.gridSize || y < 0 || y >= state.gridSize) return false;
      if (state.gridMap[y][x] !== null) return false;

      const config = BUILDING_CONFIGS[type];
      if (!canAfford(state.resources, config.cost)) {
        const costStr = Object.entries(config.cost)
          .filter(([, v]) => v && v > 0)
          .map(([k, v]) => `${RESOURCE_NAMES[k] ?? k}:${v}`)
          .join(' ');
        set((s) => {
          s.showInsufficientWarning = true;
          s.insufficientWarningMessage = `资源不足！需要：${costStr}`;
        });
        get().addEvent('warning', 'exclamation', `资源不足，无法建造${BUILDING_NAMES[type]}`);
        return false;
      }

      if (hasAdjacentBuilding(state.gridMap, x, y, state.gridSize)) {
        set((s) => {
          s.showInsufficientWarning = true;
          s.insufficientWarningMessage = '建筑间必须至少留1格通道！';
        });
        return false;
      }

      const building: Building = {
        id: genId(),
        type,
        x,
        y,
        productionProgress: 0,
        isPreparing: true,
        placedAt: Date.now(),
      };

      set((s) => {
        s.gridMap[y][x] = building;
        s.buildings.push(building);
        const cost = config.cost;
        if (cost.energy) s.resources.energy -= cost.energy;
        if (cost.mineral) s.resources.mineral -= cost.mineral;
        if (cost.processedGoods) s.resources.processedGoods -= cost.processedGoods;
        if (cost.population) s.resources.population -= cost.population;
        if (type === 'warehouse') {
          s.warehouseCapacity += 200;
        }
        pushEvent(s.eventLog, s.gameStartTime, 'success', 'check', `建造了${BUILDING_NAMES[type]} (${x},${y})`);
      });

      setTimeout(() => {
        set((s) => {
          const b = s.buildings.find((b) => b.id === building.id);
          if (b) b.isPreparing = false;
          const cell = s.gridMap[y]?.[x];
          if (cell && cell.id === building.id) {
            cell.isPreparing = false;
          }
        });
      }, 500);

      return true;
    },

    removeBuilding: (x, y) =>
      set((s) => {
        const building = s.gridMap[y]?.[x];
        if (!building) return;
        s.gridMap[y][x] = null;
        s.buildings = s.buildings.filter((b) => b.id !== building.id);
        if (building.type === 'warehouse') {
          s.warehouseCapacity = Math.max(200, s.warehouseCapacity - 200);
        }
        pushEvent(s.eventLog, s.gameStartTime, 'warning', 'exclamation', `拆除了${BUILDING_NAMES[building.type]} (${x},${y})`);
      }),

    tick: (deltaMs, frameCount) =>
      set((s) => {
        s.dayNightTimer += deltaMs;
        if (s.dayNightTimer >= 30000) {
          s.dayNightTimer = 0;
          s.timeOfDay = s.timeOfDay === 'day' ? 'night' : 'day';
          pushEvent(
            s.eventLog, s.gameStartTime, 'info',
            s.timeOfDay === 'night' ? 'moon' : 'sun',
            s.timeOfDay === 'night' ? '夜幕降临' : '黎明到来'
          );
        }

        for (const building of s.buildings) {
          if (building.isPreparing) continue;
          const config = BUILDING_CONFIGS[building.type];
          if (config.cycleMs === 0) continue;

          building.productionProgress += deltaMs / config.cycleMs;

          while (building.productionProgress >= 1) {
            building.productionProgress -= 1;

            if (!hasInputResources(s.resources, config.input)) {
              if (Math.random() < 0.05) {
                pushEvent(s.eventLog, s.gameStartTime, 'warning', 'exclamation', `${BUILDING_NAMES[building.type]} 缺少输入资源`);
              }
              building.productionProgress = 0;
              break;
            }

            if (building.type === 'habitat' && s.resources.population >= 20) {
              building.productionProgress = 0;
              break;
            }

            if (config.input.energy) s.resources.energy -= config.input.energy;
            if (config.input.mineral) s.resources.mineral -= config.input.mineral;
            if (config.input.processedGoods) s.resources.processedGoods -= config.input.processedGoods;

            const output = config.output;

            if (output.population) {
              s.resources.population = Math.min(20, s.resources.population + output.population);
              pushEvent(s.eventLog, s.gameStartTime, 'info', 'person', `人口增加至 ${s.resources.population}`);
            }

            const transportableOutput = (output.energy ?? 0) + (output.mineral ?? 0) + (output.processedGoods ?? 0);
            if (transportableOutput > 0) {
              const resourceType = output.energy ? 'energy' : output.mineral ? 'mineral' : 'processedGoods';
              const amount = output.energy ?? output.mineral ?? output.processedGoods ?? 0;
              const warehouse = findNearestWarehouse(s.buildings, building.x, building.y);
              if (warehouse) {
                s.transports.push({
                  id: genId(),
                  resourceType: resourceType as Transport['resourceType'],
                  amount,
                  startTime: Date.now(),
                  duration: 5000,
                  fromX: building.x,
                  fromY: building.y,
                  toX: warehouse.x,
                  toY: warehouse.y,
                  isOverflow: false,
                });
              } else {
                const totalStored = s.resources.energy + s.resources.mineral + s.resources.processedGoods;
                if (totalStored + amount <= s.warehouseCapacity) {
                  s.resources[resourceType] += amount;
                } else {
                  pushEvent(s.eventLog, s.gameStartTime, 'warning', 'exclamation', '仓库已满，资源丢失！');
                }
              }
            }

            s.totalProduction++;
          }
        }

        const now = Date.now();
        const completedTransports = s.transports.filter((t) => now - t.startTime >= t.duration);
        for (const transport of completedTransports) {
          const totalStored = s.resources.energy + s.resources.mineral + s.resources.processedGoods;
          if (totalStored + transport.amount > s.warehouseCapacity) {
            transport.isOverflow = true;
            pushEvent(s.eventLog, s.gameStartTime, 'warning', 'exclamation', '仓库溢出！资源已丢失');
            get().triggerWarningFlash();
          } else {
            s.resources[transport.resourceType] += transport.amount;
            pushEvent(
              s.eventLog, s.gameStartTime, 'info', 'arrow',
              `运输到达：${transport.amount} ${RESOURCE_NAMES[transport.resourceType]}`
            );
          }
        }
        s.transports = s.transports.filter((t) => now - t.startTime < t.duration);

        for (const building of s.buildings) {
          if (s.gridMap[building.y] && s.gridMap[building.y][building.x]?.id === building.id) {
            s.gridMap[building.y][building.x] = building;
          }
        }

        if (frameCount % 30 === 0) {
          const elapsed = now - s.gameStartTime;
          s.productionHistory.push({
            timestamp: elapsed,
            energy: s.resources.energy,
            mineral: s.resources.mineral,
          });
          const cutoff = elapsed - 30000;
          const startIdx = s.productionHistory.findIndex((p) => p.timestamp >= cutoff);
          if (startIdx > 0) {
            s.productionHistory = s.productionHistory.slice(startIdx);
          }

          if (s.productionHistory.length >= 3) {
            const len = s.productionHistory.length;
            let declining = true;
            for (let i = len - 3; i < len - 1; i++) {
              const slope = s.productionHistory[i + 1].energy - s.productionHistory[i].energy;
              if (slope >= -2) {
                declining = false;
                break;
              }
            }
            if (declining) {
              pushEvent(s.eventLog, s.gameStartTime, 'warning', 'exclamation', '警告：能量存量快速下降！');
              get().triggerWarningFlash();
            }
          }
        }
      }),

    toggleTimeOfDay: () =>
      set((s) => {
        s.timeOfDay = s.timeOfDay === 'day' ? 'night' : 'day';
        s.dayNightTimer = 0;
        pushEvent(
          s.eventLog, s.gameStartTime, 'info',
          s.timeOfDay === 'night' ? 'moon' : 'sun',
          s.timeOfDay === 'night' ? '手动切换至夜间' : '手动切换至白天'
        );
      }),

    setGridSize: (size) =>
      set((s) => {
        if (size === s.gridSize) return;
        const newGrid = createEmptyGrid(size);
        for (const building of s.buildings) {
          if (building.x < size && building.y < size) {
            newGrid[building.y][building.x] = building;
          }
        }
        s.gridMap = newGrid;
        s.gridSize = size;
      }),

    dismissWarning: () =>
      set((s) => {
        s.showInsufficientWarning = false;
        s.insufficientWarningMessage = '';
      }),

    triggerWarningFlash: () => {
      set((s) => {
        s.warningFlashActive = true;
      });
      setTimeout(() => {
        set((s) => {
          s.warningFlashActive = false;
        });
      }, 300);
    },

    addEvent: (type: EventLogEntry['type'], icon: string, message: string) =>
      set((s) => {
        pushEvent(s.eventLog, s.gameStartTime, type, icon, message);
      }),
  }))
);
