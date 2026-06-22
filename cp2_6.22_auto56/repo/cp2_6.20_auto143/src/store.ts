import { create } from "zustand";
import type { Season } from "./oceanCurrents";
import {
  getMainCurrents,
  getSeasonalCurrents,
} from "./oceanCurrents";
import { getTemperatureGrid } from "./temperatureGrid";
import type { OceanCurrent } from "./oceanCurrents";
import type { TemperaturePoint } from "./temperatureGrid";

export interface StoreState {
  season: Season;
  previousSeason: Season;
  seasonChangeAt: number;
  particleSpeed: number;
  visibleCurrents: Record<string, boolean>;
  highlightCurrent: string | null;
  cameraZoom: number;
  mainCurrents: OceanCurrent[];
  seasonalCurrents: OceanCurrent[];
  temperatureGrid: TemperaturePoint[];
  prevTemperatureGrid: TemperaturePoint[];
  prevSeasonalCurrents: OceanCurrent[];

  setSeason: (s: Season) => void;
  setParticleSpeed: (v: number) => void;
  toggleCurrent: (id: string) => void;
  setHighlightCurrent: (id: string | null) => void;
  setCameraZoom: (z: number) => void;
}

const initialSeason: Season = "summer";
const main = getMainCurrents();
const seasonal = getSeasonalCurrents(initialSeason);
const tempGrid = getTemperatureGrid(initialSeason);

const initVisible: Record<string, boolean> = {};
[...main, ...seasonal].forEach((c) => {
  initVisible[c.id] = true;
});

export const useStore = create<StoreState>((set, get) => ({
  season: initialSeason,
  previousSeason: initialSeason,
  seasonChangeAt: 0,
  particleSpeed: 2.5,
  visibleCurrents: initVisible,
  highlightCurrent: null,
  cameraZoom: 1,
  mainCurrents: main,
  seasonalCurrents: seasonal,
  prevSeasonalCurrents: seasonal,
  temperatureGrid: tempGrid,
  prevTemperatureGrid: tempGrid,

  setSeason: (s: Season) => {
    const current = get();
    if (current.season === s) return;
    const newSeasonal = getSeasonalCurrents(s);
    const newGrid = getTemperatureGrid(s);

    const newVisible: Record<string, boolean> = { ...current.visibleCurrents };
    newSeasonal.forEach((c) => {
      if (!(c.id in newVisible)) newVisible[c.id] = true;
    });

    set({
      previousSeason: current.season,
      season: s,
      seasonChangeAt: performance.now(),
      prevSeasonalCurrents: current.seasonalCurrents,
      seasonalCurrents: newSeasonal,
      prevTemperatureGrid: current.temperatureGrid,
      temperatureGrid: newGrid,
      visibleCurrents: newVisible,
    });
  },

  setParticleSpeed: (v: number) => set({ particleSpeed: Math.max(1, Math.min(5, v)) }),

  toggleCurrent: (id: string) =>
    set((s) => ({
      visibleCurrents: { ...s.visibleCurrents, [id]: !s.visibleCurrents[id] },
    })),

  setHighlightCurrent: (id: string | null) => set({ highlightCurrent: id }),

  setCameraZoom: (z: number) => set({ cameraZoom: z }),
}));
