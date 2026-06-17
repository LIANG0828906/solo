import { create } from 'zustand';
import {
  Cell,
  ColorTarget,
  ColorValue,
  ROWS,
  COLS,
  createGrid,
  triggerExplosion,
  checkWin,
  generateLevel,
  hasValidMoves,
} from './gameEngine';

interface GameState {
  grid: Cell[][];
  score: number;
  level: number;
  targets: ColorTarget[];
  progress: Record<string, number>;
  isAnimating: boolean;
  isWin: boolean;
  explodingCells: Set<string>;
  winAnimating: boolean;
  celebrating: boolean;

  handleCellClick: (row: number, col: number) => void;
  nextLevel: () => void;
  resetGame: () => void;
  clearExplosion: () => void;
  setWinAnimating: (v: boolean) => void;
  setCelebrating: (v: boolean) => void;
}

function initLevel(level: number) {
  const grid = createGrid(ROWS, COLS);
  const targets = generateLevel(level);
  return { grid, targets, progress: {} as Record<string, number> };
}

export const useGameStore = create<GameState>((set, get) => {
  const initial = initLevel(1);

  return {
    grid: initial.grid,
    score: 0,
    level: 1,
    targets: initial.targets,
    progress: initial.progress,
    isAnimating: false,
    isWin: false,
    explodingCells: new Set<string>(),
    winAnimating: false,
    celebrating: false,

    handleCellClick: (row: number, col: number) => {
      const state = get();
      if (state.isAnimating || state.isWin) return;
      const cell = state.grid[row][col];
      if (!cell.color) return;

      const result = triggerExplosion(state.grid, row, col);
      if (result.explodedCells.length === 0) return;

      const explodingSet = new Set<string>();
      for (const ec of result.explodedCells) {
        explodingSet.add(`${ec.row},${ec.col}`);
      }

      const newProgress = { ...state.progress };
      for (const [color, count] of Object.entries(result.colorCounts)) {
        newProgress[color] = (newProgress[color] || 0) + count;
      }

      const isLevelWin = checkWin(state.targets, newProgress);

      set({
        isAnimating: true,
        explodingCells: explodingSet,
        score: state.score + result.scoreGained,
        progress: newProgress,
      });

      setTimeout(() => {
        set({
          grid: result.newGrid,
          explodingCells: new Set<string>(),
          isAnimating: false,
          isWin: isLevelWin,
        });

        if (isLevelWin) {
          set({ celebrating: true });
          get().setWinAnimating(true);
        }

        if (!hasValidMoves(result.newGrid) && !isLevelWin) {
          const regenerated = createGrid(ROWS, COLS);
          set({ grid: regenerated });
        }
      }, 500);
    },

    nextLevel: () => {
      const nextLvl = get().level + 1;
      const newData = initLevel(nextLvl);
      set({
        level: nextLvl,
        grid: newData.grid,
        targets: newData.targets,
        progress: newData.progress,
        isWin: false,
        winAnimating: false,
        isAnimating: false,
        explodingCells: new Set<string>(),
        celebrating: false,
      });
    },

    resetGame: () => {
      const initial = initLevel(1);
      set({
        grid: initial.grid,
        score: 0,
        level: 1,
        targets: initial.targets,
        progress: initial.progress,
        isAnimating: false,
        isWin: false,
        winAnimating: false,
        explodingCells: new Set<string>(),
        celebrating: false,
      });
    },

    clearExplosion: () => {
      set({ explodingCells: new Set<string>() });
    },

    setWinAnimating: (v: boolean) => {
      set({ winAnimating: v });
    },

    setCelebrating: (v: boolean) => {
      set({ celebrating: v });
    },
  };
});
