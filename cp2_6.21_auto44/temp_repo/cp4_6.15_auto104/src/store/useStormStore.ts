import { create } from 'zustand';
import { filterStorms, getYearRange } from '@/data/stormDataLoader';
import type { FilterState, StormRecord } from '@/data/types';

interface StormStore {
  yearRange: [number, number];
  category: number | null;
  basin: string | null;
  selectedStormId: string | null;
  isPlaying: boolean;
  playbackYear: number;
  playbackSpeed: number;
  playIntervalId: ReturnType<typeof setInterval> | null;
  setYearRange: (range: [number, number]) => void;
  setCategory: (cat: number | null) => void;
  setBasin: (basin: string | null) => void;
  selectStorm: (id: string | null) => void;
  getFilteredStorms: () => StormRecord[];
  setPlaybackYear: (year: number) => void;
  togglePlay: () => void;
  startPlayback: () => void;
  stopPlayback: () => void;
  setPlaybackSpeed: (speed: number) => void;
}

const [minYear, maxYear] = getYearRange();

export const useStormStore = create<StormStore>((set, get) => ({
  yearRange: [minYear, maxYear],
  category: null,
  basin: null,
  selectedStormId: null,
  isPlaying: false,
  playbackYear: minYear,
  playbackSpeed: 500,
  playIntervalId: null,

  setYearRange: (range) => set({ yearRange: range }),
  setCategory: (cat) => set({ category: cat }),
  setBasin: (basin) => set({ basin }),
  selectStorm: (id) => set({ selectedStormId: id }),

  getFilteredStorms: () => {
    const state = get();
    const filters: FilterState = {
      yearRange: state.yearRange,
      category: state.category,
      basin: state.basin,
    };
    return filterStorms(filters);
  },

  setPlaybackYear: (year) => {
    const clampedYear = Math.max(minYear, Math.min(maxYear, year));
    set({
      playbackYear: clampedYear,
      yearRange: [minYear, clampedYear],
    });
    if (get().isPlaying && clampedYear >= maxYear) {
      get().stopPlayback();
    }
  },

  togglePlay: () => {
    if (get().isPlaying) {
      get().stopPlayback();
    } else {
      get().startPlayback();
    }
  },

  startPlayback: () => {
    const state = get();
    if (state.isPlaying) return;

    let currentYear = state.playbackYear >= maxYear ? minYear : state.playbackYear;
    set({
      isPlaying: true,
      playbackYear: currentYear,
      yearRange: [minYear, currentYear],
    });

    const intervalId = setInterval(() => {
      const s = get();
      if (!s.isPlaying) {
        clearInterval(intervalId);
        return;
      }
      currentYear += 1;
      if (currentYear > maxYear) {
        currentYear = minYear;
      }
      set({
        playbackYear: currentYear,
        yearRange: [minYear, currentYear],
      });
    }, state.playbackSpeed);

    set({ playIntervalId: intervalId });
  },

  stopPlayback: () => {
    const state = get();
    if (state.playIntervalId !== null) {
      clearInterval(state.playIntervalId);
    }
    set({ isPlaying: false, playIntervalId: null });
  },

  setPlaybackSpeed: (speed) => {
    set({ playbackSpeed: speed });
    if (get().isPlaying) {
      get().stopPlayback();
      get().startPlayback();
    }
  },
}));
