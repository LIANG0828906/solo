import { create } from 'zustand';
import { TrajectoryData } from './types';

interface GestureStore {
  trajectories: TrajectoryData[];
  activeTrajectoryId: string | null;
  isDrawing: boolean;
  curvatureThreshold: number;
  panelCollapsed: boolean;
  addTrajectory: (trajectory: TrajectoryData) => void;
  removeTrajectory: (id: string) => void;
  setFadingOut: (id: string) => void;
  setActiveTrajectoryId: (id: string | null) => void;
  setIsDrawing: (drawing: boolean) => void;
  setCurvatureThreshold: (threshold: number) => void;
  setPanelCollapsed: (collapsed: boolean) => void;
  clearAll: () => void;
  updateTrajectory: (id: string, updates: Partial<TrajectoryData>) => void;
}

const MAX_TRAJECTORIES = 5;

export const useGestureStore = create<GestureStore>((set, get) => ({
  trajectories: [],
  activeTrajectoryId: null,
  isDrawing: false,
  curvatureThreshold: 1.0,
  panelCollapsed: false,

  addTrajectory: (trajectory) => {
    const { trajectories } = get();
    let updated = [...trajectories, trajectory];
    while (updated.length > MAX_TRAJECTORIES) {
      const oldest = updated[0];
      updated = updated.slice(1);
      set({ trajectories: updated.map(t => t.id === oldest.id ? { ...t, fadingOut: true, fadeStartTime: Date.now() } : t) });
      setTimeout(() => {
        get().removeTrajectory(oldest.id);
      }, 1000);
      updated = updated.slice(1);
    }
    set({ trajectories: updated });
  },

  removeTrajectory: (id) => {
    set({ trajectories: get().trajectories.filter(t => t.id !== id) });
  },

  setFadingOut: (id) => {
    set({
      trajectories: get().trajectories.map(t =>
        t.id === id ? { ...t, fadingOut: true, fadeStartTime: Date.now() } : t
      ),
    });
  },

  setActiveTrajectoryId: (id) => set({ activeTrajectoryId: id }),
  setIsDrawing: (drawing) => set({ isDrawing: drawing }),
  setCurvatureThreshold: (threshold) => set({ curvatureThreshold: threshold }),
  setPanelCollapsed: (collapsed) => set({ panelCollapsed: collapsed }),

  clearAll: () => set({
    trajectories: [],
    activeTrajectoryId: null,
    isDrawing: false,
  }),

  updateTrajectory: (id, updates) => {
    set({
      trajectories: get().trajectories.map(t =>
        t.id === id ? { ...t, ...updates } : t
      ),
    });
  },
}));
