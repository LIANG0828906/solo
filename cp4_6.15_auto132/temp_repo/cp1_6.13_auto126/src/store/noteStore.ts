import { create } from 'zustand';
import { Note, NoteWithLinks, SearchResult, Recommendation, GraphData } from '../types';

const API_BASE = '/api';

interface NoteStore {
  notes: Note[];
  currentNote: NoteWithLinks | null;
  recommendations: Recommendation[];
  searchResults: SearchResult[];
  graphData: GraphData | null;
  loading: boolean;
  searchQuery: string;

  fetchNotes: () => Promise<void>;
  fetchNote: (id: string) => Promise<void>;
  createNote: (title: string, content: string) => Promise<Note>;
  updateNote: (id: string, title: string, content: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  searchNotes: (query: string) => Promise<void>;
  fetchRecommendations: (id: string) => Promise<void>;
  fetchGraph: () => Promise<void>;
  clearCurrentNote: () => void;
  clearSearch: () => void;
  setSearchQuery: (q: string) => void;
}

export const useNoteStore = create<NoteStore>((set) => ({
  notes: [],
  currentNote: null,
  recommendations: [],
  searchResults: [],
  graphData: null,
  loading: false,
  searchQuery: '',

  fetchNotes: async () => {
    const res = await fetch(`${API_BASE}/notes`);
    const data = await res.json();
    set({ notes: data });
  },

  fetchNote: async (id: string) => {
    set({ loading: true });
    const res = await fetch(`${API_BASE}/notes/${id}`);
    const data = await res.json();
    set({ currentNote: data, loading: false });
  },

  createNote: async (title: string, content: string) => {
    const res = await fetch(`${API_BASE}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    });
    const note = await res.json();
    set((state) => ({ notes: [note, ...state.notes] }));
    return note;
  },

  updateNote: async (id: string, title: string, content: string) => {
    const res = await fetch(`${API_BASE}/notes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    });
    const data = await res.json();
    set((state) => ({
      currentNote: data,
      notes: state.notes.map((n) => (n.id === id ? data : n)),
    }));
  },

  deleteNote: async (id: string) => {
    await fetch(`${API_BASE}/notes/${id}`, { method: 'DELETE' });
    set((state) => ({
      notes: state.notes.filter((n) => n.id !== id),
      currentNote: state.currentNote?.id === id ? null : state.currentNote,
    }));
  },

  searchNotes: async (query: string) => {
    if (!query.trim()) {
      set({ searchResults: [] });
      return;
    }
    const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    set({ searchResults: data });
  },

  fetchRecommendations: async (id: string) => {
    const res = await fetch(`${API_BASE}/notes/${id}/recommendations`);
    const data = await res.json();
    set({ recommendations: data });
  },

  fetchGraph: async () => {
    const res = await fetch(`${API_BASE}/graph`);
    const data = await res.json();
    set({ graphData: data });
  },

  clearCurrentNote: () => set({ currentNote: null, recommendations: [] }),
  clearSearch: () => set({ searchResults: [], searchQuery: '' }),
  setSearchQuery: (q: string) => set({ searchQuery: q }),
}));
