import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  name: string;
  avatar: string;
  role: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  members: string[];
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'in-progress' | 'done';
  assignee: string;
  order: number;
  createdAt: string;
}

export interface Checkin {
  id: string;
  userId: string;
  projectId: string;
  content: string;
  createdAt: string;
}

export interface Message {
  id: string;
  userId: string;
  projectId: string;
  content: string;
  createdAt: string;
  isPinned: boolean;
}

interface State {
  users: User[];
  projects: Project[];
  tasks: Task[];
  checkins: Checkin[];
  messages: Message[];
  currentUserId: string | null;
}

type Action =
  | { type: 'SET_USER'; payload: User }
  | { type: 'CREATE_PROJECT'; payload: Omit<Project, 'id' | 'createdAt' | 'members'> }
  | { type: 'JOIN_PROJECT'; payload: { projectId: string; userId: string } }
  | { type: 'ADD_TASK'; payload: Omit<Task, 'id' | 'createdAt' | 'order'> }
  | { type: 'UPDATE_TASK_ORDER'; payload: { taskId: string; newStatus: Task['status']; newOrder: number } }
  | { type: 'ADD_CHECKIN'; payload: Omit<Checkin, 'id' | 'createdAt'> }
  | { type: 'ADD_MESSAGE'; payload: Omit<Message, 'id' | 'createdAt' | 'isPinned'> }
  | { type: 'PIN_MESSAGE'; payload: { messageId: string; isPinned: boolean } };

const STORAGE_KEY = 'project-store';

const initialState: State = {
  users: [],
  projects: [],
  tasks: [],
  checkins: [],
  messages: [],
  currentUserId: null,
};

function loadFromStorage(): State {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load from localStorage:', e);
  }
  return initialState;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_USER': {
      const existingUserIndex = state.users.findIndex(u => u.id === action.payload.id);
      let newUsers: User[];
      if (existingUserIndex >= 0) {
        newUsers = state.users.map((u, i) =>
          i === existingUserIndex ? action.payload : u
        );
      } else {
        newUsers = [...state.users, action.payload];
      }
      return {
        ...state,
        users: newUsers,
        currentUserId: action.payload.id,
      };
    }

    case 'CREATE_PROJECT': {
      const newProject: Project = {
        ...action.payload,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        members: [action.payload.createdBy],
      };
      return {
        ...state,
        projects: [...state.projects, newProject],
      };
    }

    case 'JOIN_PROJECT': {
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.payload.projectId && !p.members.includes(action.payload.userId)
            ? { ...p, members: [...p.members, action.payload.userId] }
            : p
        ),
      };
    }

    case 'ADD_TASK': {
      const maxOrder = state.tasks
        .filter(t => t.projectId === action.payload.projectId && t.status === action.payload.status)
        .reduce((max, t) => Math.max(max, t.order), -1);
      
      const newTask: Task = {
        ...action.payload,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        order: maxOrder + 1,
      };
      return {
        ...state,
        tasks: [...state.tasks, newTask],
      };
    }

    case 'UPDATE_TASK_ORDER': {
      const { taskId, newStatus, newOrder } = action.payload;
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === taskId
            ? { ...t, status: newStatus, order: newOrder }
            : t
        ),
      };
    }

    case 'ADD_CHECKIN': {
      const newCheckin: Checkin = {
        ...action.payload,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
      };
      return {
        ...state,
        checkins: [...state.checkins, newCheckin],
      };
    }

    case 'ADD_MESSAGE': {
      const newMessage: Message = {
        ...action.payload,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        isPinned: false,
      };
      return {
        ...state,
        messages: [...state.messages, newMessage],
      };
    }

    case 'PIN_MESSAGE': {
      const { messageId, isPinned } = action.payload;
      return {
        ...state,
        messages: state.messages.map(m =>
          m.id === messageId ? { ...m, isPinned } : m
        ),
      };
    }

    default:
      return state;
  }
}

interface ProjectStoreContextType {
  state: State;
  dispatch: React.Dispatch<Action>;
}

const ProjectStoreContext = createContext<ProjectStoreContextType | undefined>(undefined);

interface ProjectStoreProviderProps {
  children: ReactNode;
}

export function ProjectStoreProvider({ children }: ProjectStoreProviderProps) {
  const [state, dispatch] = useReducer(reducer, undefined, loadFromStorage);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }, [state]);

  return React.createElement(
    ProjectStoreContext.Provider,
    { value: { state, dispatch } },
    children
  );
}

export function useProjectStore(): ProjectStoreContextType {
  const context = useContext(ProjectStoreContext);
  if (context === undefined) {
    throw new Error('useProjectStore must be used within a ProjectStoreProvider');
  }
  return context;
}
