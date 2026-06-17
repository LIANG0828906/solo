import { create } from 'zustand';
import {
  PuzzleState,
  initializePuzzle,
  placeFragment,
  resetPuzzle,
  getCurrentHints,
} from '../engine/puzzleEngine';

interface PuzzleStore extends PuzzleState {
  showClues: boolean;
  clues: string[];
  init: () => void;
  place: (fragmentId: string, gridPosition: number) => boolean;
  reset: () => void;
  toggleClues: () => void;
  setCurrentAudioPath: (path: string | null) => void;
}

export const usePuzzleStore = create<PuzzleStore>((set, get) => ({
  ...initializePuzzle(),
  showClues: false,
  clues: getCurrentHints(initializePuzzle()),

  init: () => {
    const state = initializePuzzle();
    set({
      ...state,
      clues: getCurrentHints(state),
      showClues: false,
    });
  },

  place: (fragmentId: string, gridPosition: number) => {
    const currentState = get();
    const result = placeFragment(
      {
        fragments: currentState.fragments,
        placedFragments: currentState.placedFragments,
        unplacedFragments: currentState.unplacedFragments,
        currentDecade: currentState.currentDecade,
        progress: currentState.progress,
        phase: currentState.phase,
        hintText: currentState.hintText,
        currentAudioPath: currentState.currentAudioPath,
      },
      fragmentId,
      gridPosition
    );
    set({
      ...result.state,
      clues: getCurrentHints(result.state),
    });
    return result.isCorrect;
  },

  reset: () => {
    const state = resetPuzzle();
    set({
      ...state,
      clues: getCurrentHints(state),
      showClues: false,
    });
  },

  toggleClues: () => {
    set({ showClues: !get().showClues });
  },

  setCurrentAudioPath: (path: string | null) => {
    set({ currentAudioPath: path });
  },
}));
