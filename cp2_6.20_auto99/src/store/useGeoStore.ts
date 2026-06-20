import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type ColorMode = 'rainbow' | 'heat' | 'grayscale';
export type RockType = 'sedimentary' | 'metamorphic' | 'igneous';

export interface Annotation {
  id: string;
  position: { x: number; y: number; z: number };
  density: number;
  rockType: RockType;
  rockName: string;
}

export interface StressPoint {
  id: string;
  position: { x: number; y: number; z: number };
  densityDiff: number;
}

export interface CameraState {
  position: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
}

interface GeoState {
  geoData: number[][][] | null;
  gridSize: { x: number; y: number; z: number };
  sliceX: number;
  sliceY: number;
  sliceZ: number;
  colorMode: ColorMode;
  annotations: Annotation[];
  stressPoints: StressPoint[];
  cameraState: CameraState;
  presetName: string;
  isPanelOpen: boolean;

  setGeoData: (data: number[][][], size: { x: number; y: number; z: number }, presetName: string) => void;
  setSliceX: (value: number) => void;
  setSliceY: (value: number) => void;
  setSliceZ: (value: number) => void;
  setColorMode: (mode: ColorMode) => void;
  addAnnotation: (position: { x: number; y: number; z: number }, density: number) => void;
  removeAnnotation: (id: string) => void;
  clearAnnotations: () => void;
  setCameraState: (state: CameraState) => void;
  computeStressPoints: () => void;
  resetAll: () => void;
  setPanelOpen: (open: boolean) => void;
  setPresetName: (name: string) => void;
}

const getRockType = (density: number): { type: RockType; name: string } => {
  if (density < 0.3) return { type: 'sedimentary', name: '沉积岩' };
  if (density < 0.7) return { type: 'metamorphic', name: '变质岩' };
  return { type: 'igneous', name: '火成岩' };
};

const defaultCameraState: CameraState = {
  position: { x: 20, y: 15, z: 20 },
  target: { x: 0, y: 0, z: 0 }
};

export const useGeoStore = create<GeoState>((set, get) => ({
  geoData: null,
  gridSize: { x: 16, y: 16, z: 16 },
  sliceX: 0,
  sliceY: 0,
  sliceZ: 0,
  colorMode: 'rainbow',
  annotations: [],
  stressPoints: [],
  cameraState: defaultCameraState,
  presetName: 'cylindrical',
  isPanelOpen: true,

  setGeoData: (data, size, presetName) => {
    set({ geoData: data, gridSize: size, presetName });
    setTimeout(() => get().computeStressPoints(), 0);
  },

  setSliceX: (value) => set({ sliceX: value }),
  setSliceY: (value) => set({ sliceY: value }),
  setSliceZ: (value) => set({ sliceZ: value }),

  setColorMode: (mode) => set({ colorMode: mode }),

  addAnnotation: (position, density) => {
    const rockInfo = getRockType(density);
    const annotation: Annotation = {
      id: uuidv4(),
      position,
      density,
      rockType: rockInfo.type,
      rockName: rockInfo.name
    };
    set((state) => ({ annotations: [...state.annotations, annotation] }));
  },

  removeAnnotation: (id) => {
    set((state) => ({
      annotations: state.annotations.filter(a => a.id !== id)
    }));
  },

  clearAnnotations: () => set({ annotations: [] }),

  setCameraState: (state) => set({ cameraState: state }),

  computeStressPoints: () => {
    const { geoData, gridSize } = get();
    if (!geoData) return;

    const stressPoints: StressPoint[] = [];
    const threshold = 0.15;

    for (let x = 0; x < gridSize.x; x++) {
      for (let y = 0; y < gridSize.y; y++) {
        for (let z = 0; z < gridSize.z; z++) {
          const current = geoData[x][y][z];
          
          if (x < gridSize.x - 1) {
            const diff = Math.abs(current - geoData[x + 1][y][z]);
            if (diff > threshold) {
              stressPoints.push({
                id: uuidv4(),
                position: { x: x + 0.5, y: y + 0.5, z: z + 0.5 },
                densityDiff: diff
              });
              continue;
            }
          }
          
          if (y < gridSize.y - 1) {
            const diff = Math.abs(current - geoData[x][y + 1][z]);
            if (diff > threshold) {
              stressPoints.push({
                id: uuidv4(),
                position: { x: x + 0.5, y: y + 0.5, z: z + 0.5 },
                densityDiff: diff
              });
              continue;
            }
          }
          
          if (z < gridSize.z - 1) {
            const diff = Math.abs(current - geoData[x][y][z + 1]);
            if (diff > threshold) {
              stressPoints.push({
                id: uuidv4(),
                position: { x: x + 0.5, y: y + 0.5, z: z + 0.5 },
                densityDiff: diff
              });
              continue;
            }
          }
        }
      }
    }

    set({ stressPoints: stressPoints.slice(0, 200) });
  },

  resetAll: () => set({
    sliceX: 0,
    sliceY: 0,
    sliceZ: 0,
    annotations: [],
    cameraState: defaultCameraState,
  }),

  setPanelOpen: (open) => set({ isPanelOpen: open }),

  setPresetName: (name) => set({ presetName: name }),
}));

export const getRockInfo = getRockType;
