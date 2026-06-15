import { create } from 'zustand';
import { filterStorms, getYearRange } from '@/data/stormDataLoader';
import type { FilterState, StormRecord } from '@/data/types';

interface PlaybackState {
  isPlaying: boolean;
  playbackYear: number;
  playbackSpeed: number;
  playIntervalId: number | null;
}

interface StormStore extends FilterState, PlaybackState {
  selectedStormId: string | null;
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
  playbackSpeed: 300,
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
    set({ playbackYear: clampedYear });
    const state = get();
    if (state.isPlaying && clampedYear >= maxYear) {
      get().stopPlayback();
    }
  },

  togglePlay: () => {
    const state = get();
    if (state.isPlaying) {
      get().stopPlayback();
    } else {
      get().startPlayback();
    }
  },

  startPlayback: () => {
    const state = get();
    if (state.isPlaying) return;

    let currentYear = state.playbackYear >= maxYear ? minYear : state.playbackYear;
    set({ isPlaying: true, playbackYear: currentYear });

    const intervalId = window.setInterval(() => {
      const s = get();
      if (!s.isPlaying) {
        clearInterval(intervalId);
        return;
      }
      currentYear += 1;
      if (currentYear > maxYear) {
        currentYear = minYear;
      }
      set({ playbackYear: currentYear });
    }, state.playbackSpeed);

    set({ playIntervalId: intervalId });
  },

  stopPlayback: () => {
    const state = get();
    if (state.playIntervalId !== null) {
      clearInterval(state.playIntervalId);
      set({ playIntervalId: null });
    }
    set({ isPlaying: false });
  },

  setPlaybackSpeed: (speed) => {
    set({ playbackSpeed: speed });
    const state = get();
    if (state.isPlaying) {
      get().stopPlayback();
      get().startPlayback();
    }
  },
}));
