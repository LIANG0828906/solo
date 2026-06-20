import { create } from 'zustand';
import { GameEngine } from '../game/GameEngine';
import type { GameState, HexCoord } from '../game/types';

interface GameStore {
  engine: GameEngine;
  state: GameState;
  aiThinking: boolean;
  initGame: () => void;
  handleCellClick: (coord: HexCoord) => void;
  endTurn: () => void;
  restartGame: () => void;
}

export const useGameStore = create<GameStore>((set, get) => {
  const engine = new GameEngine();

  const syncState = () => {
    set({ state: { ...engine.state } });
  };

  return {
    engine,
    state: { ...engine.state },
    aiThinking: false,

    initGame: () => {
      engine.reset();
      syncState();
    },

    handleCellClick: (coord: HexCoord) => {
      const { state } = get();
      if (state.gameOver || state.currentTurn !== 'player') return;
      if (engine.handlePlayerClick(coord)) {
        syncState();
      }
    },

    endTurn: () => {
      const { state, aiThinking } = get();
      if (state.gameOver || aiThinking) return;

      engine.endTurn();
      syncState();

      if (engine.state.currentTurn === 'ai') {
        set({ aiThinking: true });
        setTimeout(() => {
          engine.executeAITurn();
          syncState();
          setTimeout(() => {
            engine.endTurn();
            syncState();
            set({ aiThinking: false });
          }, 300);
        }, 1000);
      }
    },

    restartGame: () => {
      engine.reset();
      set({ aiThinking: false });
      syncState();
    },
  };
});
