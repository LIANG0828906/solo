import { create } from 'zustand';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';
import { MAX_VERSIONS } from '../utils/constants';

export interface Version {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  charCount: number;
  lineCount: number;
  versionHistory: Version[];
}

interface NoteState {
  notes: Note[];
  currentNoteId: string | null;
  searchQuery: string;
  selectedTag: string | null;
  isLoading: boolean;
  isSaving: boolean;
  filteredNotes: Note[];
}

interface NoteActions {
  createNote: () => Note;
  updateNote: (id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>) => void;
  deleteNote: (id: string) => void;
  setCurrentNote: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSelectedTag: (tag: string | null) => void;
  addTag: (noteId: string, tag: string) => void;
  removeTag: (noteId: string, tag: string) => void;
  restoreVersion: (noteId: string, versionId: string) => void;
  deleteVersion: (noteId: string, versionId: string) => void;
  loadNotes: () => Promise<void>;
  saveNotes: () => Promise<void>;
}

export type NoteStore = NoteState & NoteActions;

const calculateStats = (content: string) => {
  const charCount = content.length;
  const lineCount = content ? content.split('\n').length : 0;
  return { charCount, lineCount };
};

export const useNoteStore = create<NoteStore>((set, get) => {
  const saveToIndexedDB = async (notes: Note[]) => {
    set({ isSaving: true });
    try {
      await idbSet('notes', notes);
    } finally {
      set({ isSaving: false });
    }
  };

  return {
    notes: [],
    currentNoteId: null,
    searchQuery: '',
    selectedTag: null,
    isLoading: true,
    isSaving: false,

    get filteredNotes() {
      const { notes, searchQuery, selectedTag } = get();
      return notes.filter((note) => {
        const matchesSearch =
          searchQuery === '' ||
          note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesTag = selectedTag === null || note.tags.includes(selectedTag);

        return matchesSearch && matchesTag;
      });
    },

    createNote: () => {
      const now = Date.now();
      const newNote: Note = {
        id: uuidv4(),
        title: '未命名笔记',
        content: '',
        tags: [],
        createdAt: now,
        updatedAt: now,
        charCount: 0,
        lineCount: 0,
        versionHistory: [],
      };

      set((state) => {
        const updatedNotes = [newNote, ...state.notes];
        saveToIndexedDB(updatedNotes);
        return {
          notes: updatedNotes,
          currentNoteId: newNote.id,
        };
      });

      return newNote;
    },

    updateNote: (id, updates) => {
      set((state) => {
        const updatedNotes = state.notes.map((note) => {
          if (note.id !== id) return note;

          const newContent = updates.content !== undefined ? updates.content : note.content;
          const newTitle = updates.title !== undefined ? updates.title : note.title;
          const { charCount, lineCount } = calculateStats(newContent);

          const contentChanged = newContent !== note.content || newTitle !== note.title;
          const newVersionHistory = [...note.versionHistory];

          if (contentChanged) {
            const version: Version = {
              id: uuidv4(),
              title: note.title,
              content: note.content,
              tags: [...note.tags],
              createdAt: note.updatedAt,
            };
            newVersionHistory.unshift(version);
            if (newVersionHistory.length > MAX_VERSIONS) {
              newVersionHistory.length = MAX_VERSIONS;
            }
          }

          return {
            ...note,
            ...updates,
            charCount,
            lineCount,
            updatedAt: Date.now(),
            versionHistory: newVersionHistory,
          };
        });

        saveToIndexedDB(updatedNotes);
        return { notes: updatedNotes };
      });
    },

    deleteNote: (id) => {
      set((state) => {
        const updatedNotes = state.notes.filter((note) => note.id !== id);
        const newCurrentNoteId =
          state.currentNoteId === id
            ? updatedNotes.length > 0
              ? updatedNotes[0].id
              : null
            : state.currentNoteId;

        saveToIndexedDB(updatedNotes);
        return {
          notes: updatedNotes,
          currentNoteId: newCurrentNoteId,
        };
      });
    },

    setCurrentNote: (id) => {
      set({ currentNoteId: id });
    },

    setSearchQuery: (query) => {
      set({ searchQuery: query });
    },

    setSelectedTag: (tag) => {
      set({ selectedTag: tag });
    },

    addTag: (noteId, tag) => {
      set((state) => {
        const updatedNotes = state.notes.map((note) => {
          if (note.id !== noteId) return note;
          if (note.tags.includes(tag)) return note;
          return {
            ...note,
            tags: [...note.tags, tag],
            updatedAt: Date.now(),
          };
        });

        saveToIndexedDB(updatedNotes);
        return { notes: updatedNotes };
      });
    },

    removeTag: (noteId, tag) => {
      set((state) => {
        const updatedNotes = state.notes.map((note) => {
          if (note.id !== noteId) return note;
          return {
            ...note,
            tags: note.tags.filter((t) => t !== tag),
            updatedAt: Date.now(),
          };
        });

        saveToIndexedDB(updatedNotes);
        return { notes: updatedNotes };
      });
    },

    restoreVersion: (noteId, versionId) => {
      set((state) => {
        const updatedNotes = state.notes.map((note) => {
          if (note.id !== noteId) return note;

          const version = note.versionHistory.find((v) => v.id === versionId);
          if (!version) return note;

          const currentSnapshot: Version = {
            id: uuidv4(),
            title: note.title,
            content: note.content,
            tags: [...note.tags],
            createdAt: note.updatedAt,
          };

          const newVersionHistory = note.versionHistory
            .filter((v) => v.id !== versionId)
            .filter((v) => v.id !== currentSnapshot.id);
          newVersionHistory.unshift(currentSnapshot);
          if (newVersionHistory.length > MAX_VERSIONS) {
            newVersionHistory.length = MAX_VERSIONS;
          }

          const { charCount, lineCount } = calculateStats(version.content);

          return {
            ...note,
            title: version.title,
            content: version.content,
            tags: [...version.tags],
            charCount,
            lineCount,
            updatedAt: Date.now(),
            versionHistory: newVersionHistory,
          };
        });

        saveToIndexedDB(updatedNotes);
        return { notes: updatedNotes };
      });
    },

    deleteVersion: (noteId, versionId) => {
      set((state) => {
        const updatedNotes = state.notes.map((note) => {
          if (note.id !== noteId) return note;
          return {
            ...note,
            versionHistory: note.versionHistory.filter((v) => v.id !== versionId),
          };
        });

        saveToIndexedDB(updatedNotes);
        return { notes: updatedNotes };
      });
    },

    loadNotes: async () => {
      set({ isLoading: true });
      try {
        const storedNotes = await idbGet('notes') as Note[] | undefined;
        if (storedNotes && Array.isArray(storedNotes)) {
          set({
            notes: storedNotes,
            currentNoteId: storedNotes.length > 0 ? storedNotes[0].id : null,
          });
        }
      } finally {
        set({ isLoading: false });
      }
    },

    saveNotes: async () => {
      const { notes } = get();
      await saveToIndexedDB(notes);
    },
  };
});
