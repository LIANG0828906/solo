import { create } from 'zustand';
import type Earthquake from '@/data/sampleEarthquakeData';
import { earthquakeData } from '@/data/sampleEarthquakeData';

interface EarthquakeState {
  earthquakes: Earthquake[];
  filteredEarthquakes: Earthquake[];
  yearRange: [number, number];
  magnitudeThreshold: number;
  selectedYear: number | null;
  isPlaying: boolean;
  hoveredQuake: Earthquake | null;
}

interface EarthquakeActions {
  setYearRange: (range: [number, number]) => void;
  setMagnitudeThreshold: (threshold: number) => void;
  selectYear: (year: number | null) => void;
  togglePlay: () => void;
  setHoveredQuake: (quake: Earthquake | null) => void;
}

interface EarthquakeStore extends EarthquakeState, EarthquakeActions {}

const filterEarthquakes = (
  earthquakes: Earthquake[],
  yearRange: [number, number],
  magnitudeThreshold: number
): Earthquake[] =>
  earthquakes.filter(
    (e) => e.year >= yearRange[0] && e.year <= yearRange[1] && e.magnitude >= magnitudeThreshold
  );

export const useEarthquakeStore = create<EarthquakeStore>((set) => ({
  earthquakes: earthquakeData,
  filteredEarthquakes: filterEarthquakes(earthquakeData, [1900, 2024], 6.0),
  yearRange: [1900, 2024],
  magnitudeThreshold: 6.0,
  selectedYear: null,
  isPlaying: false,
  hoveredQuake: null,

  setYearRange: (range) =>
    set((state) => ({
      yearRange: range,
      filteredEarthquakes: filterEarthquakes(state.earthquakes, range, state.magnitudeThreshold),
    })),

  setMagnitudeThreshold: (threshold) =>
    set((state) => ({
      magnitudeThreshold: threshold,
      filteredEarthquakes: filterEarthquakes(state.earthquakes, state.yearRange, threshold),
    })),

  selectYear: (year) => set({ selectedYear: year }),

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  setHoveredQuake: (quake) => set({ hoveredQuake: quake }),
}));
