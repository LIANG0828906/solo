import { create } from 'zustand';
import type {
  TileHeightMap,
  BrushState,
  WaterState,
  BrushType,
  BrushShape,
  PresetType,
  MouseGridInfo,
} from './types';
import {
  generateInitialHeightMap,
  generatePresetHeightMap,
  smoothHeightAt,
  GRID_SIZE,
} from './terrain';

interface TerrainStore {
  heightMap: TileHeightMap;
  targetHeightMap: TileHeightMap;
  brush: BrushState;
  water: WaterState;
  mouseGridInfo: MouseGridInfo | null;
  isTerrainAnimating: boolean;
  heightAnimation: {
    startHeights: number[][];
    targetHeights: number[][];
    startTime: number;
    duration: number;
  } | null;

  setBrushType: (type: BrushType) => void;
  setBrushShape: (shape: BrushShape) => void;
  setBrushStrength: (strength: number) => void;
  setBrushIntensity: (intensity: number) => void;

  modifyTerrain: (centerX: number, centerZ: number) => void;
  applyHeightsSmooth: (targetHeights: number[][], duration: number) => void;
  updateAnimation: (currentTime: number) => void;
  updateBrushAnimation: (delta: number) => void;

  setWaterStart: (x: number, z: number) => void;
  clearWater: () => void;
  toggleWaterRunning: () => void;
  setWaterRunning: (running: boolean) => void;
  setParticles: (particles: WaterState['particles']) => void;
  setPath: (path: WaterState['path']) => void;

  applyPreset: (preset: PresetType) => void;
  resetTerrain: () => void;

  setMouseGridInfo: (info: MouseGridInfo | null) => void;
}

function deepCopyHeights(heights: number[][]): number[][] {
  return heights.map((row) => [...row]);
}

const BRUSH_ANIMATION_DURATION = 0.3;

export const useTerrainStore = create<TerrainStore>((set, get) => {
  const initialMap = generateInitialHeightMap(GRID_SIZE);

  return {
    heightMap: initialMap,
    targetHeightMap: initialMap,
    brush: {
      type: 'raise',
      shape: 'circle',
      strength: 5,
      intensity: 1.0,
      radius: 2,
    },
    water: {
      startPoint: null,
      path: [],
      particles: [],
      isRunning: true,
    },
    mouseGridInfo: null,
    isTerrainAnimating: false,
    heightAnimation: null,

    setBrushType: (type) =>
      set((state) => ({
        brush: { ...state.brush, type },
      })),

    setBrushShape: (shape) =>
      set((state) => ({
        brush: { ...state.brush, shape },
      })),

    setBrushStrength: (strength) =>
      set((state) => ({
        brush: { ...state.brush, strength },
      })),

    setBrushIntensity: (intensity) =>
      set((state) => ({
        brush: { ...state.brush, intensity },
      })),

    modifyTerrain: (centerX, centerZ) => {
      const { targetHeightMap, brush } = get();
      const { size, heights } = targetHeightMap;
      const newHeights = deepCopyHeights(heights);

      const gx = Math.round(centerX + (size - 1) / 2);
      const gz = Math.round(centerZ + (size - 1) / 2);

      const radius = brush.radius;
      const strengthFactor = (brush.strength / 10) * brush.intensity * 0.15;

      for (let z = gz - radius; z <= gz + radius; z++) {
        for (let x = gx - radius; x <= gx + radius; x++) {
          if (x < 0 || x >= size || z < 0 || z >= size) continue;

          let falloff = 1;
          if (brush.shape === 'circle') {
            const dx = x - gx;
            const dz = z - gz;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist > radius) continue;
            falloff = 1 - dist / radius;
          }

          switch (brush.type) {
            case 'raise':
              newHeights[z][x] += strengthFactor * falloff;
              break;
            case 'lower':
              newHeights[z][x] -= strengthFactor * falloff;
              break;
            case 'smooth':
              newHeights[z][x] = smoothHeightAt(
                heights,
                x,
                z,
                (brush.strength / 10) * falloff
              );
              break;
          }

          newHeights[z][x] = Math.max(0, Math.min(4, newHeights[z][x]));
        }
      }

      set({
        targetHeightMap: { ...targetHeightMap, heights: newHeights },
      });
    },

    updateBrushAnimation: (delta) => {
      const { heightMap, targetHeightMap, isTerrainAnimating } = get();

      if (isTerrainAnimating) return;

      const size = heightMap.size;
      const current = heightMap.heights;
      const target = targetHeightMap.heights;

      let hasChange = false;
      const newHeights: number[][] = [];
      const lerpFactor = Math.min(1, delta / BRUSH_ANIMATION_DURATION);

      for (let z = 0; z < size; z++) {
        newHeights[z] = [];
        for (let x = 0; x < size; x++) {
          const diff = target[z][x] - current[z][x];
          if (Math.abs(diff) > 0.0001) {
            hasChange = true;
            newHeights[z][x] = current[z][x] + diff * lerpFactor * 6;
          } else {
            newHeights[z][x] = target[z][x];
          }
        }
      }

      if (hasChange) {
        set({
          heightMap: { ...heightMap, heights: newHeights },
        });
      }
    },

    applyHeightsSmooth: (targetHeights, duration) => {
      const { heightMap } = get();
      set({
        isTerrainAnimating: true,
        heightAnimation: {
          startHeights: deepCopyHeights(heightMap.heights),
          targetHeights: deepCopyHeights(targetHeights),
          startTime: performance.now(),
          duration,
        },
        targetHeightMap: { size: heightMap.size, heights: deepCopyHeights(targetHeights) },
        water: {
          startPoint: null,
          path: [],
          particles: [],
          isRunning: get().water.isRunning,
        },
      });
    },

    updateAnimation: (currentTime) => {
      const { heightAnimation, heightMap } = get();
      if (!heightAnimation) return;

      const { startHeights, targetHeights, startTime, duration } = heightAnimation;
      const elapsed = currentTime - startTime;
      let t = Math.min(1, elapsed / duration);

      const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      const size = heightMap.size;
      const newHeights: number[][] = [];

      for (let z = 0; z < size; z++) {
        newHeights[z] = [];
        for (let x = 0; x < size; x++) {
          const start = startHeights[z][x];
          const target = targetHeights[z][x];
          newHeights[z][x] = start + (target - start) * easeT;
        }
      }

      if (t >= 1) {
        set({
          heightMap: { ...heightMap, heights: targetHeights },
          isTerrainAnimating: false,
          heightAnimation: null,
        });
      } else {
        set({
          heightMap: { ...heightMap, heights: newHeights },
        });
      }
    },

    setWaterStart: (x, z) => {
      const { targetHeightMap } = get();
      const size = targetHeightMap.size;
      const gx = Math.round(x + (size - 1) / 2);
      const gz = Math.round(z + (size - 1) / 2);

      set((state) => ({
        water: {
          ...state.water,
          startPoint: { x: gx, z: gz },
          path: [],
          particles: [],
        },
      }));
    },

    clearWater: () =>
      set((state) => ({
        water: {
          ...state.water,
          startPoint: null,
          path: [],
          particles: [],
        },
      })),

    toggleWaterRunning: () =>
      set((state) => ({
        water: {
          ...state.water,
          isRunning: !state.water.isRunning,
        },
      })),

    setWaterRunning: (running) =>
      set((state) => ({
        water: {
          ...state.water,
          isRunning: running,
        },
      })),

    setParticles: (particles) =>
      set((state) => ({
        water: { ...state.water, particles },
      })),

    setPath: (path) =>
      set((state) => ({
        water: { ...state.water, path },
      })),

    applyPreset: (preset) => {
      const presetMap = generatePresetHeightMap(preset, GRID_SIZE);
      get().applyHeightsSmooth(presetMap.heights, 2000);
    },

    resetTerrain: () => {
      const initial = generateInitialHeightMap(GRID_SIZE);
      get().applyHeightsSmooth(initial.heights, 1500);
    },

    setMouseGridInfo: (info) => set({ mouseGridInfo: info }),
  };
});
