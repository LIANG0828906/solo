import { create } from 'zustand';
import { AppState, StarTrail } from '../types';

const TRAIL_DURATION = 15000;

export const useAppStore = create<AppState>((set, get) => ({
  selectedRing: null,
  highlightedStarId: null,
  timeAcceleration: 1,
  starTrails: [],

  setSelectedRing: (ring: string | null) => {
    set({ selectedRing: ring });
  },

  setHighlightedStar: (starId: number | null) => {
    const { addStarTrail, removeStarTrail, starTrails } = get();
    
    if (starId !== null) {
      const existingTrail = starTrails.find(t => t.starId === starId);
      if (!existingTrail) {
        addStarTrail({
          starId,
          points: [],
          createdAt: Date.now()
        });
      } else {
        existingTrail.createdAt = Date.now();
        set({ starTrails: [...starTrails] });
      }
      
      setTimeout(() => {
        removeStarTrail(starId);
        if (get().highlightedStarId === starId) {
          set({ highlightedStarId: null });
        }
      }, TRAIL_DURATION);
    }
    
    set({ highlightedStarId: starId });
  },

  setTimeAcceleration: (factor: number) => {
    set({ timeAcceleration: Math.max(1, Math.min(10, factor)) });
  },

  addStarTrail: (trail: StarTrail) => {
    set((state) => ({
      starTrails: [...state.starTrails.filter(t => t.starId !== trail.starId), trail]
    }));
  },

  removeStarTrail: (starId: number) => {
    set((state) => ({
      starTrails: state.starTrails.filter(t => t.starId !== starId)
    }));
  },

  clearExpiredTrails: () => {
    const now = Date.now();
    set((state) => ({
      starTrails: state.starTrails.filter(t => now - t.createdAt < TRAIL_DURATION),
      highlightedStarId: state.highlightedStarId !== null && 
        state.starTrails.find(t => t.starId === state.highlightedStarId && now - t.createdAt >= TRAIL_DURATION)
          ? null
          : state.highlightedStarId
    }));
  }
}));
