import React, { createContext, useContext, useReducer, ReactNode, useCallback } from 'react';

export interface Note {
  id: string;
  content: string;
  color: string;
  createdAt: Date;
  themeId?: string;
}

export interface Theme {
  id: string;
  name: string;
  createdAt: Date;
}

interface ThemeState {
  notes: Note[];
  themes: Theme[];
}

type ThemeAction =
  | { type: 'ADD_NOTE'; payload: Note }
  | { type: 'DELETE_NOTE'; payload: string }
  | { type: 'ADD_THEME'; payload: { theme: Theme; noteId: string } }
  | { type: 'RENAME_THEME'; payload: { themeId: string; name: string } }
  | { type: 'ASSIGN_NOTE_TO_THEME'; payload: { noteId: string; themeId: string | undefined } }
  | { type: 'REORDER_NOTES'; payload: { noteIds: string[] } };

const NOTE_COLORS = [
  '#FFEAA7',
  '#DFE6E9',
  '#A29BFE',
  '#81ECEC',
  '#55EFC4',
  '#74B9FF',
  '#FDCB6E',
  '#E17055',
];

export const getRandomNoteColor = (): string => {
  return NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)];
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const initialState: ThemeState = {
  notes: [],
  themes: [],
};

function themeReducer(state: ThemeState, action: ThemeAction): ThemeState {
  switch (action.type) {
    case 'ADD_NOTE':
      return {
        ...state,
        notes: [action.payload, ...state.notes],
      };
    case 'DELETE_NOTE':
      return {
        ...state,
        notes: state.notes.filter(note => note.id !== action.payload),
      };
    case 'ADD_THEME':
      return {
        ...state,
        themes: [action.payload.theme, ...state.themes],
        notes: state.notes.map(note =>
          note.id === action.payload.noteId
            ? { ...note, themeId: action.payload.theme.id }
            : note
        ),
      };
    case 'RENAME_THEME':
      return {
        ...state,
        themes: state.themes.map(theme =>
          theme.id === action.payload.themeId
            ? { ...theme, name: action.payload.name }
            : theme
        ),
      };
    case 'ASSIGN_NOTE_TO_THEME':
      return {
        ...state,
        notes: state.notes.map(note =>
          note.id === action.payload.noteId
            ? { ...note, themeId: action.payload.themeId }
            : note
        ),
      };
    case 'REORDER_NOTES': {
      const reorderedNotes = action.payload.noteIds
        .map(id => state.notes.find(n => n.id === id))
        .filter((n): n is Note => n !== undefined);
      const remainingNotes = state.notes.filter(
        n => !action.payload.noteIds.includes(n.id)
      );
      return {
        ...state,
        notes: [...reorderedNotes, ...remainingNotes],
      };
    }
    default:
      return state;
  }
}

type EventCallback = (...args: unknown[]) => void;

class EventBus {
  private listeners: Map<string, EventCallback[]> = new Map();

  on(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: EventCallback): void {
    const callbacks = this.listeners.get(event);
    if (!callbacks) return;
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  emit(event: string, ...args: unknown[]): void {
    const callbacks = this.listeners.get(event);
    if (!callbacks) return;
    callbacks.forEach(callback => callback(...args));
  }
}

export const eventBus = new EventBus();

interface ThemeStoreContextType {
  state: ThemeState;
  addNote: (content: string) => void;
  deleteNote: (id: string) => void;
  addTheme: (name: string, noteId: string) => void;
  renameTheme: (themeId: string, name: string) => void;
  assignNoteToTheme: (noteId: string, themeId: string | undefined) => void;
  reorderNotes: (noteIds: string[]) => void;
}

const ThemeStoreContext = createContext<ThemeStoreContextType | undefined>(undefined);

export const ThemeStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(themeReducer, initialState);

  const addNote = useCallback((content: string) => {
    const newNote: Note = {
      id: generateId(),
      content,
      color: getRandomNoteColor(),
      createdAt: new Date(),
    };
    dispatch({ type: 'ADD_NOTE', payload: newNote });
    eventBus.emit('note:created', newNote);
  }, []);

  const deleteNote = useCallback((id: string) => {
    dispatch({ type: 'DELETE_NOTE', payload: id });
    eventBus.emit('note:deleted', id);
  }, []);

  const addTheme = useCallback((name: string, noteId: string) => {
    const newTheme: Theme = {
      id: generateId(),
      name,
      createdAt: new Date(),
    };
    dispatch({ type: 'ADD_THEME', payload: { theme: newTheme, noteId } });
    eventBus.emit('theme:created', newTheme);
  }, []);

  const renameTheme = useCallback((themeId: string, name: string) => {
    dispatch({ type: 'RENAME_THEME', payload: { themeId, name } });
    eventBus.emit('theme:renamed', { themeId, name });
  }, []);

  const assignNoteToTheme = useCallback((noteId: string, themeId: string | undefined) => {
    dispatch({ type: 'ASSIGN_NOTE_TO_THEME', payload: { noteId, themeId } });
    eventBus.emit('note:assigned', { noteId, themeId });
  }, []);

  const reorderNotes = useCallback((noteIds: string[]) => {
    dispatch({ type: 'REORDER_NOTES', payload: { noteIds } });
  }, []);

  return (
    <ThemeStoreContext.Provider
      value={{
        state,
        addNote,
        deleteNote,
        addTheme,
        renameTheme,
        assignNoteToTheme,
        reorderNotes,
      }}
    >
      {children}
    </ThemeStoreContext.Provider>
  );
};

export const useThemeStore = (): ThemeStoreContextType => {
  const context = useContext(ThemeStoreContext);
  if (!context) {
    throw new Error('useThemeStore must be used within a ThemeStoreProvider');
  }
  return context;
};
