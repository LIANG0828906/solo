import { v4 as uuidv4 } from 'uuid';
import type {
  Brick,
  BrickType,
  BrickSize,
  GridPosition,
  HistoryEntry,
  HistoryState,
  HistoryAction
} from '../../utils/types';

const BRICK_SIZES: Record<BrickType, BrickSize> = {
  '1x1': { width: 1, depth: 1, height: 1 },
  '1x2': { width: 1, depth: 2, height: 1 },
  '2x2': { width: 2, depth: 2, height: 1 },
  '2x4': { width: 2, depth: 4, height: 1 },
  '1x3': { width: 1, depth: 3, height: 1 },
  '2x3': { width: 2, depth: 3, height: 1 }
};

export const BRICK_TYPES: BrickType[] = ['1x1', '1x2', '2x2', '2x4', '1x3', '2x3'];

export class PartsSystem {
  private bricks: Brick[] = [];
  private history: HistoryState;
  private gridSize: number;
  private spatialHash: Map<string, string> = new Map();

  constructor(gridSize: number = 20, maxHistory: number = 10) {
    this.gridSize = gridSize;
    this.history = {
      past: [],
      future: [],
      maxHistory
    };
  }

  private getHashKey(x: number, y: number, z: number): string {
    return `${x},${y},${z}`;
  }

  private updateSpatialHash(): void {
    this.spatialHash.clear();
    this.bricks.forEach(brick => {
      for (let dx = 0; dx < brick.size.width; dx++) {
        for (let dz = 0; dz < brick.size.depth; dz++) {
          const key = this.getHashKey(
            brick.position.x + dx,
            brick.position.y,
            brick.position.z + dz
          );
          this.spatialHash.set(key, brick.id);
        }
      }
    });
  }

  public getBrickSize(type: BrickType): BrickSize {
    return { ...BRICK_SIZES[type] };
  }

  public getBricks(): Brick[] {
    return [...this.bricks];
  }

  public checkCollision(position: GridPosition, size: BrickSize): boolean {
    const halfGrid = this.gridSize / 2;
    if (
      position.x < -halfGrid ||
      position.z < -halfGrid ||
      position.x + size.width > halfGrid ||
      position.z + size.depth > halfGrid
    ) {
      return true;
    }
    for (let dx = 0; dx < size.width; dx++) {
      for (let dz = 0; dz < size.depth; dz++) {
        const key = this.getHashKey(
          position.x + dx,
          position.y,
          position.z + dz
        );
        if (this.spatialHash.has(key)) {
          return true;
        }
      }
    }
    return false;
  }

  public snapToGrid(worldX: number, worldY: number, worldZ: number): GridPosition {
    const halfGrid = this.gridSize / 2;
    return {
      x: Math.max(-halfGrid, Math.min(halfGrid - 1, Math.floor(worldX + 0.5))),
      y: Math.max(0, Math.floor(worldY)),
      z: Math.max(-halfGrid, Math.min(halfGrid - 1, Math.floor(worldZ + 0.5)))
    };
  }

  public addBrick(type: BrickType, position: GridPosition, color: string): Brick | null {
    const size = this.getBrickSize(type);
    if (this.checkCollision(position, size)) {
      return null;
    }
    const brick: Brick = {
      id: uuidv4(),
      type,
      position: { ...position },
      color,
      size,
      glowPhase: Math.random() * Math.PI * 2,
      glowPeriod: 2 + Math.random() * 2
    };
    this.bricks.push(brick);
    this.updateSpatialHash();
    this.pushHistory('ADD', brick);
    return brick;
  }

  public removeBrick(id: string): Brick | null {
    const index = this.bricks.findIndex(b => b.id === id);
    if (index === -1) return null;
    const brick = this.bricks.splice(index, 1)[0];
    this.updateSpatialHash();
    this.pushHistory('REMOVE', brick);
    return brick;
  }

  private pushHistory(action: HistoryAction, brick: Brick): void {
    this.history.past.push({ action, brick: { ...brick } });
    if (this.history.past.length > this.history.maxHistory) {
      this.history.past.shift();
    }
    this.history.future = [];
  }

  public undo(): Brick | null {
    if (this.history.past.length === 0) return null;
    const entry = this.history.past.pop()!;
    this.history.future.push(entry);
    if (entry.action === 'ADD') {
      const index = this.bricks.findIndex(b => b.id === entry.brick.id);
      if (index !== -1) {
        const removed = this.bricks.splice(index, 1)[0];
        this.updateSpatialHash();
        return removed;
      }
    } else {
      this.bricks.push({ ...entry.brick });
      this.updateSpatialHash();
      return entry.brick;
    }
    return null;
  }

  public redo(): Brick | null {
    if (this.history.future.length === 0) return null;
    const entry = this.history.future.pop()!;
    this.history.past.push(entry);
    if (entry.action === 'ADD') {
      if (!this.checkCollision(entry.brick.position, entry.brick.size)) {
        this.bricks.push({ ...entry.brick });
        this.updateSpatialHash();
        return entry.brick;
      }
    } else {
      const index = this.bricks.findIndex(b => b.id === entry.brick.id);
      if (index !== -1) {
        const removed = this.bricks.splice(index, 1)[0];
        this.updateSpatialHash();
        return removed;
      }
    }
    return null;
  }

  public canUndo(): boolean {
    return this.history.past.length > 0;
  }

  public canRedo(): boolean {
    return this.history.future.length > 0;
  }

  public clearAll(): void {
    this.bricks = [];
    this.history.past = [];
    this.history.future = [];
    this.spatialHash.clear();
  }

  public getHistory(): HistoryState {
    return {
      past: [...this.history.past],
      future: [...this.history.future],
      maxHistory: this.history.maxHistory
    };
  }

  public getBrickCount(): number {
    return this.bricks.length;
  }
}
