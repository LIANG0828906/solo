import type { TerrainBlock, TerrainType, AABB, MovingPlatformConfig } from './types';
import { TILE_SIZE } from './types';

export class TerrainManager {
  private terrains: TerrainBlock[] = [];
  private nextId = 0;

  addTerrain(type: TerrainType, x: number, y: number, config?: Partial<MovingPlatformConfig>): TerrainBlock {
    const id = `t_${this.nextId++}`;
    const friction = this.getFrictionForType(type);
    const terrain: TerrainBlock = {
      id,
      type,
      x: Math.floor(x / TILE_SIZE) * TILE_SIZE,
      y: Math.floor(y / TILE_SIZE) * TILE_SIZE,
      width: TILE_SIZE,
      height: TILE_SIZE,
      friction
    };

    if (type === 'slope') {
      terrain.slopeDirection = 'right';
    }
    if (type === 'step') {
      terrain.stepHeight = TILE_SIZE / 2;
    }
    if (type === 'moving') {
      terrain.movingConfig = {
        axis: config?.axis || 'horizontal',
        originX: terrain.x,
        originY: terrain.y,
        distance: config?.distance || 100,
        speed: config?.speed || 100,
        direction: 1
      };
    }

    this.terrains.push(terrain);
    return terrain;
  }

  removeTerrain(id: string): boolean {
    const idx = this.terrains.findIndex(t => t.id === id);
    if (idx >= 0) {
      this.terrains.splice(idx, 1);
      return true;
    }
    return false;
  }

  moveTerrain(id: string, dx: number, dy: number): boolean {
    const terrain = this.terrains.find(t => t.id === id);
    if (!terrain) return false;
    terrain.x += dx;
    terrain.y += dy;
    if (terrain.movingConfig) {
      terrain.movingConfig.originX += dx;
      terrain.movingConfig.originY += dy;
    }
    return true;
  }

  getTerrainAt(x: number, y: number): TerrainBlock | null {
    for (let i = this.terrains.length - 1; i >= 0; i--) {
      const t = this.terrains[i];
      if (x >= t.x && x <= t.x + t.width && y >= t.y && y <= t.y + t.height) {
        return t;
      }
    }
    return null;
  }

  selectTerrain(x: number, y: number): TerrainBlock | null {
    const t = this.getTerrainAt(x, y);
    this.clearSelection();
    if (t) {
      t.selected = true;
    }
    return t;
  }

  clearSelection(): void {
    for (const t of this.terrains) {
      t.selected = false;
    }
  }

  getSelected(): TerrainBlock | null {
    return this.terrains.find(t => t.selected) || null;
  }

  removeSelected(): boolean {
    const selected = this.getSelected();
    if (selected) {
      return this.removeTerrain(selected.id);
    }
    return false;
  }

  getTerrainsInArea(aabb: AABB): TerrainBlock[] {
    return this.terrains.filter(t =>
      t.x < aabb.x + aabb.width &&
      t.x + t.width > aabb.x &&
      t.y < aabb.y + aabb.height &&
      t.y + t.height > aabb.y
    );
  }

  getAll(): TerrainBlock[] {
    return this.terrains;
  }

  clear(): void {
    this.terrains = [];
    this.nextId = 0;
  }

  reset(): void {
    this.clear();
    this.addDefaultTerrain();
  }

  addDefaultTerrain(): void {
    for (let x = 0; x < 800; x += TILE_SIZE) {
      this.addTerrain('ground', x, 560 - TILE_SIZE + 32);
    }
  }

  private getFrictionForType(type: TerrainType): number {
    switch (type) {
      case 'ground': return 0.82;
      case 'slope': return 0.95;
      case 'step': return 0.85;
      case 'moving': return 0.99;
      case 'oneway': return 0.85;
      default: return 0.85;
    }
  }
}
