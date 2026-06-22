import { create } from 'zustand';
import type { Particle } from '../modules/data/ParticleGenerator';

export type AnimationPhase = 'idle' | 'explosion' | 'expanding' | 'stable';

interface UniverseState {
  initialParticles: Particle[];
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
  setInitialParticles: (particles: Particle[]) => void;
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
  setIsMobile: (mobile: boolean) => void;
  particleMatchesFilter: (particle: Particle) => boolean;
}

export const useUniverseStore = create<UniverseState & UniverseActions>((set, get) => ({
  initialParticles: [],
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

  setInitialParticles: (particles) => set({ initialParticles: particles }),

  setTimeProgress: (progress) => set({ timeProgress: progress }),

  setAnimationPhase: (phase) => set({ animationPhase: phase }),

  setAnimationTime: (time) => set({ animationTime: time }),

  setFilters: (newFilters) => {
    const prev = get().filters;
    const next = { ...prev, ...newFilters };
    console.log(
      `[Cosmos] Filter changed: z=[${next.redshiftMin.toFixed(2)},${next.redshiftMax.toFixed(2)}], m=[${next.massMin.toFixed(2)},${next.massMax.toFixed(2)}]`
    );
    set({ filters: next });
  },

  selectParticle: (id) => {
    if (id === null) {
      set({ selectedParticleIds: [] });
    } else {
      set({ selectedParticleIds: [id] });
      const p = get().initialParticles.find((x) => x.id === id);
      if (p) {
        console.log(`[Cosmos] Selected particle: ${p.id.slice(0, 8)} z=${p.redshift.toFixed(3)}`);
      }
    }
  },

  selectParticlesInBox: (ids) => {
    console.log(`[Cosmos] Box selected ${ids.length} particles`);
    set({ selectedParticleIds: ids });
  },

  clearSelection: () => set({ selectedParticleIds: [] }),

  setBoxSelection: (box) => set({ boxSelection: box }),

  setIsBoxSelecting: (selecting) => set({ isBoxSelecting: selecting }),

  togglePanel: () => set((state) => ({ panelExpanded: !state.panelExpanded })),

  setPanelExpanded: (expanded) => set({ panelExpanded: expanded }),

  particleMatchesFilter: (particle) => {
    const { filters } = get();
    return (
      particle.redshift >= filters.redshiftMin &&
      particle.redshift <= filters.redshiftMax &&
      particle.mass >= filters.massMin &&
      particle.mass <= filters.massMax
    );
  },

  setIsMobile: (mobile) => {
    set({ isMobile: mobile, panelExpanded: !mobile });
  },
}));

export const useSelectedParticles = (): Particle[] => {
  const { initialParticles, selectedParticleIds } = useUniverseStore();
  return selectedParticleIds
    .map((id) => initialParticles.find((p) => p.id === id))
    .filter((p): p is Particle => p !== undefined);
};

export const useInitialParticlesCount = () => {
  return useUniverseStore((s) => s.initialParticles.length);
};
