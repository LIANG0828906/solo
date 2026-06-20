import { Resources, GridCell, BuildingType, BUILDING_CONFIGS, HISTORY_LENGTH } from '../types/gameTypes';

export const calculateResourceDelta = (
  grid: GridCell[][],
  hasCrisis: boolean,
  hasProsperity: boolean
): Partial<Resources> => {
  const delta: Partial<Resources> = {
    population: 0,
    money: 0,
    happiness: 0,
    environment: 0
  };

  const crisisMultiplier = hasCrisis ? 0.5 : 1;
  const prosperityMultiplier = hasProsperity ? 2 : 1;

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const cell = grid[y][x];
      if (cell.building === 'empty' || cell.building === 'road') continue;

      const config = BUILDING_CONFIGS[cell.building];

      for (const key of Object.keys(config.production) as (keyof Resources)[]) {
        const value = config.production[key] || 0;
        let multiplier = crisisMultiplier;
        
        if (cell.building === 'commercial' && key === 'money' && hasProsperity) {
          multiplier = prosperityMultiplier;
        }
        
        delta[key] = (delta[key] || 0) + Math.floor(value * multiplier);
      }

      for (const key of Object.keys(config.consumption) as (keyof Resources)[]) {
        const value = config.consumption[key] || 0;
        delta[key] = (delta[key] || 0) + Math.floor(value * crisisMultiplier);
      }
    }
  }

  return delta;
};

export const applyResourceDelta = (
  currentResources: Resources,
  delta: Partial<Resources>
): Resources => {
  const newResources: Resources = { ...currentResources };

  for (const key of Object.keys(delta) as (keyof Resources)[]) {
    newResources[key] = Math.max(0, newResources[key] + (delta[key] || 0));
  }

  newResources.environment = Math.min(100, Math.max(0, newResources.environment));
  newResources.happiness = Math.min(100, Math.max(0, newResources.happiness));

  return newResources;
};

export const addToHistory = (
  history: Resources[],
  resources: Resources
): Resources[] => {
  const newHistory = [...history, { ...resources }];
  if (newHistory.length > HISTORY_LENGTH) {
    newHistory.shift();
  }
  return newHistory;
};

export const getResourceTrend = (
  history: Resources[],
  key: keyof Resources
): 'up' | 'down' | 'stable' => {
  if (history.length < 2) return 'stable';
  
  const recent = history[history.length - 1][key];
  const previous = history[history.length - 2][key];
  
  if (recent > previous) return 'up';
  if (recent < previous) return 'down';
  return 'stable';
};

export const countBuildings = (grid: GridCell[][]): Record<BuildingType, number> => {
  const counts: Record<BuildingType, number> = {
    empty: 0,
    residential: 0,
    commercial: 0,
    industrial: 0,
    road: 0
  };

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      counts[grid[y][x].building]++;
    }
  }

  return counts;
};

export const checkEnvironmentalCrisis = (resources: Resources): boolean => {
  return resources.environment < 20;
};
