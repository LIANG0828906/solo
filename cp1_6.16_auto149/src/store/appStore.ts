import { create } from 'zustand';

export type DrawMode = 'gesture' | 'mouse';

export interface FingerPoint {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

interface AppState {
  drawMode: DrawMode;
  isHandDetected: boolean;
  fingerTrajectory: FingerPoint[];
  latestFingerPoint: FingerPoint | null;
  gestureLatency: number;
  fps: number;

  setDrawMode: (mode: DrawMode) => void;
  setHandDetected: (detected: boolean) => void;
  addFingerPoint: (point: FingerPoint) => void;
  clearTrajectory: () => void;
  setGestureLatency: (latency: number) => void;
  setFps: (fps: number) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  drawMode: 'gesture',
  isHandDetected: false,
  fingerTrajectory: [],
  latestFingerPoint: null,
  gestureLatency: 0,
  fps: 60,

  setDrawMode: (mode) => set({ drawMode: mode }),
  setHandDetected: (detected) => set({ isHandDetected: detected }),
  addFingerPoint: (point) => {
    const current = get().fingerTrajectory;
    const updated = [...current, point].slice(-300);
    set({
      fingerTrajectory: updated,
      latestFingerPoint: point
    });
  },
  clearTrajectory: () => set({ fingerTrajectory: [], latestFingerPoint: null }),
  setGestureLatency: (latency) => set({ gestureLatency: latency }),
  setFps: (fps) => set({ fps })
}));
