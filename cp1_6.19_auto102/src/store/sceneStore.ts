import { create } from 'zustand';
import * as THREE from 'three';

export type InsectType = 'bee' | 'ant';
export type SwarmMode = 'gather' | 'disperse';

export interface Insect {
  id: number;
  type: InsectType;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  path: THREE.Vector3[];
  pathIndex: number;
  targetPosition: THREE.Vector3 | null;
  speed: number;
  phase: number;
  visitedCells: Set<string>;
}

export interface TargetPoint {
  position: THREE.Vector3;
  createdAt: number;
}

export interface Obstacle {
  position: THREE.Vector3;
  radius: number;
  height: number;
  type: 'rock' | 'grass' | 'leaf';
}

interface SceneState {
  insects: Insect[];
  obstacles: Obstacle[];
  swarmMode: SwarmMode;
  targetPoint: TargetPoint | null;
  stats: {
    count: number;
    avgSpeed: number;
    exploredArea: number;
  };
  visitedGridCells: Set<string>;
  gridSize: number;
  terrainSize: number;
  addInsect: (insect: Insect) => void;
  removeInsect: (id: number) => void;
  updateInsect: (id: number, updates: Partial<Insect>) => void;
  updateInsects: (updater: (insects: Insect[]) => Insect[]) => void;
  setSwarmMode: (mode: SwarmMode) => void;
  setTargetPoint: (point: TargetPoint | null) => void;
  setObstacles: (obstacles: Obstacle[]) => void;
  updateStats: () => void;
  markCellVisited: (x: number, z: number) => void;
  resetScene: () => void;
  nextInsectId: number;
}

const GRID_SIZE = 20;
const TERRAIN_SIZE = 20;
const INITIAL_INSECT_COUNT = 60;

function createInitialInsects(count: number, nextIdStart: number): { insects: Insect[]; nextId: number; visited: Set<string> } {
  const insects: Insect[] = [];
  const visited = new Set<string>();
  let nextId = nextIdStart;

  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * (TERRAIN_SIZE - 2);
    const z = (Math.random() - 0.5) * (TERRAIN_SIZE - 2);
    const isBee = Math.random() > 0.5;
    const type: InsectType = isBee ? 'bee' : 'ant';
    const y = isBee ? 0.5 + Math.random() * 1.5 : 0.1;

    const cellX = Math.floor(((x + TERRAIN_SIZE / 2) / TERRAIN_SIZE) * GRID_SIZE);
    const cellZ = Math.floor(((z + TERRAIN_SIZE / 2) / TERRAIN_SIZE) * GRID_SIZE);
    const cellKey = `${cellX},${cellZ}`;
    visited.add(cellKey);

    insects.push({
      id: nextId++,
      type,
      position: new THREE.Vector3(x, y, z),
      velocity: new THREE.Vector3(),
      path: [],
      pathIndex: 0,
      targetPosition: null,
      speed: isBee ? 2 + Math.random() : 0.8 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
      visitedCells: new Set([cellKey]),
    });
  }

  return { insects, nextId, visited };
}

const { insects: initialInsects, nextId: initialNextId, visited: initialVisited } = createInitialInsects(INITIAL_INSECT_COUNT, 0);

export const useSceneStore = create<SceneState>((set, get) => ({
  insects: initialInsects,
  obstacles: [],
  swarmMode: 'gather',
  targetPoint: null,
  stats: {
    count: INITIAL_INSECT_COUNT,
    avgSpeed: 0,
    exploredArea: 0,
  },
  visitedGridCells: initialVisited,
  gridSize: GRID_SIZE,
  terrainSize: TERRAIN_SIZE,
  nextInsectId: initialNextId,

  addInsect: (insect) => set((state) => ({ insects: [...state.insects, insect] })),

  removeInsect: (id) => set((state) => ({ insects: state.insects.filter((i) => i.id !== id) })),

  updateInsect: (id, updates) =>
    set((state) => ({
      insects: state.insects.map((i) => (i.id === id ? { ...i, ...updates } : i)),
    })),

  updateInsects: (updater) => set((state) => ({ insects: updater(state.insects) })),

  setSwarmMode: (mode) => set({ swarmMode: mode }),

  setTargetPoint: (point) => set({ targetPoint: point }),

  setObstacles: (obstacles) => set({ obstacles }),

  updateStats: () => {
    const { insects, visitedGridCells, gridSize } = get();
    const totalSpeed = insects.reduce((sum, i) => sum + i.velocity.length(), 0);
    const avgSpeed = insects.length > 0 ? totalSpeed / insects.length : 0;
    const totalCells = gridSize * gridSize;
    const exploredArea = (visitedGridCells.size / totalCells) * 100;

    set({
      stats: {
        count: insects.length,
        avgSpeed: Math.round(avgSpeed * 10) / 10,
        exploredArea: Math.round(exploredArea * 10) / 10,
      },
    });
  },

  markCellVisited: (x, z) => {
    const { terrainSize, gridSize } = get();
    const cellX = Math.max(0, Math.min(gridSize - 1, Math.floor(((x + terrainSize / 2) / terrainSize) * gridSize)));
    const cellZ = Math.max(0, Math.min(gridSize - 1, Math.floor(((z + terrainSize / 2) / terrainSize) * gridSize)));
    const cellKey = `${cellX},${cellZ}`;

    set((state) => {
      if (state.visitedGridCells.has(cellKey)) return {};
      const newVisited = new Set(state.visitedGridCells);
      newVisited.add(cellKey);
      return { visitedGridCells: newVisited };
    });
  },

  resetScene: () => {
    const { insects: newInsects, nextId, visited } = createInitialInsects(INITIAL_INSECT_COUNT, 0);
    set({
      insects: newInsects,
      targetPoint: null,
      swarmMode: 'gather',
      visitedGridCells: visited,
      nextInsectId: nextId,
      stats: {
        count: INITIAL_INSECT_COUNT,
        avgSpeed: 0,
        exploredArea: 0,
      },
    });
  },
}));
