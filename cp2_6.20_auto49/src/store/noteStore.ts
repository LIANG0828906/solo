import { create } from 'zustand';
import axios from 'axios';
import type { Note, BacklinkItem, GraphData } from '@/types';

const api = axios.create({ baseURL: '/api' });

interface NoteState {
  notes: Note[];
  currentNote: Note | null;
  searchKeyword: string;
  tagFilter: string[];
  graphData: GraphData | null;
  backlinks: BacklinkItem[];
  loading: boolean;
  fetchNotes: () => Promise<void>;
  fetchNote: (id: string) => Promise<void>;
  addNote: (data: Partial<Note>) => Promise<void>;
  updateNote: (id: string, data: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  fetchBacklinks: (id: string) => Promise<void>;
  fetchGraphData: () => Promise<void>;
  searchNotes: (keyword: string, tags?: string[], from?: string, to?: string) => Promise<void>;
  setSearchKeyword: (kw: string) => void;
  setTagFilter: (tags: string[]) => void;
}

export const useNoteStore = create<NoteState>((set) => ({
  notes: [],
  currentNote: null,
  searchKeyword: '',
  tagFilter: [],
  graphData: null,
  backlinks: [],
  loading: false,

  fetchNotes: async () => {
    set({ loading: true });
    try {
      const res = await api.get<Note[]>('/notes');
      set({ notes: res.data });
    } finally {
      set({ loading: false });
    }
  },

  fetchNote: async (id) => {
    set({ loading: true });
    try {
      const res = await api.get<Note>(`/notes/${id}`);
      set({ currentNote: res.data });
    } finally {
      set({ loading: false });
    }
  },

  addNote: async (data) => {
    set({ loading: true });
    try {
      const res = await api.post<Note>('/notes', data);
      set((s) => ({ notes: [...s.notes, res.data] }));
    } finally {
      set({ loading: false });
    }
  },

  updateNote: async (id, data) => {
    set({ loading: true });
    try {
      const res = await api.put<Note>(`/notes/${id}`, data);
      set((s) => ({
        notes: s.notes.map((n) => (n.id === id ? res.data : n)),
        currentNote: s.currentNote?.id === id ? res.data : s.currentNote,
      }));
    } finally {
      set({ loading: false });
    }
  },

  deleteNote: async (id) => {
    set({ loading: true });
    try {
      await api.delete(`/notes/${id}`);
      set((s) => ({
        notes: s.notes.filter((n) => n.id !== id),
        currentNote: s.currentNote?.id === id ? null : s.currentNote,
      }));
    } finally {
      set({ loading: false });
    }
  },

  fetchBacklinks: async (id) => {
    try {
      const res = await api.get<BacklinkItem[]>(`/notes/${id}/backlinks`);
      set({ backlinks: res.data });
    } catch {
      set({ backlinks: [] });
    }
  },

  fetchGraphData: async () => {
    set({ loading: true });
    try {
      const res = await api.get<GraphData>('/graph');
      set({ graphData: res.data });
    } finally {
      set({ loading: false });
    }
  },

  searchNotes: async (keyword, tags, from, to) => {
    set({ loading: true });
    try {
      const params = new URLSearchParams();
      if (keyword) params.set('q', keyword);
      if (tags?.length) params.set('tags', tags.join(','));
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const res = await api.get<Note[]>(`/search?${params.toString()}`);
      set({ notes: res.data });
    } finally {
      set({ loading: false });
    }
  },

  setSearchKeyword: (kw) => set({ searchKeyword: kw }),
  setTagFilter: (tags) => set({ tagFilter: tags }),
}));
