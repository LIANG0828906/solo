import { create } from 'zustand';
import type { Season, OceanCurrent } from './oceanCurrents';
import { getSeasonalCurrents, getAllCurrentIds } from './oceanCurrents';

interface AppState {
  season: Season;
  previousSeason: Season;
  visibleCurrents: string[];
  particleSpeed: number;
  highlightedCurrent: string | null;
  isTransitioning: boolean;
  transitionProgress: number;

  readonly activeSeasonalCurrentIds: string[];
  readonly previousSeasonalCurrentIds: string[];

  setSeason: (season: string) => void;
  toggleCurrent: (id: string) => void;
  setParticleSpeed: (speed: number) => void;
  setHighlightedCurrent: (id: string | null) => void;
  startTransition: () => void;
  updateTransitionProgress: (progress: number) => void;
  endTransition: () => void;

  lerpTemperature: (prevTemp: number, nextTemp: number, progress: number) => number;
  getSeasonalOpacity: (currentId: string, progress: number) => number;
}

const allCurrentIds = getAllCurrentIds();

function computeSeasonalCurrentIds(season: Season): string[] {
  return getSeasonalCurrents(season).map((c: OceanCurrent) => c.id);
}

export const useAppStore = create<AppState>((set, get) => {
  const state: AppState = {
    season: 'spring',
    previousSeason: 'spring',
    visibleCurrents: allCurrentIds,
    particleSpeed: 2,
    highlightedCurrent: null,
    isTransitioning: false,
    transitionProgress: 0,

    get activeSeasonalCurrentIds(): string[] {
      return computeSeasonalCurrentIds(get().season);
    },

    get previousSeasonalCurrentIds(): string[] {
      return computeSeasonalCurrentIds(get().previousSeason);
    },

    setSeason: (season: string) =>
      set((state) => {
        const newSeason = season as Season;
        if (state.season === newSeason) {
          return {};
        }
        const partial = {
          previousSeason: state.season,
          season: newSeason,
        };
        queueMicrotask(() => {
          get().startTransition();
        });
        return partial;
      }),

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
      set((state) => ({
        highlightedCurrent: state.highlightedCurrent === id ? null : id,
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

    lerpTemperature: (prevTemp: number, nextTemp: number, progress: number): number => {
      const p = Math.max(0, Math.min(1, progress));
      return prevTemp + (nextTemp - prevTemp) * p;
    },

    getSeasonalOpacity: (currentId: string, progress: number): number => {
      const p = Math.max(0, Math.min(1, progress));
      const { activeSeasonalCurrentIds, previousSeasonalCurrentIds } = get();
      const inActive = activeSeasonalCurrentIds.includes(currentId);
      const inPrevious = previousSeasonalCurrentIds.includes(currentId);

      if (inActive && inPrevious) {
        return 1;
      }
      if (inActive && !inPrevious) {
        return p;
      }
      if (!inActive && inPrevious) {
        return 1 - p;
      }
      return 0;
    },
  };

  return state;
});
