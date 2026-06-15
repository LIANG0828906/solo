import { create } from 'zustand';
import type { Fragment, PlacedFragment, PoemData, MatchResult, ScoreResponse } from '../types';

interface FragmentState {
  libraryFragments: Fragment[];
  placedFragments: PlacedFragment[];
  poemData: PoemData | null;
  selectedFragmentId: string | null;
  matchResults: MatchResult[];
  bestMatch: MatchResult | null;
  isComplete: boolean;
  scoreResult: ScoreResponse | null;
  elapsedTime: number;
  totalMoves: number;
  soundEnabled: boolean;
  history: PlacedFragment[][];
  currentHistoryIndex: number;
  isStackingMode: boolean;
  isDragging: boolean;
}

interface FragmentActions {
  setFragments: (fragments: Fragment[], poemData: PoemData) => void;
  placeFragment: (fragment: PlacedFragment) => void;
  removeFragment: (fragmentId: string) => void;
  rotateFragment: (fragmentId: string) => void;
  updateFragmentPosition: (fragmentId: string, x: number, y: number) => void;
  updateFragmentZIndex: (fragmentId: string, zIndex: number) => void;
  setSelectedFragment: (fragmentId: string | null) => void;
  selectFragment: (fragmentId: string | null) => void;
  setMatchResults: (matches: MatchResult[], bestMatch: MatchResult | null) => void;
  incrementMoves: () => void;
  setElapsedTime: (time: number) => void;
  toggleSound: () => void;
  complete: (scoreResult: ScoreResponse) => void;
  undo: () => void;
  canUndo: () => boolean;
  reset: () => void;
  setStackingMode: (enabled: boolean) => void;
  setDragging: (enabled: boolean) => void;
}

const initialState: FragmentState = {
  libraryFragments: [],
  placedFragments: [],
  poemData: null,
  selectedFragmentId: null,
  matchResults: [],
  bestMatch: null,
  isComplete: false,
  scoreResult: null,
  elapsedTime: 0,
  totalMoves: 0,
  soundEnabled: true,
  history: [],
  currentHistoryIndex: -1,
  isStackingMode: false,
  isDragging: false,
};

export const useFragmentStore = create<FragmentState & FragmentActions>((set, get) => ({
  ...initialState,

  setFragments: (fragments: Fragment[], poemData: PoemData) => {
    set({
      libraryFragments: fragments,
      placedFragments: [],
      poemData,
      history: [],
      currentHistoryIndex: -1,
    });
  },

  placeFragment: (fragment: PlacedFragment) => {
    const state = get();
    const newPlacedFragments = [...state.placedFragments, fragment];
    const newHistory = state.history.slice(0, state.currentHistoryIndex + 1);
    newHistory.push(newPlacedFragments);

    set({
      placedFragments: newPlacedFragments,
      libraryFragments: state.libraryFragments.filter((f) => f.id !== fragment.id),
      history: newHistory,
      currentHistoryIndex: newHistory.length - 1,
    });
  },

  updateFragmentZIndex: (fragmentId: string, zIndex: number) => {
    const state = get();
    const newPlacedFragments = state.placedFragments.map((f) =>
      f.id === fragmentId ? { ...f, zIndex } : f
    );
    set({ placedFragments: newPlacedFragments });
  },

  selectFragment: (fragmentId: string | null) => {
    set({ selectedFragmentId: fragmentId });
  },

  setStackingMode: (enabled: boolean) => {
    set({ isStackingMode: enabled });
  },

  setDragging: (enabled: boolean) => {
    set({ isDragging: enabled });
  },

  removeFragment: (fragmentId: string) => {
    const state = get();
    const placedFragment = state.placedFragments.find((f) => f.id === fragmentId);
    if (!placedFragment) return;

    const fragment: Fragment = {
      id: placedFragment.id,
      text: placedFragment.text,
      position: placedFragment.position,
      edges: placedFragment.edges,
      inkStyle: placedFragment.inkStyle,
      texture: placedFragment.texture,
      width: placedFragment.width,
      height: placedFragment.height,
      rotation: placedFragment.rotation,
    };

    const newPlacedFragments = state.placedFragments.filter((f) => f.id !== fragmentId);
    const newHistory = state.history.slice(0, state.currentHistoryIndex + 1);
    newHistory.push(newPlacedFragments);

    set({
      placedFragments: newPlacedFragments,
      libraryFragments: [...state.libraryFragments, fragment],
      history: newHistory,
      currentHistoryIndex: newHistory.length - 1,
    });
  },

  rotateFragment: (fragmentId: string) => {
    const state = get();
    const newPlacedFragments = state.placedFragments.map((f) =>
      f.id === fragmentId
        ? { ...f, rotation: (f.rotation + 90) % 360 }
        : f
    );

    const newHistory = state.history.slice(0, state.currentHistoryIndex + 1);
    newHistory.push(newPlacedFragments);

    set({
      placedFragments: newPlacedFragments,
      history: newHistory,
      currentHistoryIndex: newHistory.length - 1,
    });
  },

  updateFragmentPosition: (fragmentId: string, x: number, y: number) => {
    const state = get();
    const newPlacedFragments = state.placedFragments.map((f) =>
      f.id === fragmentId ? { ...f, x, y } : f
    );
    set({ placedFragments: newPlacedFragments });
  },

  setSelectedFragment: (fragmentId: string | null) => {
    set({ selectedFragmentId: fragmentId });
  },

  setMatchResults: (matches: MatchResult[], bestMatch: MatchResult | null) => {
    set({ matchResults: matches, bestMatch });
  },

  incrementMoves: () => {
    set((state) => ({ totalMoves: state.totalMoves + 1 }));
  },

  setElapsedTime: (time: number) => {
    set({ elapsedTime: time });
  },

  toggleSound: () => {
    set((state) => ({ soundEnabled: !state.soundEnabled }));
  },

  complete: (scoreResult: ScoreResponse) => {
    set({ isComplete: true, scoreResult });
  },

  undo: () => {
    const state = get();
    if (state.currentHistoryIndex <= 0) return;

    const prevIndex = state.currentHistoryIndex - 1;
    const prevPlacedFragments = state.history[prevIndex];

    const currentIds = new Set(state.placedFragments.map((f) => f.id));
    const prevIds = new Set(prevPlacedFragments.map((f) => f.id));

    const removedIds = Array.from(currentIds).filter((id) => !prevIds.has(id));
    const removedFragments = state.placedFragments
      .filter((f) => removedIds.includes(f.id))
      .map((pf): Fragment => ({
        id: pf.id,
        text: pf.text,
        position: pf.position,
        edges: pf.edges,
        inkStyle: pf.inkStyle,
        texture: pf.texture,
        width: pf.width,
        height: pf.height,
        rotation: pf.rotation,
      }));

    set({
      placedFragments: prevPlacedFragments,
      libraryFragments: [...state.libraryFragments, ...removedFragments],
      currentHistoryIndex: prevIndex,
    });
  },

  canUndo: () => {
    return get().currentHistoryIndex > 0;
  },

  reset: () => {
    const state = get();
    const allFragments = [
      ...state.libraryFragments,
      ...state.placedFragments.map((pf): Fragment => ({
        id: pf.id,
        text: pf.text,
        position: pf.position,
        edges: pf.edges,
        inkStyle: pf.inkStyle,
        texture: pf.texture,
        width: pf.width,
        height: pf.height,
        rotation: pf.rotation,
      })),
    ];

    set({
      ...initialState,
      libraryFragments: allFragments,
      poemData: state.poemData,
      soundEnabled: state.soundEnabled,
      isStackingMode: false,
      isDragging: false,
    });
  },
}));
