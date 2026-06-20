import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import {
  StyleId,
  FurnitureType,
  MaterialType,
  DecorationType,
  SizeType,
  DecorationState,
  FurnitureState,
  STYLES,
  getStyleById,
  createFurnitureFromStyle,
  updateFurnitureColor,
  updateFurnitureMaterial,
  DECORATION_LIMITS,
} from './roomData';

interface RoomState {
  currentStyle: StyleId;
  furniture: FurnitureState[];
  decorations: DecorationState[];
  furnitureAdjustCount: number;
}

type RoomAction =
  | { type: 'CHANGE_STYLE'; styleId: StyleId }
  | { type: 'UPDATE_FURNITURE_COLOR'; id: FurnitureType; color: string }
  | { type: 'UPDATE_FURNITURE_MATERIAL'; id: FurnitureType; material: MaterialType }
  | { type: 'ADD_DECORATION'; decorationType: DecorationType; x: number; y: number }
  | { type: 'REMOVE_DECORATION'; id: string }
  | { type: 'UPDATE_DECORATION_SIZE'; id: string; size: SizeType }
  | { type: 'UPDATE_DECORATION_POSITION'; id: string; x: number; y: number };

const initialStyle: StyleId = 'nordic';
const initialStyleConfig = getStyleById(initialStyle);

const initialState: RoomState = {
  currentStyle: initialStyle,
  furniture: createFurnitureFromStyle(initialStyleConfig),
  decorations: [],
  furnitureAdjustCount: 0,
};

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function roomReducer(state: RoomState, action: RoomAction): RoomState {
  switch (action.type) {
    case 'CHANGE_STYLE': {
      const newStyle = getStyleById(action.styleId);
      return {
        ...state,
        currentStyle: action.styleId,
        furniture: createFurnitureFromStyle(newStyle),
      };
    }
    case 'UPDATE_FURNITURE_COLOR': {
      return {
        ...state,
        furniture: updateFurnitureColor(state.furniture, action.id, action.color),
        furnitureAdjustCount: state.furnitureAdjustCount + 1,
      };
    }
    case 'UPDATE_FURNITURE_MATERIAL': {
      return {
        ...state,
        furniture: updateFurnitureMaterial(state.furniture, action.id, action.material),
        furnitureAdjustCount: state.furnitureAdjustCount + 1,
      };
    }
    case 'ADD_DECORATION': {
      const count = state.decorations.filter((d) => d.type === action.decorationType).length;
      if (count >= DECORATION_LIMITS[action.decorationType]) {
        return state;
      }
      const newDecoration: DecorationState = {
        id: generateId(),
        type: action.decorationType,
        x: action.x,
        y: action.y,
        size: 'medium',
      };
      return {
        ...state,
        decorations: [...state.decorations, newDecoration],
      };
    }
    case 'REMOVE_DECORATION': {
      return {
        ...state,
        decorations: state.decorations.filter((d) => d.id !== action.id),
      };
    }
    case 'UPDATE_DECORATION_SIZE': {
      return {
        ...state,
        decorations: state.decorations.map((d) =>
          d.id === action.id ? { ...d, size: action.size } : d
        ),
      };
    }
    case 'UPDATE_DECORATION_POSITION': {
      return {
        ...state,
        decorations: state.decorations.map((d) =>
          d.id === action.id ? { ...d, x: action.x, y: action.y } : d
        ),
      };
    }
    default:
      return state;
  }
}

interface RoomContextValue {
  state: RoomState;
  dispatch: React.Dispatch<RoomAction>;
  styles: typeof STYLES;
}

const RoomContext = createContext<RoomContextValue | undefined>(undefined);

export function RoomStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(roomReducer, initialState);

  return (
    <RoomContext.Provider value={{ state, dispatch, styles: STYLES }}>
      {children}
    </RoomContext.Provider>
  );
}

export function useRoomState() {
  const context = useContext(RoomContext);
  if (context === undefined) {
    throw new Error('useRoomState must be used within a RoomStateProvider');
  }
  return context;
}
