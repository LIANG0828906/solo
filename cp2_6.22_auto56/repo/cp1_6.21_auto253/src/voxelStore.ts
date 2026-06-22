import { create } from 'zustand';

export interface Voxel {
  x: number;
  y: number;
  z: number;
  color: string;
}

export type ToolType = 'brush' | 'eraser' | 'fill' | 'eyedropper';

const GRID_SIZE = 16;
const DEFAULT_COLOR = '#3B82F6';

export const PRESET_COLORS = [
  '#EF4444',
  '#F97316',
  '#F59E0B',
  '#EAB308',
  '#84CC16',
  '#22C55E',
  '#10B981',
  '#06B6D4',
  '#3B82F6',
  '#6366F1',
  '#8B5CF6',
  '#EC4899',
];

interface VoxelState {
  voxels: Voxel[];
  voxelMap: Map<string, number>;
  currentColor: string;
  currentTool: ToolType;
  addVoxel: (x: number, y: number, z: number) => void;
  removeVoxel: (x: number, y: number, z: number) => void;
  setColor: (color: string) => void;
  setTool: (tool: ToolType) => void;
  clearAll: () => void;
  fillVoxels: (x: number, y: number, z: number) => void;
  exportData: () => string;
  getVoxelAt: (x: number, y: number, z: number) => Voxel | undefined;
}

const getKey = (x: number, y: number, z: number) => `${x},${y},${z}`;

const rebuildVoxelMap = (voxels: Voxel[]): Map<string, number> => {
  const map = new Map<string, number>();
  voxels.forEach((v, i) => {
    map.set(getKey(v.x, v.y, v.z), i);
  });
  return map;
};

export const useVoxelStore = create<VoxelState>((set, get) => ({
  voxels: [],
  voxelMap: new Map(),
  currentColor: DEFAULT_COLOR,
  currentTool: 'brush',

  addVoxel: (x: number, y: number, z: number) => {
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE || z < 0 || z >= GRID_SIZE) {
      return;
    }
    const state = get();
    const key = getKey(x, y, z);
    if (state.voxelMap.has(key)) {
      return;
    }
    const newVoxel: Voxel = { x, y, z, color: state.currentColor };
    const newVoxels = [...state.voxels, newVoxel];
    const newMap = new Map(state.voxelMap);
    newMap.set(key, newVoxels.length - 1);
    set({ voxels: newVoxels, voxelMap: newMap });
  },

  removeVoxel: (x: number, y: number, z: number) => {
    const state = get();
    const key = getKey(x, y, z);
    const index = state.voxelMap.get(key);
    if (index === undefined) {
      return;
    }
    const newVoxels = state.voxels.filter((_, i) => i !== index);
    set({ voxels: newVoxels, voxelMap: rebuildVoxelMap(newVoxels) });
  },

  setColor: (color: string) => set({ currentColor: color }),

  setTool: (tool: ToolType) => set({ currentTool: tool }),

  clearAll: () => set({ voxels: [], voxelMap: new Map() }),

  fillVoxels: (x: number, y: number, z: number) => {
    const state = get();
    const targetVoxel = state.getVoxelAt(x, y, z);
    const targetColor = targetVoxel?.color;
    const fillColor = state.currentColor;

    if (targetColor === fillColor) {
      return;
    }

    const visited = new Set<string>();
    const toFill: { x: number; y: number; z: number }[] = [];
    const queue: { x: number; y: number; z: number }[] = [{ x, y, z }];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const key = getKey(current.x, current.y, current.z);

      if (visited.has(key)) continue;
      if (current.x < 0 || current.x >= GRID_SIZE) continue;
      if (current.y < 0 || current.y >= GRID_SIZE) continue;
      if (current.z < 0 || current.z >= GRID_SIZE) continue;

      const voxel = state.getVoxelAt(current.x, current.y, current.z);
      const voxelColor = voxel?.color;

      if (targetVoxel) {
        if (voxelColor !== targetColor) continue;
      } else {
        if (voxelColor !== undefined) continue;
      }

      visited.add(key);
      toFill.push(current);

      queue.push({ x: current.x + 1, y: current.y, z: current.z });
      queue.push({ x: current.x - 1, y: current.y, z: current.z });
      queue.push({ x: current.x, y: current.y + 1, z: current.z });
      queue.push({ x: current.x, y: current.y - 1, z: current.z });
      queue.push({ x: current.x, y: current.y, z: current.z + 1 });
      queue.push({ x: current.x, y: current.y, z: current.z - 1 });
    }

    const newVoxels = [...state.voxels];
    const newMap = new Map(state.voxelMap);

    toFill.forEach((pos) => {
      const key = getKey(pos.x, pos.y, pos.z);
      const idx = newMap.get(key);
      if (idx !== undefined) {
        newVoxels[idx] = { ...newVoxels[idx], color: fillColor };
      } else {
        newVoxels.push({ x: pos.x, y: pos.y, z: pos.z, color: fillColor });
        newMap.set(key, newVoxels.length - 1);
      }
    });

    set({ voxels: newVoxels, voxelMap: newMap });
  },

  exportData: () => {
    const state = get();
    const data = {
      gridSize: GRID_SIZE,
      voxels: state.voxels.map((v) => ({
        x: v.x,
        y: v.y,
        z: v.z,
        color: v.color,
      })),
    };
    return JSON.stringify(data, null, 2);
  },

  getVoxelAt: (x: number, y: number, z: number) => {
    const state = get();
    const key = getKey(x, y, z);
    const index = state.voxelMap.get(key);
    return index !== undefined ? state.voxels[index] : undefined;
  },
}));

export { GRID_SIZE };
