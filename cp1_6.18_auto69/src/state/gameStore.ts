import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { GameState, GameActions, Fragment } from '../types';
import { getCurrentPoem } from '../data/poems';
import { MatchChecker } from '../logic/MatchChecker';

const CANVAS_PADDING = 60;
const GRID_TOP_OFFSET = 120;

const generateRandomPosition = (
  canvasWidth: number,
  canvasHeight: number,
  existingPositions: { x: number; y: number }[]
): { x: number; y: number } => {
  let x: number, y: number;
  let attempts = 0;
  const maxAttempts = 50;

  do {
    x = CANVAS_PADDING + Math.random() * (canvasWidth - CANVAS_PADDING * 2 - 80);
    y =
      GRID_TOP_OFFSET +
      100 +
      Math.random() * (canvasHeight - GRID_TOP_OFFSET - 200);
    attempts++;
  } while (
    attempts < maxAttempts &&
    existingPositions.some(
      (pos) => Math.abs(pos.x - x) < 90 && Math.abs(pos.y - y) < 50
    )
  );

  return { x, y };
};

const initializeFragments = (
  lineFragments: string[],
  canvasWidth: number,
  canvasHeight: number
): Fragment[] => {
  const fragments: Fragment[] = [];
  const positions: { x: number; y: number }[] = [];

  const shuffled = [...lineFragments].sort(() => Math.random() - 0.5);

  for (const text of shuffled) {
    const pos = generateRandomPosition(canvasWidth, canvasHeight, positions);
    positions.push(pos);
    fragments.push({
      id: uuidv4(),
      text,
      x: pos.x,
      y: pos.y,
      isUsed: false,
    });
  }

  return fragments;
};

const poem = getCurrentPoem();
const initialLine = poem.lines[0];
const initialFragments = initializeFragments(initialLine.fragments, 900, 600);

type GameStore = GameState & GameActions;

export const useGameStore = create<GameStore>((set, get) => ({
  currentPoemId: poem.id,
  currentLineIndex: 0,
  placedFragments: new Array(initialLine.fragments.length).fill(null),
  availableFragments: initialFragments,
  completedLines: [],
  score: 0,
  combo: 0,
  hintsRemaining: 0,
  elapsedTime: 0,
  lastActionTime: Date.now(),
  isComplete: false,
  highlightedFragmentId: null,
  showParticles: false,
  particlePosition: null,
  matchedGridIndices: [],

  placeFragment: (gridIndex: number, fragmentId: string) => {
    const state = get();
    const currentLine = poem.lines[state.currentLineIndex];
    const fragment = state.availableFragments.find((f) => f.id === fragmentId);
    if (!fragment || fragment.isUsed) return;

    const existingFragmentId = state.placedFragments[gridIndex];
    if (existingFragmentId) {
      set((state) => ({
        availableFragments: state.availableFragments.map((f) =>
          f.id === existingFragmentId ? { ...f, isUsed: false } : f
        ),
      }));
    }

    set((state) => ({
      placedFragments: state.placedFragments.map((f, i) =>
        i === gridIndex ? fragmentId : f
      ),
      availableFragments: state.availableFragments.map((f) =>
        f.id === fragmentId ? { ...f, isUsed: true } : f
      ),
      lastActionTime: Date.now(),
      highlightedFragmentId: null,
    }));

    const newState = get();
    const matchResult = MatchChecker.checkMatch(
      newState.placedFragments,
      newState.availableFragments,
      currentLine
    );

    if (matchResult.isMatch) {
      const filledIndices = newState.placedFragments
        .map((_, i) => i)
        .filter((i) => newState.placedFragments[i] !== null);

      set((state) => ({
        matchedGridIndices: filledIndices,
        showParticles: true,
        particlePosition: {
          x: 450,
          y: GRID_TOP_OFFSET + 25,
        },
        completedLines: [...state.completedLines, matchResult.matchedText!],
        score: state.score + 100 * (state.combo + 1),
        combo: state.combo + 1,
        hintsRemaining:
          state.combo + 1 > 3 ? state.hintsRemaining + 1 : state.hintsRemaining,
      }));

      setTimeout(() => {
        get().hideParticles();
        get().clearMatchedGrid();
        get().nextLine();
      }, 1200);
    } else if (MatchChecker.isLineComplete(newState.placedFragments)) {
      set({
        combo: 0,
      });
    }
  },

  removeFragment: (gridIndex: number) => {
    const state = get();
    const fragmentId = state.placedFragments[gridIndex];
    if (!fragmentId) return;

    set((state) => ({
      placedFragments: state.placedFragments.map((f, i) =>
        i === gridIndex ? null : f
      ),
      availableFragments: state.availableFragments.map((f) =>
        f.id === fragmentId ? { ...f, isUsed: false } : f
      ),
      lastActionTime: Date.now(),
    }));
  },

  updateFragmentPosition: (fragmentId: string, x: number, y: number) => {
    set((state) => ({
      availableFragments: state.availableFragments.map((f) =>
        f.id === fragmentId ? { ...f, x, y } : f
      ),
    }));
  },

  shuffleFragments: () => {
    const state = get();
    const currentLine = poem.lines[state.currentLineIndex];
    const unusedFragments = state.availableFragments.filter((f) => !f.isUsed);

    const shuffled = initializeFragments(
      unusedFragments.map((f) => f.text),
      900,
      600
    );

    const usedFragments = state.availableFragments.filter((f) => f.isUsed);

    set({
      availableFragments: [...usedFragments, ...shuffled],
      placedFragments: new Array(currentLine.fragments.length).fill(null),
      lastActionTime: Date.now(),
      highlightedFragmentId: null,
    });
  },

  useHint: () => {
    const state = get();
    if (state.hintsRemaining <= 0) return;

    const currentLine = poem.lines[state.currentLineIndex];
    const nextFragment = MatchChecker.getNextCorrectFragment(
      state.placedFragments,
      state.availableFragments,
      currentLine
    );

    if (nextFragment) {
      set({
        hintsRemaining: state.hintsRemaining - 1,
        highlightedFragmentId: nextFragment.id,
      });

      setTimeout(() => {
        set({ highlightedFragmentId: null });
      }, 3000);
    }
  },

  resetCombo: () => {
    set({ combo: 0 });
  },

  nextLine: () => {
    const state = get();
    const nextIndex = state.currentLineIndex + 1;

    if (nextIndex >= poem.lines.length) {
      set({ isComplete: true });
      return;
    }

    const nextLine = poem.lines[nextIndex];
    const newFragments = initializeFragments(nextLine.fragments, 900, 600);

    set({
      currentLineIndex: nextIndex,
      placedFragments: new Array(nextLine.fragments.length).fill(null),
      availableFragments: newFragments,
      lastActionTime: Date.now(),
    });
  },

  updateTime: () => {
    set((state) => ({
      elapsedTime: state.elapsedTime + 1,
    }));
  },

  resetGame: () => {
    const firstLine = poem.lines[0];
    const newFragments = initializeFragments(firstLine.fragments, 900, 600);

    set({
      currentLineIndex: 0,
      placedFragments: new Array(firstLine.fragments.length).fill(null),
      availableFragments: newFragments,
      completedLines: [],
      score: 0,
      combo: 0,
      hintsRemaining: 0,
      elapsedTime: 0,
      lastActionTime: Date.now(),
      isComplete: false,
      highlightedFragmentId: null,
      showParticles: false,
      particlePosition: null,
      matchedGridIndices: [],
    });
  },

  hideParticles: () => {
    set({ showParticles: false, particlePosition: null });
  },

  clearMatchedGrid: () => {
    set({ matchedGridIndices: [] });
  },
}));
