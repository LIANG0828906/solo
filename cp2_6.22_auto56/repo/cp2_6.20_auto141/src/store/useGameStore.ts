import { create } from 'zustand';
import { GameStatus, PlayerState } from '../types';

interface GameState {
  status: GameStatus;
  player: PlayerState;
  elapsedTime: number;
  currentSpeed: number;
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  resetGame: () => void;
  finishGame: () => void;
  setPlayer: (player: PlayerState) => void;
  setElapsedTime: (time: number) => void;
  setCurrentSpeed: (speed: number) => void;
}

const defaultPlayer: PlayerState = {
  x: 0,
  y: 0,
  velocityY: 0,
  speed: 0,
  isJumping: false,
  isOnGround: true,
  jumpHoldTime: 0,
};

export const useGameStore = create<GameState>((set) => ({
  status: 'idle',
  player: defaultPlayer,
  elapsedTime: 0,
  currentSpeed: 0,

  startGame: () => set({ status: 'playing' }),

  pauseGame: () => set({ status: 'paused' }),

  resumeGame: () => set({ status: 'playing' }),

  resetGame: () =>
    set({
      status: 'idle',
      player: defaultPlayer,
      elapsedTime: 0,
      currentSpeed: 0,
    }),

  finishGame: () => set({ status: 'finished' }),

  setPlayer: (player) => set({ player }),

  setElapsedTime: (time) => set({ elapsedTime: time }),

  setCurrentSpeed: (speed) => set({ currentSpeed: speed }),
}));
