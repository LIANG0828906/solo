import { create } from 'zustand';

export interface MoleculeState {
  currentMoleculeId: string;
  cameraDistance: number;
  rotationY: number;
  rotationX: number;
  showLabels: boolean;
  autoRotate: boolean;
  setCurrentMolecule: (id: string) => void;
  setCameraDistance: (distance: number) => void;
  setRotationY: (angle: number) => void;
  setRotationX: (angle: number) => void;
  toggleLabels: () => void;
  toggleAutoRotate: () => void;
  resetView: () => void;
}

const DEFAULT_STATE = {
  currentMoleculeId: 'water',
  cameraDistance: 10,
  rotationY: 0,
  rotationX: 0,
  showLabels: true,
  autoRotate: true,
};

export const useMoleculeStore = create<MoleculeState>((set) => ({
  ...DEFAULT_STATE,

  setCurrentMolecule: (id: string) => set({ currentMoleculeId: id }),

  setCameraDistance: (distance: number) =>
    set({ cameraDistance: Math.max(5, Math.min(20, distance)) }),

  setRotationY: (angle: number) =>
    set({ rotationY: ((angle % 360) + 360) % 360 }),

  setRotationX: (angle: number) =>
    set({ rotationX: Math.max(-90, Math.min(90, angle)) }),

  toggleLabels: () => set((state) => ({ showLabels: !state.showLabels })),

  toggleAutoRotate: () => set((state) => ({ autoRotate: !state.autoRotate })),

  resetView: () =>
    set({
      cameraDistance: DEFAULT_STATE.cameraDistance,
      rotationY: DEFAULT_STATE.rotationY,
      rotationX: DEFAULT_STATE.rotationX,
    }),
}));
