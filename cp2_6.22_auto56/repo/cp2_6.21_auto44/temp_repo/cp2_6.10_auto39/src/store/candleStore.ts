import { create } from 'zustand';
import { CandleState, Position3D } from '../types';

const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

export const useCandleStore = create<CandleState>((set, get) => ({
  position: { x: 0, y: 0.5, z: 1 },
  height: 0.5,

  setPosition: (x: number, y: number, z: number) => {
    const clampedX = clamp(x, -1.2, 1.2);
    const clampedZ = clamp(z, -1.2, 1.2);
    set({ position: { x: clampedX, y, z: clampedZ } });
  },

  setHeight: (height: number) => {
    const clampedHeight = clamp(height, 0.3, 1.2);
    set({ height: clampedHeight });
  },

  getLightIntensity: () => {
    const { height } = get();
    const normalizedHeight = (height - 0.3) / (1.2 - 0.3);
    return 0.5 + normalizedHeight * 1.5;
  },
}));
