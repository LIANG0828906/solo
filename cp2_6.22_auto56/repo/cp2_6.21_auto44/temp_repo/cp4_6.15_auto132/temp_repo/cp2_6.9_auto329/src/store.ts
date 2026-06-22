import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { AppState, AppAction, PrescriptionItem } from './types';
import { SAMPLE_PRESCRIPTION } from './data/herbs';

const initialState: AppState = {
  currentPhase: 'selecting',
  selectedHerb: null,
  poundingCount: 0,
  scaleWeight: 0,
  prescription: SAMPLE_PRESCRIPTION,
  isDragging: false,
  draggedObject: null,
  draggedHerbId: null,
  showToast: false,
  toastMessage: '',
  pillAnimationActive: false,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SELECT_HERB':
      return { ...state, selectedHerb: action.payload };

    case 'DESELECT_HERB':
      return { ...state, selectedHerb: null, poundingCount: 0 };

    case 'SET_PHASE':
      return { ...state, currentPhase: action.payload };

    case 'INCREMENT_POUNDING':
      return { ...state, poundingCount: state.poundingCount + 1 };

    case 'RESET_POUNDING':
      return { ...state, poundingCount: 0 };

    case 'SET_SCALE_WEIGHT':
      return { ...state, scaleWeight: action.payload };

    case 'START_DRAGGING':
      return {
        ...state,
        isDragging: true,
        draggedObject: action.payload,
        draggedHerbId: action.herbId ?? null,
      };

    case 'STOP_DRAGGING':
      return { ...state, isDragging: false, draggedObject: null, draggedHerbId: null };

    case 'UPDATE_PRESCRIPTION_ITEM': {
      const updatedPrescription = state.prescription.map((item) =>
        item.id === action.payload.id ? { ...item, ...action.payload.updates } : item
      );
      return { ...state, prescription: updatedPrescription };
    }

    case 'COMPLETE_PRESCRIPTION_ITEM': {
      const updatedPrescription = state.prescription.map((item) =>
        item.id === action.payload
          ? { ...item, status: 'completed' as const, currentWeight: item.requiredDosage }
          : item
      );
      const allCompleted = updatedPrescription.every(
        (item) => item.status === 'completed'
      );
      return {
        ...state,
        prescription: updatedPrescription,
        currentPhase: allCompleted ? 'completed' : 'selecting',
        selectedHerb: null,
        poundingCount: 0,
        scaleWeight: 0,
      };
    }

    case 'CHECK_ALL_COMPLETED': {
      const allCompleted = state.prescription.every(
        (item) => item.status === 'completed'
      );
      return {
        ...state,
        currentPhase: allCompleted ? 'completed' : state.currentPhase,
      };
    }

    case 'SHOW_TOAST':
      return { ...state, showToast: true, toastMessage: action.payload };

    case 'HIDE_TOAST':
      return { ...state, showToast: false, toastMessage: '' };

    case 'START_PILL_ANIMATION':
      return { ...state, pillAnimationActive: true };

    case 'END_PILL_ANIMATION':
      return { ...state, pillAnimationActive: false };

    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  getPrescriptionItem: (herbId: string) => PrescriptionItem | undefined;
  isAllCompleted: () => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const getPrescriptionItem = (herbId: string) => {
    return state.prescription.find((item) => item.herbId === herbId);
  };

  const isAllCompleted = () => {
    return state.prescription.every((item) => item.status === 'completed');
  };

  return (
    <AppContext.Provider value={{ state, dispatch, getPrescriptionItem, isAllCompleted }}>
      {children}
    </AppContext.Provider>
  );
}

export function useStore() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useStore must be used within an AppProvider');
  }
  return context;
}
