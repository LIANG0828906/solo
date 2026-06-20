import { useGameStore, hasAdjacentBuilding, canAfford, BUILDING_CONFIGS, BUILDING_NAMES, RESOURCE_NAMES } from '@/store/gameStore';
import type { BuildingType } from '@/store/gameStore';

export function validatePlacement(
  x: number,
  y: number,
  type: BuildingType
): { valid: boolean; reason?: string } {
  const state = useGameStore.getState();
  const { gridMap, resources, gridSize } = state;

  if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) {
    return { valid: false, reason: '超出网格边界' };
  }

  if (gridMap[y][x] !== null) {
    return { valid: false, reason: '该位置已有建筑' };
  }

  if (hasAdjacentBuilding(gridMap, x, y, gridSize)) {
    return { valid: false, reason: '建筑间必须至少留1格通道' };
  }

  const config = BUILDING_CONFIGS[type];
  if (!canAfford(resources, config.cost)) {
    const costStr = Object.entries(config.cost)
      .filter(([, v]) => v && v > 0)
      .map(([k, v]) => `${RESOURCE_NAMES[k] ?? k}:${v}`)
      .join(' ');
    return { valid: false, reason: `资源不足！需要：${costStr}` };
  }

  return { valid: true };
}

export function canPlaceAt(x: number, y: number, type: BuildingType | null): boolean {
  if (!type) return false;
  return validatePlacement(x, y, type).valid;
}

export function getPlacementPreview(
  x: number,
  y: number,
  type: BuildingType | null
): 'placeable' | 'blocked' | 'none' {
  if (!type) return 'none';
  const result = validatePlacement(x, y, type);
  if (result.valid) return 'placeable';
  return 'blocked';
}
