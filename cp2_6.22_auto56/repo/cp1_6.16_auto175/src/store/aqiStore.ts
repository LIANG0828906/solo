import { create } from 'zustand';
import type { CityAQI, ViewMode, PerspectivePreset } from '../types';

interface AQIStore {
  cities: CityAQI[];
  currentYear: number;
  viewMode: ViewMode;
  selectedCityId: string | null;
  hoveredCityId: string | null;
  pulseRipples: { id: string; position: [number, number, number]; createdAt: number }[];

  setCities: (cities: CityAQI[]) => void;
  setYear: (year: number) => void;
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
  setSelectedCity: (id: string | null) => void;
  setHoveredCity: (id: string | null) => void;
  addPulseRipple: (position: [number, number, number]) => void;
  removePulseRipple: (id: string) => void;

  perspectivePresets: PerspectivePreset[];
  activePreset: string | null;
  setActivePreset: (name: string | null) => void;
}

export const useAQIStore = create<AQIStore>((set, get) => ({
  cities: [],
  currentYear: 2023,
  viewMode: 'bars',
  selectedCityId: null,
  hoveredCityId: null,
  pulseRipples: [],

  setCities: (cities) => set({ cities }),
  setYear: (year) => set({ currentYear: Math.max(2014, Math.min(2023, year)) }),
  setViewMode: (mode) => set({ viewMode: mode }),
  toggleViewMode: () =>
    set((state) => ({ viewMode: state.viewMode === 'bars' ? 'heatmap' : 'bars' })),
  setSelectedCity: (id) => set({ selectedCityId: id }),
  setHoveredCity: (id) => set({ hoveredCityId: id }),
  addPulseRipple: (position) => {
    const id = `ripple-${Date.now()}-${Math.random()}`;
    set((state) => ({
      pulseRipples: [...state.pulseRipples, { id, position, createdAt: Date.now() }],
    }));
    setTimeout(() => {
      get().removePulseRipple(id);
    }, 400);
  },
  removePulseRipple: (id) =>
    set((state) => ({
      pulseRipples: state.pulseRipples.filter((r) => r.id !== id),
    })),

  perspectivePresets: [
    { name: '全球视角', position: [0, 0, 15], target: [0, 0, 0] },
    { name: '亚洲视角', position: [8, 5, 8], target: [2, 1, 2] },
    { name: '欧洲视角', position: [-5, 4, 8], target: [-1, 1, 0] },
  ],
  activePreset: '全球视角',
  setActivePreset: (name) => set({ activePreset: name }),
}));
