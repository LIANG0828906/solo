import type { CanvasElement, HistoryState } from './types';

const MAX_HISTORY = 50;

export function createInitialHistory(): HistoryState {
  return {
    past: [],
    present: [],
    future: [],
    maxHistory: MAX_HISTORY,
  };
}

export function record(
  state: HistoryState,
  newPresent: CanvasElement[],
): HistoryState {
  const past = [...state.past, state.present];
  if (past.length > state.maxHistory) {
    past.shift();
  }
  return {
    ...state,
    past,
    present: newPresent,
    future: [],
  };
}

export function undo(state: HistoryState): HistoryState {
  if (state.past.length === 0) return state;
  const newPast = [...state.past];
  const previous = newPast.pop() as CanvasElement[];
  return {
    ...state,
    past: newPast,
    present: previous,
    future: [state.present, ...state.future],
  };
}

export function redo(state: HistoryState): HistoryState {
  if (state.future.length === 0) return state;
  const newFuture = [...state.future];
  const next = newFuture.shift() as CanvasElement[];
  return {
    ...state,
    past: [...state.past, state.present],
    present: next,
    future: newFuture,
  };
}

export function canUndo(state: HistoryState): boolean {
  return state.past.length > 0;
}

export function canRedo(state: HistoryState): boolean {
  return state.future.length > 0;
}
