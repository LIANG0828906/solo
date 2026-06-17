import { create } from 'zustand';
import type { Tile, MatchTarget, GamePhase } from './types';
import { createEngine, GameEngine } from './engine';

export interface GameStore {
  tiles: Tile[];
  target: MatchTarget | null;
  score: number;
  lives: number;
  combo: number;
  maxCombo: number;
  round: number;
  level: number;
  phase: GamePhase;
  timeLeft: number;
  roundDuration: number;
  shakeTrigger: number;
  _engine: GameEngine | null;

  selectTile: (tileId: string) => void;
  restart: () => void;
  _ensureEngine: () => GameEngine;
  _engineUpdate: (patch: Partial<Omit<GameStore, '_engine' | 'selectTile' | 'restart' | '_ensureEngine' | '_engineUpdate' | '_startGame' | 'getState'>>) => void;
  _startGame: () => void;
  getState: () => GameStore;
}

export const useGameStore = create<GameStore>((set, get) => ({
  tiles: [],
  target: null,
  score: 0,
  lives: 3,
  combo: 0,
  maxCombo: 0,
  round: 1,
  level: 1,
  phase: 'idle',
  timeLeft: 5000,
  roundDuration: 5000,
  shakeTrigger: 0,
  _engine: null,

  getState: () => get(),

  _ensureEngine: (): GameEngine => {
    const state = get();
    if (!state._engine) {
      const engine = createEngine(get() as GameStore);
      set({ _engine: engine });
      return engine;
    }
    return state._engine;
  },

  selectTile: (tileId: string) => {
    const engine = get()._ensureEngine();
    engine.handleTileSelect(tileId);
  },

  restart: () => {
    const engine = get()._ensureEngine();
    engine.startGame();
  },

  _startGame: () => {
    const engine = get()._ensureEngine();
    engine.startGame();
  },

  _engineUpdate: (patch) => {
    set(patch as Partial<GameStore>);
  },
}));

export const initGame = (): void => {
  const store = useGameStore.getState();
  store._ensureEngine();
  store._startGame();
};
