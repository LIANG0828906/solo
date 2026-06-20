import { create } from 'zustand';
import { produce, enableMapSet } from 'immer';
import {
  GameState,
  GameActions,
  GridCell,
  Resources,
  BuildingType,
  GameEvent,
  CityLevel,
  BuildMenuState,
  GRID_SIZE,
  BUILDING_CONFIGS,
  CRISIS_DURATION,
  PROSPERITY_DURATION
} from '../types/gameTypes';
import {
  canBuildAt,
  getBuildingCost,
  getRefundAmount,
  validateBuildingPlacement
} from '../core/buildingRules';
import {
  calculateResourceDelta,
  applyResourceDelta,
  addToHistory,
  checkEnvironmentalCrisis as checkCrisis
} from '../core/resourceEngine';
import {
  createGameEvent,
  applyEarthquakeEffect,
  applyPollutionEffect,
  getEventMoneyDelta,
  getEventEnvironmentDelta,
  getEarthquakeNotification,
  getPollutionNotification,
  getActiveProsperityEvent
} from '../core/eventSystem';

enableMapSet();

const generateCityName = (): string => {
  const chars = ['星', '辉', '云', '阳', '月', '山', '水', '林', '风', '雨', '光', '明', '永', '安', '康', '泰'];
  let name = '';
  for (let i = 0; i < 4; i++) {
    name += chars[Math.floor(Math.random() * chars.length)];
  }
  return name + '市';
};

const createInitialGrid = (): GridCell[][] => {
  const grid: GridCell[][] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    const row: GridCell[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      const isRoad = x === 0 || x === GRID_SIZE - 1;
      row.push({
        x,
        y,
        building: isRoad ? 'road' : 'empty'
      });
    }
    grid.push(row);
  }
  return grid;
};

const initialResources: Resources = {
  population: 0,
  money: 1000,
  happiness: 80,
  environment: 80
};

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  grid: createInitialGrid(),
  resources: initialResources,
  resourceHistory: [],
  events: [],
  activeNotifications: [],
  cityName: generateCityName(),
  selectedBuilding: 'residential',
  isShiftPressed: false,
  environmentalCrisis: false,
  prosperityBoost: false,
  crisisTimer: 0,
  prosperityTimer: 0,
  buildMenu: null,
  hoveredCell: null,
  lastCityLevel: 'village',
  showLevelUpAnimation: false,
  affectedCells: new Set<string>(),

  buildBuilding: (x: number, y: number, type: BuildingType): boolean => {
    const state = get();
    const validation = validateBuildingPlacement(state.grid, x, y, type, state.resources.money);
    
    if (!validation.valid) {
      return false;
    }

    const cost = getBuildingCost(type);
    
    set(produce((draft: GameState) => {
      draft.grid[y][x].building = type;
      draft.resources.money -= cost;
      draft.buildMenu = null;
    }));

    return true;
  },

  removeBuilding: (x: number, y: number): void => {
    const state = get();
    const cell = state.grid[y][x];
    if (cell.building === 'empty' || cell.building === 'road') return;

    const refund = getRefundAmount(cell.building);
    
    set(produce((draft: GameState) => {
      draft.grid[y][x].building = 'empty';
      draft.resources.money += refund;
    }));
  },

  updateResources: (delta: Partial<Resources>): void => {
    set(produce((draft: GameState) => {
      draft.resources = applyResourceDelta(draft.resources, delta);
    }));
  },

  settleResources: (): void => {
    const state = get();
    const delta = calculateResourceDelta(state.grid, state.environmentalCrisis, state.prosperityBoost);
    
    set(produce((draft: GameState) => {
      draft.resources = applyResourceDelta(draft.resources, delta);
      draft.resourceHistory = addToHistory(draft.resourceHistory, draft.resources);
    }));

    get().checkEnvironmentalCrisis();
    get().checkProsperity();
    
    const currentLevel = get().getCityLevel();
    if (currentLevel !== get().lastCityLevel) {
      set(produce((draft: GameState) => {
        draft.lastCityLevel = currentLevel;
        draft.showLevelUpAnimation = true;
      }));
      setTimeout(() => {
        get().setShowLevelUpAnimation(false);
      }, 2000);
    }
  },

  triggerEvent: (event: GameEvent): void => {
    set(produce((draft: GameState) => {
      draft.events.push(event);
      draft.activeNotifications.push(event);
    }));

    switch (event.type) {
      case 'earthquake': {
        const { newGrid, destroyedCount, affectedCells } = applyEarthquakeEffect(get().grid);
        const moneyDelta = getEventMoneyDelta('earthquake');
        const notification = getEarthquakeNotification(destroyedCount);
        
        set(produce((draft: GameState) => {
          draft.grid = newGrid;
          draft.resources.money = Math.max(0, draft.resources.money + moneyDelta);
          draft.activeNotifications[draft.activeNotifications.length - 1] = notification;
          affectedCells.forEach(key => draft.affectedCells.add(key));
        }));
        
        setTimeout(() => {
          affectedCells.forEach(key => get().removeAffectedCell(key));
        }, 3000);
        break;
      }
      
      case 'prosperity': {
        set(produce((draft: GameState) => {
          draft.prosperityBoost = true;
          draft.prosperityTimer = PROSPERITY_DURATION;
        }));
        break;
      }
      
      case 'pollution': {
        const { newGrid, pollutedCount, affectedCells } = applyPollutionEffect(get().grid);
        const envDelta = getEventEnvironmentDelta('pollution');
        const notification = getPollutionNotification(pollutedCount);
        
        set(produce((draft: GameState) => {
          draft.grid = newGrid;
          draft.resources.environment = Math.max(0, draft.resources.environment + envDelta);
          draft.activeNotifications[draft.activeNotifications.length - 1] = notification;
          affectedCells.forEach(key => draft.affectedCells.add(key));
        }));
        
        setTimeout(() => {
          affectedCells.forEach(key => get().removeAffectedCell(key));
        }, 3000);
        break;
      }
    }

    setTimeout(() => {
      get().clearEvent(event.id);
    }, 5000);
  },

  clearEvent: (eventId: string): void => {
    set(produce((draft: GameState) => {
      draft.activeNotifications = draft.activeNotifications.filter(e => e.id !== eventId);
    }));
  },

  setShiftPressed: (pressed: boolean): void => {
    set({ isShiftPressed: pressed });
  },

  setSelectedBuilding: (type: BuildingType | null): void => {
    set({ selectedBuilding: type });
  },

  setBuildMenu: (menu: BuildMenuState | null): void => {
    set({ buildMenu: menu });
  },

  setHoveredCell: (cell: { x: number; y: number } | null): void => {
    set({ hoveredCell: cell });
  },

  checkEnvironmentalCrisis: (): void => {
    const state = get();
    const hasCrisis = checkCrisis(state.resources);
    
    if (hasCrisis && !state.environmentalCrisis) {
      set(produce((draft: GameState) => {
        draft.environmentalCrisis = true;
        draft.crisisTimer = CRISIS_DURATION;
      }));
      
      const crisisEvent = createGameEvent('earthquake');
      crisisEvent.name = '环境危机';
      crisisEvent.description = '环境低于20！人口和金钱增长率下降50%，持续30秒。';
      crisisEvent.isPositive = false;
      crisisEvent.duration = CRISIS_DURATION;
      set(produce((draft: GameState) => {
        draft.activeNotifications.push(crisisEvent);
      }));
      
      setTimeout(() => {
        get().clearEvent(crisisEvent.id);
      }, 5000);
    }
  },

  checkProsperity: (): void => {
    const state = get();
    const activeProsperity = getActiveProsperityEvent(state.events);
    
    if (!activeProsperity && state.prosperityBoost) {
      set({ prosperityBoost: false });
    }
  },

  addResourceHistory: (resources: Resources): void => {
    set(produce((draft: GameState) => {
      draft.resourceHistory = addToHistory(draft.resourceHistory, resources);
    }));
  },

  getCityLevel: (): CityLevel => {
    const population = get().resources.population;
    if (population >= 1000) return 'metropolis';
    if (population >= 600) return 'city';
    if (population >= 200) return 'town';
    return 'village';
  },

  updateTimers: (deltaTime: number): void => {
    set(produce((draft: GameState) => {
      if (draft.crisisTimer > 0) {
        draft.crisisTimer -= deltaTime;
        if (draft.crisisTimer <= 0) {
          draft.environmentalCrisis = false;
          draft.crisisTimer = 0;
        }
      }
      if (draft.prosperityTimer > 0) {
        draft.prosperityTimer -= deltaTime;
        if (draft.prosperityTimer <= 0) {
          draft.prosperityBoost = false;
          draft.prosperityTimer = 0;
        }
      }
    }));
  },

  setEnvironmentalCrisis: (active: boolean): void => {
    set({ environmentalCrisis: active });
  },

  setProsperityBoost: (active: boolean): void => {
    set({ prosperityBoost: active });
  },

  setShowLevelUpAnimation: (show: boolean): void => {
    set({ showLevelUpAnimation: show });
  },

  addAffectedCell: (key: string): void => {
    set(produce((draft: GameState) => {
      draft.affectedCells.add(key);
    }));
  },

  removeAffectedCell: (key: string): void => {
    set(produce((draft: GameState) => {
      draft.affectedCells.delete(key);
    }));
  },

  clearAffectedCells: (): void => {
    set(produce((draft: GameState) => {
      draft.affectedCells.clear();
    }));
  }
}));

export const useGrid = () => useGameStore(state => state.grid);
export const useResources = () => useGameStore(state => state.resources);
export const useResourceHistory = () => useGameStore(state => state.resourceHistory);
export const useActiveNotifications = () => useGameStore(state => state.activeNotifications);
export const useCityName = () => useGameStore(state => state.cityName);
export const useSelectedBuilding = () => useGameStore(state => state.selectedBuilding);
export const useIsShiftPressed = () => useGameStore(state => state.isShiftPressed);
export const useEnvironmentalCrisis = () => useGameStore(state => state.environmentalCrisis);
export const useProsperityBoost = () => useGameStore(state => state.prosperityBoost);
export const useBuildMenu = () => useGameStore(state => state.buildMenu);
export const useHoveredCell = () => useGameStore(state => state.hoveredCell);
export const useShowLevelUpAnimation = () => useGameStore(state => state.showLevelUpAnimation);
export const useAffectedCells = () => useGameStore(state => state.affectedCells);
export const useGetCityLevel = () => useGameStore(state => state.getCityLevel());
