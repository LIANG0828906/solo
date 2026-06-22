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
  linkedNotes: Record<string, string[]>;
  linkedNotesCache: Record<string, Note[]>;
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
  fetchLinkedNotes: (noteId: string) => Promise<Note[]>;
  updateGraphNodePosition: (nodeId: string, x: number, y: number) => void;
  clearNodePositions: () => void;
}

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: [],
  currentNote: null,
  searchKeyword: '',
  tagFilter: [],
  graphData: null,
  backlinks: [],
  loading: false,
  linkedNotes: {},
  linkedNotesCache: {},

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
      const newNote = res.data;
      set((s) => {
        const newLinkedNotesCache = { ...s.linkedNotesCache };
        delete newLinkedNotesCache[newNote.id];
        Object.keys(newLinkedNotesCache).forEach((id) => {
          if (newNote.referenceIds?.includes(id) || s.notes.find(n => n.id === id)?.referenceIds?.includes(newNote.id)) {
            delete newLinkedNotesCache[id];
          }
        });
        return {
          notes: [...s.notes, newNote],
          linkedNotesCache: newLinkedNotesCache,
        };
      });
    } finally {
      set({ loading: false });
    }
  },

  updateNote: async (id, data) => {
    set({ loading: true });
    try {
      const res = await api.put<Note>(`/notes/${id}`, data);
      const updatedNote = res.data;
      set((s) => {
        const newLinkedNotesCache = { ...s.linkedNotesCache };
        delete newLinkedNotesCache[id];
        s.notes.forEach((n) => {
          if (n.referenceIds?.includes(id) || updatedNote.referenceIds?.includes(n.id)) {
            delete newLinkedNotesCache[n.id];
          }
        });
        return {
          notes: s.notes.map((n) => (n.id === id ? updatedNote : n)),
          currentNote: s.currentNote?.id === id ? updatedNote : s.currentNote,
          linkedNotesCache: newLinkedNotesCache,
        };
      });
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

  fetchLinkedNotes: async (noteId: string) => {
    const { linkedNotesCache, notes } = get();
    if (linkedNotesCache[noteId]) {
      return linkedNotesCache[noteId];
    }
    const note = notes.find((n) => n.id === noteId);
    if (!note) {
      return [];
    }
    const referenceIds = note.referenceIds || [];
    const resolvedNotes = referenceIds
      .map((refId) => notes.find((n) => n.id === refId))
      .filter((n): n is Note => n !== undefined);
    set((s) => ({
      linkedNotes: {
        ...s.linkedNotes,
        [noteId]: referenceIds,
      },
      linkedNotesCache: {
        ...s.linkedNotesCache,
        [noteId]: resolvedNotes,
      },
    }));
    return resolvedNotes;
  },

  updateGraphNodePosition: (nodeId: string, x: number, y: number) => {
    set((s) => {
      if (!s.graphData) return {};
      return {
        graphData: {
          ...s.graphData,
          nodes: s.graphData.nodes.map((node) =>
            node.id === nodeId ? { ...node, fx: x, fy: y } : node
          ),
        },
      };
    });
  },

  clearNodePositions: () => {
    set((s) => {
      if (!s.graphData) return {};
      return {
        graphData: {
          ...s.graphData,
          nodes: s.graphData.nodes.map((node) => ({ ...node, fx: null, fy: null })),
        },
      };
    });
  },
}));
