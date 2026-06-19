import { create } from 'zustand';
import type { GameState, PlayerAction, Direction } from '@/types/game';
import {
  createInitialState,
  executePlayerAction,
  executeAITurn,
  refreshCrystals,
  clearEffects,
} from '@/engine/gameEngine';

interface GameStore extends GameState {
  startGame: () => void;
  playerMove: (direction: Direction) => void;
  playerAttack: () => void;
  playerWait: () => void;
  executeAI: () => void;
  doRefreshCrystals: () => void;
  clearVisualEffects: () => void;
  setAnimating: (isAnimating: boolean) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialState(),

  startGame: () => {
    set(createInitialState());
  },

  playerMove: (direction: Direction) => {
    const state = get();
    if (state.turn !== 'player' || state.isAnimating || state.gameStatus !== 'playing') return;

    const newState = executePlayerAction(state, { type: 'move', direction });
    set(newState);
  },

  playerAttack: () => {
    const state = get();
    if (state.turn !== 'player' || state.isAnimating || state.gameStatus !== 'playing') return;

    const newState = executePlayerAction(state, { type: 'attack' });
    set(newState);
  },

  playerWait: () => {
    const state = get();
    if (state.turn !== 'player' || state.isAnimating || state.gameStatus !== 'playing') return;

    const newState = executePlayerAction(state, { type: 'wait' });
    set(newState);
  },

  executeAI: () => {
    const state = get();
    if (state.turn !== 'ai' || state.gameStatus !== 'playing') return;

    const newState = executeAITurn(state);
    set(newState);
  },

  doRefreshCrystals: () => {
    const state = get();
    const newState = refreshCrystals(state);
    set(newState);
  },

  clearVisualEffects: () => {
    const state = get();
    const newState = clearEffects(state);
    set(newState);
  },

  setAnimating: (isAnimating: boolean) => {
    set({ isAnimating });
  },
}));
