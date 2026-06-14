import { create } from 'zustand';
import type { Note, User, ViewMode, ColorFilter } from '../utils/types';

interface BoardState {
  currentUser: User | null;
  roomId: string;
  notes: Note[];
  users: User[];
  viewMode: ViewMode;
  colorFilter: ColorFilter;
  scale: number;
  offset: { x: number; y: number };
  isDragging: boolean;
  dragNoteId: string | null;
  editingNoteId: string | null;
  hoverGroup: string | null;
  
  setCurrentUser: (user: User) => void;
  setRoomId: (roomId: string) => void;
  setNotes: (notes: Note[]) => void;
  addNote: (note: Note) => void;
  updateNote: (noteId: string, updates: Partial<Note>) => void;
  deleteNote: (noteId: string) => void;
  moveNote: (noteId: string, x: number, y: number, group?: 'problem' | 'solution' | 'action') => void;
  updateNoteVotes: (noteId: string, votes: string[]) => void;
  setUsers: (users: User[]) => void;
  addUser: (user: User) => void;
  removeUser: (userId: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setColorFilter: (filter: ColorFilter) => void;
  setScale: (scale: number) => void;
  setOffset: (offset: { x: number; y: number }) => void;
  setIsDragging: (isDragging: boolean) => void;
  setDragNoteId: (id: string | null) => void;
  setEditingNoteId: (id: string | null) => void;
  setHoverGroup: (groupId: string | null) => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  currentUser: null,
  roomId: 'default',
  notes: [],
  users: [],
  viewMode: 'free',
  colorFilter: 'all',
  scale: 1,
  offset: { x: 0, y: 0 },
  isDragging: false,
  dragNoteId: null,
  editingNoteId: null,
  hoverGroup: null,

  setCurrentUser: (user) => set({ currentUser: user }),
  setRoomId: (roomId) => set({ roomId }),
  setNotes: (notes) => set({ notes }),
  addNote: (note) => set((state) => ({ notes: [...state.notes, note] })),
  updateNote: (noteId, updates) => set((state) => ({
    notes: state.notes.map((n) =>
      n.id === noteId ? { ...n, ...updates } : n
    ),
  })),
  deleteNote: (noteId) => set((state) => ({
    notes: state.notes.filter((n) => n.id !== noteId),
  })),
  moveNote: (noteId, x, y, group) => set((state) => ({
    notes: state.notes.map((n) =>
      n.id === noteId ? { ...n, x, y, group: (group ?? n.group) as Note['group'] } : n
    ),
  })),
  updateNoteVotes: (noteId, votes) => set((state) => ({
    notes: state.notes.map((n) =>
      n.id === noteId ? { ...n, votes } : n
    ),
  })),
  setUsers: (users) => set({ users }),
  addUser: (user) => set((state) => ({
    users: [...state.users.filter((u) => u.id !== user.id), user],
  })),
  removeUser: (userId) => set((state) => ({
    users: state.users.filter((u) => u.id !== userId),
  })),
  setViewMode: (viewMode) => set({ viewMode }),
  setColorFilter: (colorFilter) => set({ colorFilter }),
  setScale: (scale) => set({ scale }),
  setOffset: (offset) => set({ offset }),
  setIsDragging: (isDragging) => set({ isDragging }),
  setDragNoteId: (dragNoteId) => set({ dragNoteId }),
  setEditingNoteId: (editingNoteId) => set({ editingNoteId }),
  setHoverGroup: (hoverGroup) => set({ hoverGroup }),
}));
