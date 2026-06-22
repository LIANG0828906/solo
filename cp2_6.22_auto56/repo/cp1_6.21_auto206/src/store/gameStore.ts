import { create } from 'zustand';
import type {
  CraftingState,
  BattleState,
  BattleResult,
  RuneSpell,
  BattleLog,
} from '@/types';
import { RUNES, RECIPES } from '@/data/runes';

export { RUNES, RECIPES };

interface GameState {
  currentPage: 'crafting' | 'battle';
  crafting: CraftingState;
  battle: BattleState;
  showResult: boolean;
  battleResult: BattleResult | null;
  setPage: (page: 'crafting' | 'battle') => void;
  placeRune: (runeId: string, row: number, col: number) => void;
  clearCell: (row: number, col: number) => void;
  clearGrid: () => void;
  addToBackpack: (spell: RuneSpell) => void;
  removeFromBackpack: (index: number) => void;
  setAnimating: (type: 'success' | 'failure' | null) => void;
  showBattleResult: (result: BattleResult) => void;
  hideBattleResult: () => void;
  initializeBattle: (spells: RuneSpell[]) => void;
  addBattleLog: (log: BattleLog) => void;
  updateBattleState: (partial: Partial<BattleState>) => void;
}

const createEmptyGrid = (): (string | null)[][] => {
  return Array(3).fill(null).map(() => Array(3).fill(null));
};

const initialCraftingState: CraftingState = {
  grid: createEmptyGrid(),
  selectedCells: [],
  isAnimating: false,
  animationType: null,
  backpack: [],
};

const initialBattleState: BattleState = {
  playerHp: 10,
  enemyHp: 10,
  maxHp: 10,
  defenseTurns: 0,
  currentTurn: 0,
  totalDamage: 0,
  logs: [],
  isRunning: false,
  isFinished: false,
  isVictory: false,
  spells: [],
};

export const useGameStore = create<GameState>((set) => ({
  currentPage: 'crafting',
  crafting: initialCraftingState,
  battle: initialBattleState,
  showResult: false,
  battleResult: null,

  setPage: (page) => set({ currentPage: page }),

  placeRune: (runeId, row, col) =>
    set((state) => {
      const newGrid = state.crafting.grid.map((r) => [...r]);
      newGrid[row][col] = runeId;

      const newSelectedCells = [...state.crafting.selectedCells];
      const existingIndex = newSelectedCells.findIndex(
        (c) => c.row === row && c.col === col
      );
      if (existingIndex === -1) {
        newSelectedCells.push({ row, col });
      }

      return {
        crafting: {
          ...state.crafting,
          grid: newGrid,
          selectedCells: newSelectedCells,
        },
      };
    }),

  clearCell: (row, col) =>
    set((state) => {
      const newGrid = state.crafting.grid.map((r) => [...r]);
      newGrid[row][col] = null;

      const newSelectedCells = state.crafting.selectedCells.filter(
        (c) => !(c.row === row && c.col === col)
      );

      return {
        crafting: {
          ...state.crafting,
          grid: newGrid,
          selectedCells: newSelectedCells,
        },
      };
    }),

  clearGrid: () =>
    set((state) => ({
      crafting: {
        ...state.crafting,
        grid: createEmptyGrid(),
        selectedCells: [],
      },
    })),

  addToBackpack: (spell) =>
    set((state) => ({
      crafting: {
        ...state.crafting,
        backpack: [...state.crafting.backpack, spell],
      },
    })),

  removeFromBackpack: (index) =>
    set((state) => {
      const newBackpack = [...state.crafting.backpack];
      newBackpack.splice(index, 1);
      return {
        crafting: {
          ...state.crafting,
          backpack: newBackpack,
        },
      };
    }),

  setAnimating: (type) =>
    set((state) => ({
      crafting: {
        ...state.crafting,
        isAnimating: type !== null,
        animationType: type,
      },
    })),

  showBattleResult: (result) =>
    set({
      showResult: true,
      battleResult: result,
    }),

  hideBattleResult: () =>
    set({
      showResult: false,
      battleResult: null,
    }),

  initializeBattle: (spells) =>
    set({
      battle: {
        ...initialBattleState,
        spells,
      },
      showResult: false,
      battleResult: null,
    }),

  addBattleLog: (log) =>
    set((state) => ({
      battle: {
        ...state.battle,
        logs: [...state.battle.logs, log],
      },
    })),

  updateBattleState: (partial) =>
    set((state) => ({
      battle: {
        ...state.battle,
        ...partial,
      },
    })),
}));
