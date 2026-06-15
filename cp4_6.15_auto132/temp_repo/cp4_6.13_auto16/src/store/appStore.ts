import { create } from 'zustand';

interface AppState {
  currentHour: number;
  showHeatmap: boolean;
  showTrails: boolean;
  setCurrentHour: (hour: number) => void;
  toggleHeatmap: () => void;
  toggleTrails: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentHour: 12,
  showHeatmap: false,
  showTrails: false,
  setCurrentHour: (hour: number) => set({ currentHour: hour }),
  toggleHeatmap: () => set((state) => ({ showHeatmap: !state.showHeatmap })),
  toggleTrails: () => set((state) => ({ showTrails: !state.showTrails }))
}));
