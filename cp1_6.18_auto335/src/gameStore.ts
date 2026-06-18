import { create } from 'zustand';
import type { GameState, GameStoreActions, ReactionType } from './types';
import {
  initializeGrid,
  countMolecules,
  calculateEquilibriumConstant,
  calculateRateStatus,
  completeForwardReaction,
  completeReverseReaction,
  processReactionTick,
} from './reactionEngine';

const initialGrid = initializeGrid();
const initialCounts = countMolecules(initialGrid.molecules);
const initialRate = calculateRateStatus(initialCounts.C);

const useGameStore = create<GameState & GameStoreActions>((set, get) => ({
  grid: initialGrid,
  counts: initialCounts,
  rateStatus: initialRate.status,
  equilibriumConstant: calculateEquilibriumConstant(initialCounts),
  lastReaction: { type: 'none', timestamp: null },
  reactionInterval: initialRate.interval,

  moveAtom: (id: string, newX: number, newY: number) => {
    set((state) => {
      const newMolecules = state.grid.molecules.map((mol) =>
        mol.id === id ? { ...mol, x: newX, y: newY } : mol
      );
      const newGrid = { ...state.grid, molecules: newMolecules };
      const newCounts = countMolecules(newMolecules);
      const newRate = calculateRateStatus(newCounts.C);

      return {
        grid: newGrid,
        counts: newCounts,
        rateStatus: newRate.status,
        reactionInterval: newRate.interval,
        equilibriumConstant: calculateEquilibriumConstant(newCounts),
      };
    });
  },

  triggerForwardReaction: () => {
    const state = get();
    const result = processReactionTick(state.grid, state.rateStatus);

    if (result.reactionType === 'forward') {
      const animatingMols = result.newGrid.molecules.filter(
        (m) => m.isAnimating && m.animationType === 'forward'
      );

      set({
        grid: result.newGrid,
        lastReaction: { type: 'forward', timestamp: new Date() },
      });

      setTimeout(() => {
        const currentState = get();
        const pairIds = animatingMols.map((m) => m.id) as [string, string];
        const completedGrid = completeForwardReaction(currentState.grid, pairIds);
        const newCounts = countMolecules(completedGrid.molecules);
        const newRate = calculateRateStatus(newCounts.C);

        set({
          grid: completedGrid,
          counts: newCounts,
          rateStatus: newRate.status,
          reactionInterval: newRate.interval,
          equilibriumConstant: calculateEquilibriumConstant(newCounts),
        });
      }, 500);
    } else if (result.reactionType === 'reverse') {
      get().triggerReverseReaction();
    } else if (result.reactionType === 'catalyst-poisoning') {
      set({
        lastReaction: { type: 'catalyst-poisoning', timestamp: new Date() },
      });
    }
  },

  triggerReverseReaction: () => {
    const state = get();
    const result = processReactionTick(state.grid, state.rateStatus);

    if (result.reactionType === 'reverse') {
      const animatingMol = result.newGrid.molecules.find(
        (m) => m.isAnimating && m.animationType === 'reverse'
      );

      set({
        grid: result.newGrid,
        lastReaction: { type: 'reverse', timestamp: new Date() },
      });

      if (animatingMol) {
        setTimeout(() => {
          const currentState = get();
          const completedGrid = completeReverseReaction(currentState.grid, animatingMol.id);
          const newCounts = countMolecules(completedGrid.molecules);
          const newRate = calculateRateStatus(newCounts.C);

          set({
            grid: completedGrid,
            counts: newCounts,
            rateStatus: newRate.status,
            reactionInterval: newRate.interval,
            equilibriumConstant: calculateEquilibriumConstant(newCounts),
          });
        }, 500);
      }
    } else if (result.reactionType === 'forward') {
      get().triggerForwardReaction();
    } else if (result.reactionType === 'catalyst-poisoning') {
      set({
        lastReaction: { type: 'catalyst-poisoning', timestamp: new Date() },
      });
    }
  },

  updateCounts: () => {
    set((state) => {
      const newCounts = countMolecules(state.grid.molecules);
      return { counts: newCounts };
    });
  },

  updateEquilibriumConstant: () => {
    set((state) => ({
      equilibriumConstant: calculateEquilibriumConstant(state.counts),
    }));
  },

  checkReactionConditions: () => {
    const state = get();
    const result = processReactionTick(state.grid, state.rateStatus);

    if (result.reactionType !== 'none' && result.reactionType !== 'catalyst-poisoning') {
      if (result.reactionType === 'forward') {
        state.triggerForwardReaction();
      } else {
        state.triggerReverseReaction();
      }
    } else if (result.reactionType === 'catalyst-poisoning') {
      set({
        lastReaction: { type: 'catalyst-poisoning', timestamp: new Date() },
      });
    }
  },

  resetBoard: () => {
    const newGrid = initializeGrid();
    const newCounts = countMolecules(newGrid.molecules);
    const newRate = calculateRateStatus(newCounts.C);

    set({
      grid: newGrid,
      counts: newCounts,
      rateStatus: newRate.status,
      reactionInterval: newRate.interval,
      equilibriumConstant: calculateEquilibriumConstant(newCounts),
      lastReaction: { type: 'none', timestamp: null },
    });
  },

  setLastReaction: (type: ReactionType) => {
    set({
      lastReaction: { type, timestamp: new Date() },
    });
  },
}));

export default useGameStore;
