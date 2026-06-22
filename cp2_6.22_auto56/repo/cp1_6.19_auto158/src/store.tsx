import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from 'react';
import type { MythInfo } from './constellation/MythLibrary';

export interface StarPoint {
  id: number;
  x: number;
  y: number;
  diameter: number;
  brightness: number;
  color: string;
  breathPeriod: number;
}

export interface CollectionEntry {
  id: string;
  stars: StarPoint[];
  selectedIndices: number[];
  myth: MythInfo | null;
  thumbnail: string;
}

export interface AppState {
  stars: StarPoint[];
  selectedIndices: number[];
  selfIntersecting: boolean;
  intersectionPoints: { x: number; y: number }[];
  lineDistances: number[];
  polygonArea: number;
  completedPatterns: CollectionEntry[];
  currentMyth: MythInfo | null;
  hoveredStarId: number | null;
  mousePos: { x: number; y: number } | null;
}

const initialState: AppState = {
  stars: [],
  selectedIndices: [],
  selfIntersecting: false,
  intersectionPoints: [],
  lineDistances: [],
  polygonArea: 0,
  completedPatterns: [],
  currentMyth: null,
  hoveredStarId: null,
  mousePos: null,
};

export type Action =
  | { type: 'SET_STARS'; stars: StarPoint[] }
  | { type: 'SELECT_STAR'; index: number }
  | { type: 'DESELECT_LAST' }
  | { type: 'RESET_SELECTION' }
  | { type: 'SET_SELF_INTERSECTION'; points: { x: number; y: number }[] }
  | { type: 'CLEAR_SELF_INTERSECTION' }
  | { type: 'SET_LINE_DISTANCES'; distances: number[] }
  | { type: 'SET_POLYGON_AREA'; area: number }
  | { type: 'SET_CURRENT_MYTH'; myth: MythInfo | null }
  | { type: 'ADD_TO_COLLECTION'; entry: CollectionEntry }
  | { type: 'SET_HOVERED_STAR'; id: number | null }
  | { type: 'SET_MOUSE_POS'; pos: { x: number; y: number } | null }
  | { type: 'LOAD_COLLECTION_ENTRY'; entry: CollectionEntry };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_STARS':
      return { ...state, stars: action.stars, selectedIndices: [], selfIntersecting: false, intersectionPoints: [], lineDistances: [], polygonArea: 0, currentMyth: null };
    case 'SELECT_STAR': {
      if (state.selectedIndices.length >= 20 || state.selfIntersecting) return state;
      return { ...state, selectedIndices: [...state.selectedIndices, action.index] };
    }
    case 'DESELECT_LAST': {
      const newSelected = state.selectedIndices.slice(0, -1);
      return { ...state, selectedIndices: newSelected, selfIntersecting: false, intersectionPoints: [] };
    }
    case 'RESET_SELECTION':
      return { ...state, selectedIndices: [], selfIntersecting: false, intersectionPoints: [], lineDistances: [], polygonArea: 0, currentMyth: null };
    case 'SET_SELF_INTERSECTION':
      return { ...state, selfIntersecting: true, intersectionPoints: action.points };
    case 'CLEAR_SELF_INTERSECTION':
      return { ...state, selfIntersecting: false, intersectionPoints: [] };
    case 'SET_LINE_DISTANCES':
      return { ...state, lineDistances: action.distances };
    case 'SET_POLYGON_AREA':
      return { ...state, polygonArea: action.area };
    case 'SET_CURRENT_MYTH':
      return { ...state, currentMyth: action.myth };
    case 'ADD_TO_COLLECTION': {
      const existing = state.completedPatterns;
      if (existing.length >= 10) {
        const trimmed = existing.slice(1);
        return { ...state, completedPatterns: [...trimmed, action.entry] };
      }
      return { ...state, completedPatterns: [...existing, action.entry] };
    }
    case 'SET_HOVERED_STAR':
      return { ...state, hoveredStarId: action.id };
    case 'SET_MOUSE_POS':
      return { ...state, mousePos: action.pos };
    case 'LOAD_COLLECTION_ENTRY':
      return { ...state, selectedIndices: action.entry.selectedIndices, currentMyth: action.entry.myth, selfIntersecting: false, intersectionPoints: [] };
    default:
      return state;
  }
}

export const AppContext = createContext<{
  state: AppState;
  dispatch: Dispatch<Action>;
}>({ state: initialState, dispatch: () => {} });

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  return useContext(AppContext);
}
