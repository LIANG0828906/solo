import { BuildingType, GridCell, BUILDING_CONFIGS, GRID_SIZE } from '../types/gameTypes';

export const canBuildAt = (
  grid: GridCell[][],
  x: number,
  y: number,
  type: BuildingType,
  currentMoney: number
): boolean => {
  if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return false;
  if (grid[y][x].building !== 'empty') return false;
  if (type === 'empty' || type === 'road') return false;

  const config = BUILDING_CONFIGS[type];
  if (currentMoney < config.cost) return false;

  return hasAdjacentBuildingOrRoad(grid, x, y);
};

export const hasAdjacentBuildingOrRoad = (grid: GridCell[][], x: number, y: number): boolean => {
  const directions = [
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 }
  ];

  for (const { dx, dy } of directions) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
      const cell = grid[ny][nx];
      if (cell.building !== 'empty') {
        return true;
      }
    }
  }
  return false;
};

export const getBuildingCost = (type: BuildingType): number => {
  return BUILDING_CONFIGS[type].cost;
};

export const getRefundAmount = (type: BuildingType): number => {
  return Math.floor(BUILDING_CONFIGS[type].cost * 0.5);
};

export const getBuildingColor = (type: BuildingType): string => {
  return BUILDING_CONFIGS[type].color;
};

export const getBuildingName = (type: BuildingType): string => {
  return BUILDING_CONFIGS[type].name;
};

export const getBuildingIcon = (type: BuildingType): string => {
  return BUILDING_CONFIGS[type].icon;
};

export const getBuildableTypes = (): BuildingType[] => {
  return ['residential', 'commercial', 'industrial'];
};

export const validateBuildingPlacement = (
  grid: GridCell[][],
  x: number,
  y: number,
  type: BuildingType,
  currentMoney: number
): { valid: boolean; reason?: string } => {
  if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
    return { valid: false, reason: '超出地图边界' };
  }
  if (grid[y][x].building !== 'empty') {
    return { valid: false, reason: '该位置已有建筑' };
  }
  if (type === 'empty' || type === 'road') {
    return { valid: false, reason: '无法建造该类型' };
  }

  const config = BUILDING_CONFIGS[type];
  if (currentMoney < config.cost) {
    return { valid: false, reason: `金钱不足，需要 ${config.cost} 金` };
  }

  if (!hasAdjacentBuildingOrRoad(grid, x, y)) {
    return { valid: false, reason: '必须相邻已有建筑或道路' };
  }

  return { valid: true };
};
