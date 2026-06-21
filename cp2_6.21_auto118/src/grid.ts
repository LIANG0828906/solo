import { GRID, MAX_VOXELS } from './config';

export interface VoxelData {
  x: number;
  y: number;
  z: number;
  color: string;
}

interface VoxelOperation {
  type: 'add' | 'remove';
  voxels: VoxelData[];
}

type VoxelChangeListener = (voxels: Map<string, VoxelData>) => void;
type CountChangeListener = (count: number) => void;

function voxelKey(x: number, y: number, z: number): string {
  return `${x},${y},${z}`;
}

class VoxelGrid {
  private voxels: Map<string, VoxelData> = new Map();
  private undoStack: VoxelOperation[] = [];
  private redoStack: VoxelOperation[] = [];
  private voxelListeners: VoxelChangeListener[] = [];
  private countListeners: CountChangeListener[] = [];

  getVoxels(): Map<string, VoxelData> {
    return new Map(this.voxels);
  }

  getVoxel(x: number, y: number, z: number): VoxelData | undefined {
    return this.voxels.get(voxelKey(x, y, z));
  }

  hasVoxel(x: number, y: number, z: number): boolean {
    return this.voxels.has(voxelKey(x, y, z));
  }

  getCount(): number {
    return this.voxels.size;
  }

  isInBounds(x: number, y: number, z: number): boolean {
    return (
      x >= GRID.GRID_MIN && x < GRID.GRID_MAX &&
      y >= GRID.GRID_MIN && y < GRID.GRID_MAX &&
      z >= GRID.GRID_MIN && z < GRID.GRID_MAX
    );
  }

  addVoxel(x: number, y: number, z: number, color: string): boolean {
    if (!this.isInBounds(x, y, z)) return false;
    if (this.hasVoxel(x, y, z)) return false;
    if (this.voxels.size >= MAX_VOXELS) return false;

    const voxel: VoxelData = { x, y, z, color };
    this.voxels.set(voxelKey(x, y, z), voxel);

    this.undoStack.push({ type: 'add', voxels: [voxel] });
    this.redoStack = [];

    this.notifyChange();
    return true;
  }

  removeVoxel(x: number, y: number, z: number): boolean {
    const key = voxelKey(x, y, z);
    const voxel = this.voxels.get(key);
    if (!voxel) return false;

    this.voxels.delete(key);

    this.undoStack.push({ type: 'remove', voxels: [voxel] });
    this.redoStack = [];

    this.notifyChange();
    return true;
  }

  removeVoxels(voxels: VoxelData[]): boolean {
    if (voxels.length === 0) return false;

    const removed: VoxelData[] = [];
    for (const v of voxels) {
      const key = voxelKey(v.x, v.y, v.z);
      if (this.voxels.has(key)) {
        this.voxels.delete(key);
        removed.push(v);
      }
    }

    if (removed.length === 0) return false;

    this.undoStack.push({ type: 'remove', voxels: removed });
    this.redoStack = [];

    this.notifyChange();
    return true;
  }

  clearAll(): boolean {
    if (this.voxels.size === 0) return false;

    const allVoxels = Array.from(this.voxels.values());
    this.voxels.clear();

    this.undoStack.push({ type: 'remove', voxels: allVoxels });
    this.redoStack = [];

    this.notifyChange();
    return true;
  }

  undo(): boolean {
    const op = this.undoStack.pop();
    if (!op) return false;

    if (op.type === 'add') {
      for (const v of op.voxels) {
        this.voxels.delete(voxelKey(v.x, v.y, v.z));
      }
    } else {
      for (const v of op.voxels) {
        this.voxels.set(voxelKey(v.x, v.y, v.z), v);
      }
    }

    this.redoStack.push(op);
    this.notifyChange();
    return true;
  }

  redo(): boolean {
    const op = this.redoStack.pop();
    if (!op) return false;

    if (op.type === 'add') {
      for (const v of op.voxels) {
        this.voxels.set(voxelKey(v.x, v.y, v.z), v);
      }
    } else {
      for (const v of op.voxels) {
        this.voxels.delete(voxelKey(v.x, v.y, v.z));
      }
    }

    this.undoStack.push(op);
    this.notifyChange();
    return true;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  onChange(listener: VoxelChangeListener): () => void {
    this.voxelListeners.push(listener);
    return () => {
      this.voxelListeners = this.voxelListeners.filter(l => l !== listener);
    };
  }

  onCountChange(listener: CountChangeListener): () => void {
    this.countListeners.push(listener);
    return () => {
      this.countListeners = this.countListeners.filter(l => l !== listener);
    };
  }

  private notifyChange(): void {
    const snapshot = new Map(this.voxels);
    const count = this.voxels.size;
    for (const listener of this.voxelListeners) {
      listener(snapshot);
    }
    for (const listener of this.countListeners) {
      listener(count);
    }
  }
}

export const grid = new VoxelGrid();
