import { create } from 'zustand';
import type { GameState, GameAction } from '@/types/game';

interface GameStore extends GameState {
  dispatch: (action: GameAction) => void;
}

const initialState: GameState = {
  level: 1,
  crystalsCollected: 0,
  totalCrystals: 5,
  time: 0,
  isPaused: false,
  isStunned: false,
  speedMultiplier: 1,
  beamsDisabled: false,
  stunTimer: 0,
};

const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'START_GAME':
      return {
        ...initialState,
        totalCrystals: state.totalCrystals,
      };
    case 'PAUSE_GAME':
      return { ...state, isPaused: true };
    case 'RESUME_GAME':
      return { ...state, isPaused: false };
    case 'RESET_GAME':
      return initialState;
    case 'COLLECT_CRYSTAL': {
      const newCollected = state.crystalsCollected + 1;
      return {
        ...state,
        crystalsCollected: newCollected,
      };
    }
    case 'HIT_BEAM':
      return {
        ...state,
        isStunned: true,
        stunTimer: 2,
        speedMultiplier: 0.3,
      };
    case 'STUN_END':
      return {
        ...state,
        isStunned: false,
        stunTimer: 0,
        speedMultiplier: 1,
      };
    case 'NEXT_LEVEL':
      return {
        ...state,
        level: state.level + 1,
        crystalsCollected: 0,
        beamsDisabled: false,
      };
    case 'UPDATE_TIME':
      return {
        ...state,
        time: state.time + action.payload,
        stunTimer: state.isStunned
          ? Math.max(0, state.stunTimer - action.payload)
          : state.stunTimer,
      };
    case 'DISABLE_BEAMS':
      return {
        ...state,
        beamsDisabled: true,
      };
    default:
      return state;
  }
};

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,
  dispatch: (action) => set((state) => gameReducer(state, action)),
}));
