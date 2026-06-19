import { create } from 'zustand';
import { GameState, DebrisType, ORBIT_ZONES } from './types';

interface GameStore extends GameState {
  startGame: () => void;
  restartGame: () => void;
  addScore: (points: number) => void;
  incrementDebrisCount: (type: DebrisType) => void;
  setTimeRemaining: (t: number) => void;
  tickTime: (delta: number) => void;
  advanceZone: () => void;
  setTransitioning: (v: boolean) => void;
  endGame: () => void;
  resetZoneCounts: () => void;
}

function createInitialState(): GameState {
  return {
    score: 0,
    timeRemaining: ORBIT_ZONES[0].timeLimit,
    currentZoneIndex: 0,
    debrisCounts: { metal: 0, plastic: 0, electronic: 0 },
    isTransitioning: false,
    isGameOver: false,
    isGameStarted: false,
    finalStats: null,
  };
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialState(),

  startGame: () => {
    const initial = createInitialState();
    set({ ...initial, isGameStarted: true });
  },

  restartGame: () => {
    const initial = createInitialState();
    set({ ...initial, isGameStarted: true });
  },

  addScore: (points: number) => {
    set(state => ({ score: state.score + points }));
  },

  incrementDebrisCount: (type: DebrisType) => {
    set(state => ({
      debrisCounts: {
        ...state.debrisCounts,
        [type]: state.debrisCounts[type] + 1,
      },
    }));
  },

  setTimeRemaining: (t: number) => {
    set({ timeRemaining: t });
  },

  tickTime: (delta: number) => {
    const cur = get().timeRemaining;
    const next = Math.max(0, cur - delta);
    set({ timeRemaining: next });
    if (next <= 0) {
      get().endGame();
    }
  },

  advanceZone: () => {
    const state = get();
    const nextIndex = state.currentZoneIndex + 1;
    if (nextIndex >= ORBIT_ZONES.length) {
      get().endGame();
      return;
    }
    set({
      currentZoneIndex: nextIndex,
      timeRemaining: ORBIT_ZONES[nextIndex].timeLimit,
      debrisCounts: { metal: 0, plastic: 0, electronic: 0 },
      isTransitioning: false,
    });
  },

  setTransitioning: (v: boolean) => {
    set({ isTransitioning: v });
  },

  endGame: () => {
    const state = get();
    set({
      isGameOver: true,
      finalStats: {
        totalScore: state.score,
        totalDebris: { ...state.debrisCounts },
      },
    });
  },

  resetZoneCounts: () => {
    set({ debrisCounts: { metal: 0, plastic: 0, electronic: 0 } });
  },
}));
