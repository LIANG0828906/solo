import { create } from 'zustand';
import { GameState, MicrobeType, MAX_MICROBES_PER_TYPE_PLACED } from './types';
import { createInitialState, simulateTurn } from './gameEngine';

interface GameStore extends GameState {
  placeMicrobe: (x: number, y: number, type: MicrobeType) => boolean;
  moveMicrobe: (fromX: number, fromY: number, toX: number, toY: number, type: MicrobeType) => boolean;
  useClearSkill: (x: number, y: number) => boolean;
  nextTurn: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialState(),

  placeMicrobe: (x: number, y: number, type: MicrobeType) => {
    const state = get();
    if (state.isVictory || state.isGameOver) return false;
    if (state.inventory[type] <= 0) return false;

    const cell = state.grid[y][x];
    if (cell.isDesert) return false;
    if (cell.microbes[type] >= MAX_MICROBES_PER_TYPE_PLACED) return false;

    const newGrid = state.grid.map((row) =>
      row.map((c) => {
        if (c.x === x && c.y === y) {
          return {
            ...c,
            microbes: {
              ...c.microbes,
              [type]: c.microbes[type] + 1,
            },
          };
        }
        return c;
      })
    );

    set({
      grid: newGrid,
      inventory: {
        ...state.inventory,
        [type]: state.inventory[type] - 1,
      },
    });

    return true;
  },

  moveMicrobe: (fromX: number, fromY: number, toX: number, toY: number, type: MicrobeType) => {
    const state = get();
    if (state.isVictory || state.isGameOver) return false;
    if (state.energy < 5) return false;

    const fromCell = state.grid[fromY][fromX];
    const toCell = state.grid[toY][toX];

    if (fromCell.isDesert || toCell.isDesert) return false;
    if (fromCell.microbes[type] <= 0) return false;
    if (toCell.microbes[type] >= 10) return false;

    const newGrid = state.grid.map((row) =>
      row.map((c) => {
        if (c.x === fromX && c.y === fromY) {
          return {
            ...c,
            microbes: {
              ...c.microbes,
              [type]: c.microbes[type] - 1,
            },
          };
        }
        if (c.x === toX && c.y === toY) {
          return {
            ...c,
            microbes: {
              ...c.microbes,
              [type]: c.microbes[type] + 1,
            },
          };
        }
        return c;
      })
    );

    set({
      grid: newGrid,
      energy: state.energy - 5,
    });

    return true;
  },

  useClearSkill: (x: number, y: number) => {
    const state = get();
    if (state.isVictory || state.isGameOver) return false;
    if (state.skillCooldown > 0) return false;
    if (state.energy < 20) return false;

    const cell = state.grid[y][x];
    if (cell.isDesert) return false;

    const newGrid = state.grid.map((row) =>
      row.map((c) => {
        if (c.x === x && c.y === y) {
          return {
            ...c,
            nutrient: Math.min(100, c.nutrient + 50),
            microbes: {
              cyanobacteria: 0,
              mold: 0,
              ciliate: 0,
            },
          };
        }
        return c;
      })
    );

    set({
      grid: newGrid,
      energy: state.energy - 20,
      skillCooldown: 3,
    });

    return true;
  },

  nextTurn: () => {
    const state = get();
    if (state.isVictory || state.isGameOver) return;

    const newState = simulateTurn(state);
    set(newState);
  },

  resetGame: () => {
    set(createInitialState());
  },
}));
