import { useReducer, useEffect, useCallback } from 'react';
import type { EditorState, EditorAction, HistoryState } from './types';

const MAX_HISTORY = 20;

const initialState: EditorState = {
  clips: [],
  stickers: [],
  currentTime: 0,
  selectedClipId: null,
  selectedStickerId: null,
  showTitleEditor: null,
};

const initialHistory: HistoryState = {
  past: [],
  present: initialState,
  future: [],
};

function cloneState(state: EditorState): EditorState {
  return {
    ...state,
    clips: state.clips.map((c) => ({ ...c, title: c.title ? { ...c.title } : undefined })),
    stickers: state.stickers.map((s) => ({ ...s })),
  };
}

function editorReducer(state: HistoryState, action: EditorAction): HistoryState {
  const present = state.present;

  switch (action.type) {
    case 'UNDO': {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, -1);
      return {
        past: newPast,
        present: previous,
        future: [present, ...state.future],
      };
    }

    case 'REDO': {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      return {
        past: [...state.past, present],
        present: next,
        future: newFuture,
      };
    }

    case 'LOAD_STATE': {
      return {
        past: [...state.past, cloneState(present)].slice(-MAX_HISTORY),
        present: action.payload,
        future: [],
      };
    }

    case 'SET_CURRENT_TIME':
    case 'SELECT_CLIP':
    case 'SELECT_STICKER':
    case 'SET_TITLE_EDITOR': {
      let newPresent = { ...present };
      if (action.type === 'SET_CURRENT_TIME') newPresent.currentTime = action.payload;
      if (action.type === 'SELECT_CLIP') {
        newPresent.selectedClipId = action.payload;
        newPresent.selectedStickerId = null;
      }
      if (action.type === 'SELECT_STICKER') {
        newPresent.selectedStickerId = action.payload;
        newPresent.selectedClipId = null;
      }
      if (action.type === 'SET_TITLE_EDITOR') newPresent.showTitleEditor = action.payload;
      return { ...state, present: newPresent };
    }

    default: {
      let newPresent = cloneState(present);

      switch (action.type) {
        case 'ADD_CLIP':
          newPresent.clips.push(action.payload);
          break;
        case 'REMOVE_CLIP':
          newPresent.clips = newPresent.clips.filter((c) => c.id !== action.payload);
          if (newPresent.selectedClipId === action.payload) {
            newPresent.selectedClipId = null;
          }
          break;
        case 'REORDER_CLIPS':
          newPresent.clips = action.payload;
          break;
        case 'UPDATE_CLIP':
          newPresent.clips = newPresent.clips.map((c) =>
            c.id === action.payload.id ? action.payload : c
          );
          break;
        case 'UPDATE_CLIP_TITLE':
          newPresent.clips = newPresent.clips.map((c) =>
            c.id === action.payload.clipId ? { ...c, title: action.payload.title } : c
          );
          break;
        case 'ADD_STICKER':
          newPresent.stickers.push(action.payload);
          break;
        case 'REMOVE_STICKER':
          newPresent.stickers = newPresent.stickers.filter((s) => s.id !== action.payload);
          if (newPresent.selectedStickerId === action.payload) {
            newPresent.selectedStickerId = null;
          }
          break;
        case 'UPDATE_STICKER':
          newPresent.stickers = newPresent.stickers.map((s) =>
            s.id === action.payload.id ? action.payload : s
          );
          break;
      }

      return {
        past: [...state.past, cloneState(present)].slice(-MAX_HISTORY),
        present: newPresent,
        future: [],
      };
    }
  }
}

export function useEditorStore() {
  const [history, dispatch] = useReducer(editorReducer, initialHistory);

  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const redo = useCallback(() => dispatch({ type: 'REDO' }), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (e.ctrlKey && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    state: history.present,
    dispatch,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    undo,
    redo,
  };
}
