import { create } from 'zustand';
import type { Genotype, GenerationSnapshot, PopulationStats } from './EvolutionEngine';
import { EvolutionEngine } from './EvolutionEngine';

interface EvolutionState {
  engine: EvolutionEngine | null;
  currentGeneration: number;
  maxGenerations: number;
  population: Genotype[];
  populationStats: PopulationStats;
  history: GenerationSnapshot[];
  selectedIndividualId: string | null;
  selectionPressure: number;
  mutationRate: number;
  generationSpeed: number;
  isEvolving: boolean;
  viewedGeneration: number;
  jumpLine: { from: number; to: number } | null;
  mutationAlert: { id: string; visible: boolean } | null;
  transitionProgress: number;

  initEngine: () => void;
  startEvolution: () => void;
  pauseEvolution: () => void;
  resetEvolution: () => void;
  nextGeneration: () => void;
  selectIndividual: (id: string | null) => void;
  setSelectionPressure: (pressure: number) => void;
  setMutationRate: (rate: number) => void;
  setGenerationSpeed: (speed: number) => void;
  jumpToGeneration: (generation: number) => void;
  clearJumpLine: () => void;
  showMutationAlert: (id: string) => void;
  hideMutationAlert: () => void;
  getSelectedIndividual: () => Genotype | undefined;
  getViewedSnapshot: () => GenerationSnapshot | undefined;
}

const initialStats: PopulationStats = {
  mean: [0, 0, 0, 0, 0, 0, 0, 0],
  std: [0, 0, 0, 0, 0, 0, 0, 0],
  max: [0, 0, 0, 0, 0, 0, 0, 0],
  min: [0, 0, 0, 0, 0, 0, 0, 0],
};

export const useEvolutionStore = create<EvolutionState>((set, get) => ({
  engine: null,
  currentGeneration: 0,
  maxGenerations: 20,
  population: [],
  populationStats: initialStats,
  history: [],
  selectedIndividualId: null,
  selectionPressure: 0.3,
  mutationRate: 0.05,
  generationSpeed: 1.0,
  isEvolving: false,
  viewedGeneration: 0,
  jumpLine: null,
  mutationAlert: null,
  transitionProgress: 1,

  initEngine: () => {
    const engine = new EvolutionEngine(
      get().selectionPressure,
      get().mutationRate
    );

    const population = engine.initializePopulation();
    const stats = engine.calculatePopulationStats(population);
    const positions = engine.calculateCircularPositions(10);

    const snapshot: GenerationSnapshot = {
      generation: 1,
      population: [...population],
      stats,
      positions,
      mutationEvents: [],
    };

    set({
      engine,
      currentGeneration: 1,
      maxGenerations: engine.getMaxGenerations(),
      population,
      populationStats: stats,
      history: [snapshot],
      viewedGeneration: 1,
    });
  },

  startEvolution: () => {
    set({ isEvolving: true });
  },

  pauseEvolution: () => {
    set({ isEvolving: false });
  },

  resetEvolution: () => {
    const state = get();
    if (!state.engine) return;

    state.engine.setSelectionPressure(state.selectionPressure);
    state.engine.setMutationRate(state.mutationRate);

    const population = state.engine.initializePopulation();
    const stats = state.engine.calculatePopulationStats(population);
    const positions = state.engine.calculateCircularPositions(10);

    const snapshot: GenerationSnapshot = {
      generation: 1,
      population: [...population],
      stats,
      positions,
      mutationEvents: [],
    };

    set({
      currentGeneration: 1,
      population,
      populationStats: stats,
      history: [snapshot],
      selectedIndividualId: null,
      isEvolving: false,
      viewedGeneration: 1,
      jumpLine: null,
      mutationAlert: null,
    });
  },

  nextGeneration: () => {
    const state = get();
    if (!state.engine || state.currentGeneration >= state.maxGenerations) {
      set({ isEvolving: false });
      return;
    }

    const result = state.engine.generateNextGeneration();
    const positions = state.engine.calculateCircularPositions(10);

    const snapshot: GenerationSnapshot = {
      generation: result.generation,
      population: [...result.population],
      stats: result.stats,
      positions,
      mutationEvents: result.mutationEvents,
    };

    const newHistory = [...state.history, snapshot];

    if (result.mutationEvents.length > 0) {
      for (const id of result.mutationEvents) {
        setTimeout(() => {
          get().showMutationAlert(id);
        }, 100);
      }
    }

    set({
      currentGeneration: result.generation,
      population: result.population,
      populationStats: result.stats,
      history: newHistory,
      viewedGeneration: result.generation,
      transitionProgress: 0,
      isEvolving: !result.isComplete,
    });
  },

  selectIndividual: (id: string | null) => {
    set({ selectedIndividualId: id });
  },

  setSelectionPressure: (pressure: number) => {
    const clampedPressure = Math.max(0.1, Math.min(1.0, pressure));
    const state = get();
    if (state.engine) {
      state.engine.setSelectionPressure(clampedPressure);
    }
    set({ selectionPressure: clampedPressure });
  },

  setMutationRate: (rate: number) => {
    const clampedRate = Math.max(0.01, Math.min(0.2, rate));
    const state = get();
    if (state.engine) {
      state.engine.setMutationRate(clampedRate);
    }
    set({ mutationRate: clampedRate });
  },

  setGenerationSpeed: (speed: number) => {
    set({ generationSpeed: Math.max(0.1, Math.min(3.0, speed)) });
  },

  jumpToGeneration: (generation: number) => {
    const state = get();
    if (generation < 1 || generation > state.history.length) return;

    const snapshot = state.history[generation - 1];
    if (!snapshot) return;

    set({
      population: snapshot.population,
      populationStats: snapshot.stats,
      viewedGeneration: generation,
      jumpLine: {
        from: state.currentGeneration,
        to: generation,
      },
      selectedIndividualId: null,
      transitionProgress: 0,
    });
  },

  clearJumpLine: () => {
    set({ jumpLine: null });
  },

  showMutationAlert: (id: string) => {
    set({ mutationAlert: { id, visible: true } });
    setTimeout(() => {
      get().hideMutationAlert();
    }, 2500);
  },

  hideMutationAlert: () => {
    set({ mutationAlert: null });
  },

  getSelectedIndividual: () => {
    const state = get();
    if (!state.selectedIndividualId) return undefined;
    return state.population.find((ind) => ind.id === state.selectedIndividualId);
  },

  getViewedSnapshot: () => {
    const state = get();
    return state.history[state.viewedGeneration - 1];
  },
}));
