import type { AppState, Action } from '@/types';
import { CONSTANTS } from '@/constants';

export const initialState: AppState = {
  strokes: [],
  notes: [],
  connections: [],
  currentTool: 'pen',
  currentColor: CONSTANTS.DEFAULT_COLOR,
  currentWidth: CONSTANTS.DEFAULT_WIDTH,
  transform: { x: 0, y: 0, scale: 1 },
  selectedNoteId: null,
  selectedConnectionId: null,
  connectionStartId: null,
  connectionCurvature: 1,
  isSyncConnected: false,
};

export function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_TOOL':
      return { ...state, currentTool: action.payload };

    case 'SET_COLOR':
      return { ...state, currentColor: action.payload };

    case 'SET_WIDTH':
      return { ...state, currentWidth: action.payload };

    case 'ADD_STROKE':
      return { ...state, strokes: [...state.strokes, action.payload] };

    case 'UPDATE_STROKE':
      return {
        ...state,
        strokes: state.strokes.map((s) =>
          s.id === action.payload.id ? action.payload : s
        ),
      };

    case 'ADD_NOTE':
      return { ...state, notes: [...state.notes, action.payload] };

    case 'UPDATE_NOTE':
      return {
        ...state,
        notes: state.notes.map((n) =>
          n.id === action.payload.id ? action.payload : n
        ),
      };

    case 'DELETE_NOTE': {
      const noteId = action.payload;
      return {
        ...state,
        notes: state.notes.filter((n) => n.id !== noteId),
        connections: state.connections.filter(
          (c) => c.fromNoteId !== noteId && c.toNoteId !== noteId
        ),
        selectedNoteId: state.selectedNoteId === noteId ? null : state.selectedNoteId,
        connectionStartId: state.connectionStartId === noteId ? null : state.connectionStartId,
      };
    }

    case 'ADD_CONNECTION':
      return { ...state, connections: [...state.connections, action.payload] };

    case 'UPDATE_CONNECTION':
      return {
        ...state,
        connections: state.connections.map((c) =>
          c.id === action.payload.id ? action.payload : c
        ),
      };

    case 'DELETE_CONNECTION':
      return {
        ...state,
        connections: state.connections.filter((c) => c.id !== action.payload),
        selectedConnectionId: state.selectedConnectionId === action.payload ? null : state.selectedConnectionId,
      };

    case 'SET_TRANSFORM':
      return { ...state, transform: action.payload };

    case 'SELECT_NOTE':
      return { ...state, selectedNoteId: action.payload, selectedConnectionId: null };

    case 'SELECT_CONNECTION':
      return { ...state, selectedConnectionId: action.payload, selectedNoteId: null };

    case 'SET_CONNECTION_START':
      return { ...state, connectionStartId: action.payload };

    case 'SET_CONNECTION_CURVATURE':
      return { ...state, connectionCurvature: action.payload };

    case 'CLEAR_CANVAS':
      return {
        ...state,
        strokes: [],
        notes: [],
        connections: [],
        selectedNoteId: null,
        selectedConnectionId: null,
        connectionStartId: null,
      };

    case 'SET_SYNC_CONNECTED':
      return { ...state, isSyncConnected: action.payload };

    case 'SYNC_STATE':
      return { ...state, ...action.payload };

    default:
      return state;
  }
}
