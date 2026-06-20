import { create } from 'zustand';
import { AppState, ViewMode, PanelData } from '../types';

export const useAppStore = create<AppState>((set) => ({
  mode: 'armillary',
  mix: 0.5,
  isEclipsing: false,
  panelData: null,

  setMode: (mode: ViewMode) => set({ mode }),
  setMix: (mix: number) => set({ mix }),
  setEclipsing: (isEclipsing: boolean) => set({ isEclipsing }),
  openPanel: (panelData: PanelData) => set({ panelData }),
  closePanel: () => set({ panelData: null }),
}));
