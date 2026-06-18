import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from 'react';
import type { Project, Priority } from '../scheduler/TimeAllocator';
import { eventBus, PROJECTS_UPDATED } from './EventBus';

interface AppState {
  projects: Project[];
  dailyAvailableHours: number;
}

type Action =
  | { type: 'SET_PROJECTS'; payload: Project[] }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'DELETE_PROJECT'; payload: string }
  | {
      type: 'UPDATE_HOURS_INVESTED';
      payload: { projectId: string; hours: number };
    }
  | { type: 'SET_DAILY_HOURS'; payload: number };

const STORAGE_KEY = 'freelance_project_board_data';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function loadFromStorage(): Partial<AppState> | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load from localStorage:', e);
  }
  return null;
}

function saveToStorage(state: AppState): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        projects: state.projects,
        dailyAvailableHours: state.dailyAvailableHours,
      })
    );
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

const initialState: AppState = {
  projects: [],
  dailyAvailableHours: 8,
};

function appReducer(state: AppState, action: Action): AppState {
  let newState: AppState;

  switch (action.type) {
    case 'SET_PROJECTS':
      newState = { ...state, projects: action.payload };
      break;
    case 'ADD_PROJECT':
      newState = { ...state, projects: [...state.projects, action.payload] };
      break;
    case 'UPDATE_PROJECT':
      newState = {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.payload.id ? action.payload : p
        ),
      };
      break;
    case 'DELETE_PROJECT':
      newState = {
        ...state,
        projects: state.projects.filter((p) => p.id !== action.payload),
      };
      break;
    case 'UPDATE_HOURS_INVESTED':
      newState = {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.payload.projectId
            ? { ...p, hoursInvested: action.payload.hours }
            : p
        ),
      };
      break;
    case 'SET_DAILY_HOURS':
      newState = { ...state, dailyAvailableHours: action.payload };
      break;
    default:
      return state;
  }

  saveToStorage(newState);
  eventBus.emit(PROJECTS_UPDATED, newState);

  return newState;
}

interface StoreContextValue {
  state: AppState;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'hoursInvested' | 'completedTasks'>) => void;
  updateProject: (project: Project) => void;
  deleteProject: (id: string) => void;
  updateHoursInvested: (projectId: string, hours: number) => void;
  setDailyAvailableHours: (hours: number) => void;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    const savedData = loadFromStorage();
    if (savedData) {
      if (savedData.projects) {
        dispatch({ type: 'SET_PROJECTS', payload: savedData.projects });
      }
      if (savedData.dailyAvailableHours) {
        dispatch({ type: 'SET_DAILY_HOURS', payload: savedData.dailyAvailableHours });
      }
    }
  }, []);

  const addProject = (
    projectData: Omit<Project, 'id' | 'createdAt' | 'hoursInvested' | 'completedTasks'>
  ) => {
    const newProject: Project = {
      ...projectData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      hoursInvested: 0,
      completedTasks: 0,
    };
    dispatch({ type: 'ADD_PROJECT', payload: newProject });
  };

  const updateProject = (project: Project) => {
    dispatch({ type: 'UPDATE_PROJECT', payload: project });
  };

  const deleteProject = (id: string) => {
    dispatch({ type: 'DELETE_PROJECT', payload: id });
  };

  const updateHoursInvested = (projectId: string, hours: number) => {
    dispatch({ type: 'UPDATE_HOURS_INVESTED', payload: { projectId, hours } });
  };

  const setDailyAvailableHours = (hours: number) => {
    dispatch({ type: 'SET_DAILY_HOURS', payload: hours });
  };

  return (
    <StoreContext.Provider
      value={{
        state,
        addProject,
        updateProject,
        deleteProject,
        updateHoursInvested,
        setDailyAvailableHours,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useAppStore(): StoreContextValue {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useAppStore must be used within a StoreProvider');
  }
  return context;
}

export type { Priority, Project };
