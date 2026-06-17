import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { getDefaultMaterial } from '../materials/materialStore';

export interface Voxel {
  id: string;
  x: number;
  y: number;
  z: number;
  material: string;
}

export type ToolMode = 'add' | 'remove';

export interface ParticleEvent {
  id: string;
  x: number;
  y: number;
  z: number;
  color: string;
  timestamp: number;
}

interface EditorState {
  voxels: Voxel[];
  currentMaterial: string;
  showGrid: boolean;
  toolMode: ToolMode;
  particleEvents: ParticleEvent[];

  addVoxel: (x: number, y: number, z: number, color: string) => void;
  removeVoxel: (id: string, color: string) => void;
  setMaterial: (materialId: string) => void;
  toggleGrid: () => void;
  setToolMode: (mode: ToolMode) => void;
  clearWorld: () => void;
  cleanupParticles: () => void;
}

const GRID_SIZE = 15;
const HALF_GRID = Math.floor(GRID_SIZE / 2);

function isInBounds(x: number, y: number, z: number): boolean {
  return (
    x >= -HALF_GRID &&
    x <= HALF_GRID &&
    y >= 0 &&
    y < GRID_SIZE &&
    z >= -HALF_GRID &&
    z <= HALF_GRID
  );
}

export const useEditorStore = create<EditorState>((set, get) => ({
  voxels: [],
  currentMaterial: getDefaultMaterial().id,
  showGrid: true,
  toolMode: 'add',
  particleEvents: [],

  addVoxel: (x: number, y: number, z: number, color: string) => {
    const state = get();
    if (!isInBounds(x, y, z)) return;

    const exists = state.voxels.some(
      (v) => v.x === x && v.y === y && v.z === z
    );
    if (exists) return;

    const newVoxel: Voxel = {
      id: uuidv4(),
      x,
      y,
      z,
      material: state.currentMaterial,
    };

    const particleEvent: ParticleEvent = {
      id: uuidv4(),
      x: x + 0.5,
      y: y + 0.5,
      z: z + 0.5,
      color,
      timestamp: Date.now(),
    };

    set({
      voxels: [...state.voxels, newVoxel],
      particleEvents: [...state.particleEvents, particleEvent],
    });
  },

  removeVoxel: (id: string, color: string) => {
    const state = get();
    const voxel = state.voxels.find((v) => v.id === id);
    if (!voxel) return;

    const particleEvent: ParticleEvent = {
      id: uuidv4(),
      x: voxel.x + 0.5,
      y: voxel.y + 0.5,
      z: voxel.z + 0.5,
      color,
      timestamp: Date.now(),
    };

    set({
      voxels: state.voxels.filter((v) => v.id !== id),
      particleEvents: [...state.particleEvents, particleEvent],
    });
  },

  setMaterial: (materialId: string) => {
    set({ currentMaterial: materialId });
  },

  toggleGrid: () => {
    set((state) => ({ showGrid: !state.showGrid }));
  },

  setToolMode: (mode: ToolMode) => {
    set({ toolMode: mode });
  },

  clearWorld: () => {
    set({ voxels: [], particleEvents: [] });
  },

  cleanupParticles: () => {
    const state = get();
    const now = Date.now();
    const filtered = state.particleEvents.filter(
      (p) => now - p.timestamp < 250
    );
    if (filtered.length !== state.particleEvents.length) {
      set({ particleEvents: filtered });
    }
  },
}));

export const GRID_CONSTANTS = {
  SIZE: GRID_SIZE,
  HALF: HALF_GRID,
};
