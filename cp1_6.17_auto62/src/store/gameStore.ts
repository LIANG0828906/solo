import { create } from 'zustand';
import { GameState, HighScore } from '@/game/types';

interface GameStoreState {
  gameState: GameState;
  currentLevel: number;
  totalGearsCollected: number;
  currentLevelGears: number;
  lives: number;
  seed: number;
  score: number;
  highScores: HighScore[];
  gearCollectProgress: number;
  showNameInput: boolean;
  newHighScore: number | null;
}

interface GameStoreActions {
  setGameState: (state: GameState) => void;
  startGame: (seed?: number) => void;
  nextLevel: () => void;
  collectGear: () => void;
  loseLife: () => void;
  addScore: (points: number) => void;
  updateGearProgress: (progress: number) => void;
  loadHighScores: () => void;
  saveHighScore: (name: string) => void;
  setShowNameInput: (show: boolean) => void;
  setSeed: (seed: number) => void;
  resetGame: () => void;
  levelComplete: () => void;
}

type GameStore = GameStoreState & GameStoreActions;

const getInitialHighScores = (): HighScore[] => {
  try {
    const stored = localStorage.getItem('mech_highscores');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: 'menu',
  currentLevel: 1,
  totalGearsCollected: 0,
  currentLevelGears: 0,
  lives: 3,
  seed: Math.floor(Math.random() * 1000000),
  score: 0,
  highScores: getInitialHighScores(),
  gearCollectProgress: 0,
  showNameInput: false,
  newHighScore: null,

  setGameState: (state) => set({ gameState: state }),

  startGame: (seed) => set({
    gameState: 'playing',
    currentLevel: 1,
    totalGearsCollected: 0,
    currentLevelGears: 0,
    lives: 3,
    seed: seed ?? Math.floor(Math.random() * 1000000),
    score: 0,
    gearCollectProgress: 0,
    showNameInput: false,
    newHighScore: null,
  }),

  nextLevel: () => set((state) => ({
    currentLevel: state.currentLevel + 1,
    currentLevelGears: 0,
    seed: Math.floor(Math.random() * 1000000),
    gameState: 'playing',
  })),

  collectGear: () => set((state) => ({
    currentLevelGears: state.currentLevelGears + 1,
    totalGearsCollected: state.totalGearsCollected + 1,
    score: state.score + 10,
  })),

  loseLife: () => set((state) => {
    const newLives = state.lives - 1;
    return {
      lives: newLives,
      gameState: newLives <= 0 ? 'gameOver' : state.gameState,
    };
  }),

  addScore: (points) => set((state) => ({
    score: state.score + points,
  })),

  updateGearProgress: (progress) => set({
    gearCollectProgress: progress,
  }),

  loadHighScores: () => {
    set({ highScores: getInitialHighScores() });
  },

  saveHighScore: (name) => {
    const state = get();
    const newScore: HighScore = {
      name,
      score: state.score,
      level: state.currentLevel,
      date: new Date().toISOString().split('T')[0],
    };
    const updated = [...state.highScores, newScore]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    localStorage.setItem('mech_highscores', JSON.stringify(updated));
    set({ highScores: updated, showNameInput: false, newHighScore: null });
  },

  setShowNameInput: (show) => set({ showNameInput: show }),

  setSeed: (seed) => set({ seed }),

  resetGame: () => set({
    gameState: 'menu',
    currentLevel: 1,
    totalGearsCollected: 0,
    currentLevelGears: 0,
    lives: 3,
    seed: Math.floor(Math.random() * 1000000),
    score: 0,
    gearCollectProgress: 0,
    showNameInput: false,
    newHighScore: null,
  }),

  levelComplete: () => set((state) => ({
    score: state.score + 100,
    gameState: 'levelComplete',
  })),
}));
