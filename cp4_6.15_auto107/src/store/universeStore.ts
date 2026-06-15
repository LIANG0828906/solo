import { create } from 'zustand';
import type { Particle } from '../modules/data/ParticleGenerator';
import { filterParticles } from '../modules/data/ParticleGenerator';

export type AnimationPhase = 'idle' | 'explosion' | 'expanding' | 'stable';

interface UniverseState {
  particles: Particle[];
  timeProgress: number;
  animationPhase: AnimationPhase;
  animationTime: number;
  filters: {
    redshiftMin: number;
    redshiftMax: number;
    massMin: number;
    massMax: number;
  };
  selectedParticleIds: string[];
  isBoxSelecting: boolean;
  boxSelection: {
    start: { x: number; y: number } | null;
    end: { x: number; y: number } | null;
  };
  panelExpanded: boolean;
  isMobile: boolean;
}

interface UniverseActions {
  setParticles: (particles: Particle[]) => void;
  updateParticles: (particles: Particle[]) => void;
  setTimeProgress: (progress: number) => void;
  setAnimationPhase: (phase: AnimationPhase) => void;
  setAnimationTime: (time: number) => void;
  setFilters: (filters: Partial<UniverseState['filters']>) => void;
  selectParticle: (id: string | null) => void;
  selectParticlesInBox: (ids: string[]) => void;
  clearSelection: () => void;
  setBoxSelection: (box: UniverseState['boxSelection']) => void;
  setIsBoxSelecting: (selecting: boolean) => void;
  togglePanel: () => void;
  setPanelExpanded: (expanded: boolean) => void;
  applyFilters: () => void;
  setIsMobile: (mobile: boolean) => void;
}

export const useUniverseStore = create<UniverseState & UniverseActions>((set, get) => ({
  particles: [],
  timeProgress: 0,
  animationPhase: 'idle',
  animationTime: 0,
  filters: {
    redshiftMin: -1,
    redshiftMax: 1,
    massMin: 0.5,
    massMax: 2,
  },
  selectedParticleIds: [],
  isBoxSelecting: false,
  boxSelection: {
    start: null,
    end: null,
  },
  panelExpanded: true,
  isMobile: false,

  setParticles: (particles) => set({ particles }),
  
  updateParticles: (particles) => set({ particles }),

  setTimeProgress: (progress) => set({ timeProgress: progress }),

  setAnimationPhase: (phase) => set({ animationPhase: phase }),

  setAnimationTime: (time) => set({ animationTime: time }),

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
    get().applyFilters();
  },

  selectParticle: (id) => {
    if (id === null) {
      set({ selectedParticleIds: [] });
    } else {
      set({ selectedParticleIds: [id] });
    }
  },

  selectParticlesInBox: (ids) => set({ selectedParticleIds: ids }),

  clearSelection: () => set({ selectedParticleIds: [] }),

  setBoxSelection: (box) => set({ boxSelection: box }),

  setIsBoxSelecting: (selecting) => set({ isBoxSelecting: selecting }),

  togglePanel: () => set((state) => ({ panelExpanded: !state.panelExpanded })),

  setPanelExpanded: (expanded) => set({ panelExpanded: expanded }),

  applyFilters: () => {
    const { particles, filters } = get();
    const filtered = filterParticles(particles, filters);
    set({ particles: filtered });
  },

  setIsMobile: (mobile) => {
    set({ isMobile: mobile, panelExpanded: !mobile });
  },
}));

export const useSelectedParticles = () => {
  const { particles, selectedParticleIds } = useUniverseStore();
  return selectedParticleIds
    .map((id) => particles.find((p) => p.id === id))
    .filter((p): p is Particle => p !== undefined);
};

export const useVisibleParticles = () => {
  const { particles } = useUniverseStore();
  return particles.filter((p) => p.visible && p.opacity > 0);
};
