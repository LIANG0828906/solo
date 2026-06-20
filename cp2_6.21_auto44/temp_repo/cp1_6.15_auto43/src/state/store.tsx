import React, { createContext, useContext, useEffect, useReducer } from 'react';
import type { AppState, Action, AppContextValue } from '../types';
import { loadState, saveState } from '../utils/storage';

const initialState: AppState = {
  tasks: [],
  pomodoroRecords: [],
  activeTaskId: null,
  theme: 'light',
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, ...action.payload };

    case 'ADD_TASK':
      return {
        ...state,
        tasks: [...state.tasks, action.payload],
      };

    case 'UPDATE_TASK': {
      const { id, ...updates } = action.payload;
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
        ),
      };
    }

    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter((t) => t.id !== action.payload),
        pomodoroRecords: state.pomodoroRecords.filter((r) => r.taskId !== action.payload),
      };

    case 'MOVE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.payload.id
            ? { ...t, status: action.payload.status, updatedAt: new Date().toISOString() }
            : t
        ),
      };

    case 'SET_ACTIVE_TASK':
      return {
        ...state,
        activeTaskId: action.payload,
      };

    case 'COMPLETE_POMODORO': {
      const record = action.payload;
      return {
        ...state,
        pomodoroRecords: [...state.pomodoroRecords, record],
        tasks: state.tasks.map((t) =>
          t.id === record.taskId
            ? { ...t, completedPomodoros: t.completedPomodoros + 1, updatedAt: new Date().toISOString() }
            : t
        ),
      };
    }

    case 'TOGGLE_THEME':
      return {
        ...state,
        theme: state.theme === 'light' ? 'dark' : 'light',
      };

    default:
      return state;
  }
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    let mounted = true;
    loadState().then((saved) => {
      if (mounted && saved) {
        dispatch({ type: 'HYDRATE', payload: saved });
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const { tasks, pomodoroRecords, theme } = state;
    saveState({ tasks, pomodoroRecords, theme });
  }, [state.tasks, state.pomodoroRecords, state.theme]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within AppProvider');
  }
  return ctx;
}
