import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { MaterialType } from '@/materials/materialStore';

export interface Voxel {
  id: string;
  x: number;
  y: number;
  z: number;
  material: MaterialType;
}

export type ToolMode = 'add' | 'remove';

interface EditorState {
  voxels: Voxel[];
  currentMaterial: MaterialType;
  toolMode: ToolMode;
  showGrid: boolean;
  showMaterialPanel: boolean;
  addVoxel: (x: number, y: number, z: number) => void;
  removeVoxel: (id: string) => void;
  removeVoxelAt: (x: number, y: number, z: number) => void;
  setMaterial: (material: MaterialType) => void;
  setToolMode: (mode: ToolMode) => void;
  clearWorld: () => void;
  setShowGrid: (show: boolean) => void;
  setShowMaterialPanel: (show: boolean) => void;
  hasVoxelAt: (x: number, y: number, z: number) => boolean;
  getVoxelAt: (x: number, y: number, z: number) => Voxel | undefined;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  voxels: [],
  currentMaterial: 'stone',
  toolMode: 'add',
  showGrid: true,
  showMaterialPanel: true,

  addVoxel: (x: number, y: number, z: number) => {
    const state = get();
    if (state.hasVoxelAt(x, y, z)) return;
    const voxel: Voxel = {
      id: uuidv4(),
      x,
      y,
      z,
      material: state.currentMaterial,
    };
    set({ voxels: [...state.voxels, voxel] });
  },

  removeVoxel: (id: string) => {
    set((state) => ({
      voxels: state.voxels.filter((v) => v.id !== id),
    }));
  },

  removeVoxelAt: (x: number, y: number, z: number) => {
    set((state) => ({
      voxels: state.voxels.filter((v) => !(v.x === x && v.y === y && v.z === z)),
    }));
  },

  setMaterial: (material: MaterialType) => {
    set({ currentMaterial: material });
  },

  setToolMode: (mode: ToolMode) => {
    set({ toolMode: mode });
  },

  clearWorld: () => {
    set({ voxels: [] });
  },

  setShowGrid: (show: boolean) => {
    set({ showGrid: show });
  },

  setShowMaterialPanel: (show: boolean) => {
    set({ showMaterialPanel: show });
  },

  hasVoxelAt: (x: number, y: number, z: number) => {
    return get().voxels.some((v) => v.x === x && v.y === y && v.z === z);
  },

  getVoxelAt: (x: number, y: number, z: number) => {
    return get().voxels.find((v) => v.x === x && v.y === y && v.z === z);
  },
}));
