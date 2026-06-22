import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Vector3 } from 'three';

export interface CaveState {
  cavePositions: Float32Array | null;
  sourcePosition: { x: number; y: number; z: number };
  sourceFrequency: number;
  sourceIntensity: number;
  wallRoughness: number;
  viewMode: 'free' | 'follow' | 'overhead';
}

type CaveAction =
  | { type: 'SET_CAVE_POSITIONS'; payload: Float32Array }
  | { type: 'SET_SOURCE_POSITION'; payload: { x: number; y: number; z: number } }
  | { type: 'SET_SOURCE_FREQUENCY'; payload: number }
  | { type: 'SET_SOURCE_INTENSITY'; payload: number }
  | { type: 'SET_WALL_ROUGHNESS'; payload: number }
  | { type: 'SET_VIEW_MODE'; payload: 'free' | 'follow' | 'overhead' }
  | { type: 'LOAD_PRESET'; payload: CaveState }
  | { type: 'RESET' };

const initialState: CaveState = {
  cavePositions: null,
  sourcePosition: { x: 0, y: 0, z: 0 },
  sourceFrequency: 440,
  sourceIntensity: 80,
  wallRoughness: 0.5,
  viewMode: 'free',
};

function caveReducer(state: CaveState, action: CaveAction): CaveState {
  switch (action.type) {
    case 'SET_CAVE_POSITIONS':
      return { ...state, cavePositions: action.payload };
    case 'SET_SOURCE_POSITION':
      return { ...state, sourcePosition: action.payload };
    case 'SET_SOURCE_FREQUENCY':
      return { ...state, sourceFrequency: action.payload };
    case 'SET_SOURCE_INTENSITY':
      return { ...state, sourceIntensity: action.payload };
    case 'SET_WALL_ROUGHNESS':
      return { ...state, wallRoughness: action.payload };
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };
    case 'LOAD_PRESET':
      return { ...action.payload };
    case 'RESET':
      return { ...initialState };
    default:
      return state;
  }
}

interface CaveContextType {
  state: CaveState;
  dispatch: React.Dispatch<CaveAction>;
}

const CaveContext = createContext<CaveContextType | undefined>(undefined);

export function CaveProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(caveReducer, initialState);
  return (
    <CaveContext.Provider value={{ state, dispatch }}>
      {children}
    </CaveContext.Provider>
  );
}

export function useCaveContext(): CaveContextType {
  const ctx = useContext(CaveContext);
  if (!ctx) {
    throw new Error('useCaveContext must be used within a CaveProvider');
  }
  return ctx;
}
