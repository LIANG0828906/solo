import type { Building, BuildingType, Resources } from '../types';
import { BUILDING_CONFIGS, GRID_SIZE } from '../utils/constants';

export interface DragPreview {
  type: BuildingType | null;
  gridX: number;
  gridY: number;
  size: 2 | 3;
  valid: boolean;
}

export class Builder {
  private grid: (string | null)[][] = [];
  private buildings: Map<string, Building> = new Map();

  constructor() {
    this.reset();
  }

  reset(): void {
    this.grid = Array.from({ length: GRID_SIZE }, () =>
      Array.from({ length: GRID_SIZE }, () => null)
    );
    this.buildings.clear();
  }

  getBuildings(): Building[] {
    return Array.from(this.buildings.values());
  }

  getBuildingsMap(): Map<string, Building> {
    return this.buildings;
  }

  canPlace(type: BuildingType, gridX: number, gridY: number, resources: Resources): { valid: boolean; reason?: string } {
    const config = BUILDING_CONFIGS[type];
    if (!config) return { valid: false, reason: '未知建筑类型' };

    const size = config.size;

    if (gridX < 0 || gridY < 0 || gridX + size > GRID_SIZE || gridY + size > GRID_SIZE) {
      return { valid: false, reason: '超出边界' };
    }

    for (let dy = 0; dy < size; dy++) {
      for (let dx = 0; dx < size; dx++) {
        if (this.grid[gridY + dy][gridX + dx]) {
          return { valid: false, reason: '位置被占用' };
        }
      }
    }

    if (
      resources.oxygen < config.cost.oxygen ||
      resources.energy < config.cost.energy ||
      resources.metal < config.cost.metal
    ) {
      return { valid: false, reason: '资源不足' };
    }

    return { valid: true };
  }

  placeBuilding(type: BuildingType, gridX: number, gridY: number, resources: Resources): { success: boolean; building?: Building; cost?: { oxygen: number; energy: number; metal: number }; reason?: string } {
    const check = this.canPlace(type, gridX, gridY, resources);
    if (!check.valid) {
      return { success: false, reason: check.reason };
    }

    const config = BUILDING_CONFIGS[type];
    const id = 'b_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    const building: Building = {
      id,
      type,
      gridX,
      gridY,
      size: config.size,
      production: { ...config.production },
      cost: { ...config.cost },
    };

    const size = config.size;
    for (let dy = 0; dy < size; dy++) {
      for (let dx = 0; dx < size; dx++) {
        this.grid[gridY + dy][gridX + dx] = id;
      }
    }

    this.buildings.set(id, building);

    return {
      success: true,
      building,
      cost: { ...config.cost },
    };
  }

  removeBuilding(id: string): boolean {
    const b = this.buildings.get(id);
    if (!b) return false;
    for (let dy = 0; dy < b.size; dy++) {
      for (let dx = 0; dx < b.size; dx++) {
        if (this.grid[b.gridY + dy][b.gridX + dx] === id) {
          this.grid[b.gridY + dy][b.gridX + dx] = null;
        }
      }
    }
    this.buildings.delete(id);
    return true;
  }

  setBuildingsFromLoad(list: Building[]): void {
    this.reset();
    for (const b of list) {
      this.buildings.set(b.id, b);
      for (let dy = 0; dy < b.size; dy++) {
        for (let dx = 0; dx < b.size; dx++) {
          if (b.gridY + dy < GRID_SIZE && b.gridX + dx < GRID_SIZE) {
            this.grid[b.gridY + dy][b.gridX + dx] = b.id;
          }
        }
      }
    }
  }

  findNeighbors(gridX: number, gridY: number, size: number): Building[] {
    const neighbors: Building[] = [];
    const visited = new Set<string>();
    for (let dy = -1; dy <= size; dy++) {
      for (let dx = -1; dx <= size; dx++) {
        const gx = gridX + dx;
        const gy = gridY + dy;
        if (gx < 0 || gy < 0 || gx >= GRID_SIZE || gy >= GRID_SIZE) continue;
        const id = this.grid[gy][gx];
        if (id && !visited.has(id)) {
          const b = this.buildings.get(id);
          if (b) {
            neighbors.push(b);
            visited.add(id);
          }
        }
      }
    }
    return neighbors;
  }
}
