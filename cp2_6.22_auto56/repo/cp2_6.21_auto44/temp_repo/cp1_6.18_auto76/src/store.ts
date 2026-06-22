import { create } from 'zustand';
import type { BuildingZone } from './types';

interface AppState {
  year: number;
  selectedBuilding: string | null;
  compareYears: number[];
  isDataPanelOpen: boolean;
  hoveredZone: BuildingZone | null;

  setYear: (year: number) => void;
  selectBuilding: (id: string | null) => void;
  toggleCompare: () => void;
  removeCompareYear: (year: number) => void;
  setDataPanelOpen: (open: boolean) => void;
  setHoveredZone: (zone: BuildingZone | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  year: 1900,
  selectedBuilding: null,
  compareYears: [],
  isDataPanelOpen: false,
  hoveredZone: null,

  setYear: (year) => set({ year }),
  selectBuilding: (id) => set({ selectedBuilding: id }),
  toggleCompare: () =>
    set((state) => {
      const year = state.year;
      const exists = state.compareYears.includes(year);
      if (exists) {
        return { compareYears: state.compareYears.filter((y) => y !== year) };
      }
      if (state.compareYears.length >= 2) {
        return { compareYears: [state.compareYears[1], year] };
      }
      return { compareYears: [...state.compareYears, year] };
    }),
  removeCompareYear: (year) =>
    set((state) => ({
      compareYears: state.compareYears.filter((y) => y !== year),
    })),
  setDataPanelOpen: (open) => set({ isDataPanelOpen: open }),
  setHoveredZone: (zone) => set({ hoveredZone: zone }),
}));
