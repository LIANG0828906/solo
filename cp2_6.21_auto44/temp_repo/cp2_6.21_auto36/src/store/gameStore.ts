import { create } from 'zustand';
import {
  CrystalType,
  createEmptyGrid,
  generateCrystalPool,
  validatePlacement,
  findHint,
  checkWinCondition,
  MAX_ENERGY,
  ENERGY_GAIN,
  ENERGY_LOSS,
  MAX_HINTS,
  shuffleArray,
} from '../utils/gameLogic';

export type GameStatus = 'playing' | 'won';

export type FeedbackType = 'success' | 'error' | null;

interface GameState {
  grid: (CrystalType | null)[];
  crystalPool: CrystalType[];
  energy: number;
  gameStatus: GameStatus;
  hintsRemaining: number;
  totalMoves: number;
  highlightedCell: number | null;
  lastFeedback: FeedbackType;
  feedbackCell: number | null;

  initGame: () => void;
  placeCrystal: (cellIndex: number, poolIndex: number) => boolean;
  removeCrystal: (cellIndex: number) => void;
  resetGame: () => void;
  useHint: () => void;
  clearHighlight: () => void;
  clearFeedback: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  grid: createEmptyGrid(),
  crystalPool: generateCrystalPool(),
  energy: 0,
  gameStatus: 'playing',
  hintsRemaining: MAX_HINTS,
  totalMoves: 0,
  highlightedCell: null,
  lastFeedback: null,
  feedbackCell: null,

  initGame: () => {
    set({
      grid: createEmptyGrid(),
      crystalPool: generateCrystalPool(),
      energy: 0,
      gameStatus: 'playing',
      hintsRemaining: MAX_HINTS,
      totalMoves: 0,
      highlightedCell: null,
      lastFeedback: null,
      feedbackCell: null,
    });
  },

  placeCrystal: (cellIndex: number, poolIndex: number) => {
    const state = get();
    if (state.gameStatus !== 'playing') return false;
    if (state.grid[cellIndex] !== null) return false;
    if (poolIndex < 0 || poolIndex >= state.crystalPool.length) return false;

    const crystalType = state.crystalPool[poolIndex];
    const isValid = validatePlacement(state.grid, cellIndex, crystalType);

    const newGrid = [...state.grid];
    newGrid[cellIndex] = crystalType;

    const newPool = [...state.crystalPool];
    newPool.splice(poolIndex, 1);

    const energyChange = isValid ? ENERGY_GAIN : -ENERGY_LOSS;
    const newEnergy = Math.max(0, Math.min(MAX_ENERGY, state.energy + energyChange));
    const newTotalMoves = state.totalMoves + 1;
    const newStatus = checkWinCondition(newEnergy) ? 'won' : 'playing';

    set({
      grid: newGrid,
      crystalPool: newPool,
      energy: newEnergy,
      totalMoves: newTotalMoves,
      gameStatus: newStatus,
      lastFeedback: isValid ? 'success' : 'error',
      feedbackCell: cellIndex,
      highlightedCell: null,
    });

    return isValid;
  },

  removeCrystal: (cellIndex: number) => {
    const state = get();
    if (state.gameStatus !== 'playing') return;
    if (state.grid[cellIndex] === null) return;

    const crystalType = state.grid[cellIndex];
    const newGrid = [...state.grid];
    newGrid[cellIndex] = null;

    const newPool = [...state.crystalPool, crystalType as CrystalType];

    set({
      grid: newGrid,
      crystalPool: shuffleArray(newPool),
      lastFeedback: null,
      feedbackCell: null,
    });
  },

  resetGame: () => {
    get().initGame();
  },

  useHint: () => {
    const state = get();
    if (state.gameStatus !== 'playing') return;
    if (state.hintsRemaining <= 0) return;

    const hint = findHint(state.grid, state.crystalPool);
    if (hint) {
      set({
        highlightedCell: hint.cellIndex,
        hintsRemaining: state.hintsRemaining - 1,
      });
    }
  },

  clearHighlight: () => {
    set({ highlightedCell: null });
  },

  clearFeedback: () => {
    set({ lastFeedback: null, feedbackCell: null });
  },
}));
