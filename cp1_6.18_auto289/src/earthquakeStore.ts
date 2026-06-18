import { create } from 'zustand';
import {
  EarthquakeData,
  generateEarthquakeData,
  TIMELINE_START,
  TIMELINE_END,
} from './utils';

interface EarthquakeStore {
  earthquakes: EarthquakeData[];
  startTime: number;
  endTime: number;
  selectedId: number | null;
  hoveredId: number | null;
  setTimeRange: (start: number, end: number) => void;
  setSelected: (id: number | null) => void;
  setHovered: (id: number | null) => void;
  getFilteredEarthquakes: () => EarthquakeData[];
}

export const useEarthquakeStore = create<EarthquakeStore>((set, get) => ({
  earthquakes: generateEarthquakeData(500),
  startTime: TIMELINE_START,
  endTime: TIMELINE_END,
  selectedId: null,
  hoveredId: null,

  setTimeRange: (start: number, end: number) => {
    set({ startTime: start, endTime: end });
  },

  setSelected: (id: number | null) => {
    set({ selectedId: id });
  },

  setHovered: (id: number | null) => {
    set({ hoveredId: id });
  },

  getFilteredEarthquakes: () => {
    const { earthquakes, startTime, endTime } = get();
    return earthquakes.filter(
      (eq) => eq.timestamp >= startTime && eq.timestamp <= endTime
    );
  },
}));
