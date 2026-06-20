import { create } from 'zustand';
import type { Season } from './oceanCurrents';
import { getAllCurrentIds } from './oceanCurrents';

interface AppState {
  season: Season;
  previousSeason: Season;
  visibleCurrents: string[];
  particleSpeed: number;
  highlightedCurrent: string | null;
  isTransitioning: boolean;
  transitionProgress: number;

  setSeason: (season: string) => void;
  toggleCurrent: (id: string) => void;
  setParticleSpeed: (speed: number) => void;
  setHighlightedCurrent: (id: string | null) => void;
  startTransition: () => void;
  updateTransitionProgress: (progress: number) => void;
  endTransition: () => void;
}

const allCurrentIds = getAllCurrentIds();

export const useAppStore = create<AppState>((set) => ({
  season: 'spring',
  previousSeason: 'spring',
  visibleCurrents: allCurrentIds,
  particleSpeed: 2,
  highlightedCurrent: null,
  isTransitioning: false,
  transitionProgress: 0,

  setSeason: (season: string) =>
    set((state) => ({
      previousSeason: state.season,
      season: season as Season,
    })),

  toggleCurrent: (id: string) =>
    set((state) => ({
      visibleCurrents: state.visibleCurrents.includes(id)
        ? state.visibleCurrents.filter((currentId) => currentId !== id)
        : [...state.visibleCurrents, id],
    })),

  setParticleSpeed: (speed: number) =>
    set(() => ({
      particleSpeed: Math.max(1, Math.min(5, speed)),
    })),

  setHighlightedCurrent: (id: string | null) =>
    set(() => ({
      highlightedCurrent: id,
    })),

  startTransition: () =>
    set(() => ({
      isTransitioning: true,
      transitionProgress: 0,
    })),

  updateTransitionProgress: (progress: number) =>
    set(() => ({
      transitionProgress: Math.max(0, Math.min(1, progress)),
    })),

  endTransition: () =>
    set(() => ({
      isTransitioning: false,
      transitionProgress: 0,
    })),
}));
