import { create } from 'zustand';
import type { Note, Comment } from '@/types';
import { fetchNotes, createNote as apiCreateNote, likeNote as apiLikeNote, addComment as apiAddComment } from '@/utils/mockApi';

interface NotesState {
  notes: Note[];
  loading: boolean;
  page: number;
  hasMore: boolean;
  currentUserId: string;
  fetchInitialNotes: () => Promise<void>;
  loadMoreNotes: () => Promise<void>;
  addNote: (content: string, tags: string[]) => Promise<void>;
  likeNote: (noteId: string) => Promise<void>;
  addComment: (noteId: string, content: string) => Promise<void>;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  loading: false,
  page: 0,
  hasMore: true,
  currentUserId: 'user-1',

  fetchInitialNotes: async () => {
    set({ loading: true, page: 1 });
    const notes = await fetchNotes(1, 20);
    set({ notes, loading: false, hasMore: notes.length >= 20 });
  },

  loadMoreNotes: async () => {
    const { loading, hasMore, page } = get();
    if (loading || !hasMore) return;
    set({ loading: true });
    const nextPage = page + 1;
    const newNotes = await fetchNotes(nextPage, 20);
    set(state => ({
      notes: [...state.notes, ...newNotes],
      page: nextPage,
      loading: false,
      hasMore: newNotes.length >= 20,
    }));
  },

  addNote: async (content: string, tags: string[]) => {
    const newNote = await apiCreateNote(content, tags);
    set(state => ({
      notes: [newNote, ...state.notes],
    }));
  },

  likeNote: async (noteId: string) => {
    const result = await apiLikeNote(noteId);
    if (result.success) {
      set(state => ({
        notes: state.notes.map(note =>
          note.id === noteId
            ? {
                ...note,
                likes: result.likes,
                likeHistory: [...note.likeHistory, { timestamp: Date.now() }],
              }
            : note
        ),
      }));
    }
  },

  addComment: async (noteId: string, content: string) => {
    const result = await apiAddComment(noteId, content);
    if (result.success && result.comment) {
      set(state => ({
        notes: state.notes.map(note =>
          note.id === noteId
            ? { ...note, comments: [...note.comments, result.comment as Comment] }
            : note
        ),
      }));
    }
  },
}));
