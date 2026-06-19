import { create } from 'zustand';
import { Note } from './types';

interface NoteStore {
  notes: Note[];
  searchQuery: string;
  activeTag: string | null;
  addNote: (note: Note) => void;
  deleteNote: (id: string) => void;
  updateNote: (id: string, updates: Partial<Omit<Note, 'id'>>) => void;
  setSearchQuery: (query: string) => void;
  setActiveTag: (tag: string | null) => void;
}

export const useNoteStore = create<NoteStore>((set) => ({
  notes: [],
  searchQuery: '',
  activeTag: null,
  addNote: (note) =>
    set((state) => ({ notes: [note, ...state.notes] })),
  deleteNote: (id) =>
    set((state) => ({ notes: state.notes.filter((n) => n.id !== id) })),
  updateNote: (id, updates) =>
    set((state) => ({
      notes: state.notes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
    })),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setActiveTag: (tag) => set({ activeTag: tag }),
}));
