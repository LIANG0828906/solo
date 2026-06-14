import { create } from 'zustand';
import { GameState, Level } from '../types';
import { mockLevels } from '../data/questions';

interface GameStore extends GameState {
  levels: Level[];
  setCurrentLevel: (level: number) => void;
  decrementLives: () => void;
  addScore: (points: number) => void;
  incrementCombo: () => void;
  resetCombo: () => void;
  completeLevel: (levelId: number) => void;
  resetLives: () => void;
  resetGame: () => void;
}

const initialState: GameState = {
  currentLevel: 1,
  lives: 3,
  score: 0,
  combo: 0,
  completedLevels: [],
};

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,
  levels: mockLevels,
  
  setCurrentLevel: (level: number) => set({ currentLevel: level }),
  
  decrementLives: () => set((state) => ({ lives: Math.max(0, state.lives - 1) })),
  
  addScore: (points: number) => set((state) => ({ score: state.score + points })),
  
  incrementCombo: () => set((state) => ({ combo: state.combo + 1 })),
  
  resetCombo: () => set({ combo: 0 }),
  
  completeLevel: (levelId: number) => set((state) => {
    const newCompletedLevels = [...state.completedLevels, levelId];
    const newLevels = state.