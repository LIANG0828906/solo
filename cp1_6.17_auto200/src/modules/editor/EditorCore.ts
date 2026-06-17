import { create } from 'zustand';
import type { Note, NoteType, Track, User } from '@/types';
import { NOTE_COLORS, USER_COLORS } from '@/types';
import { syncClient } from '../sync/SyncClient';

const generateId = () => Math.random().toString(36).substring(2, 15);

const MEASURE_WIDTH = 300;
const STAFF_LINE_HEIGHT = 12;
const STAFF_TOP_PADDING = 80;

interface EditorState {
  roomId: string;
  currentUser: User | null;
  users: User[];
  notes: Note[];
  tracks: Track[];
  bpm: number;
  isPlaying: boolean;
  playhead: number;
  selectedNoteType: NoteType;
  selectedNoteId: string | null;
  draggingNoteId: string | null;
  isInitialized: boolean;

  setRoomId: (id: string) => void;
  initUser: (userName?: string) => void;
  setUsers: (users: User[]) => void;
  addUser: (user: User) => void;
  removeUser: (userId: string) => void;
  updateUserCursor: (userId: string, x: number, y: number) => void;

  setNotes: (notes: Note[]) => void;
  addNote: (note: Note, remote?: boolean) => void;
  moveNote: (noteId: string, x: number, y: number, remote?: boolean) => void;
  deleteNote: (noteId: string, remote?: boolean) => void;
  setSelectedNoteType: (type: NoteType) => void;
  setSelectedNoteId: (id: string | null) => void;
  setDraggingNoteId: (id: string | null) => void;

  setTracks: (tracks: Track[]) => void;
  updateTrack: (track: Track, remote?: boolean) => void;
  setBpm: (bpm: number, remote?: boolean) => void;

  togglePlay: () => void;
  setPlayhead: (position: number) => void;
  stopPlay: () => void;

  handleCanvasClick: (x: number, y: number, trackId: string) => void;
  handleCanvasMouseMove: (x: number, y: number) => void;
  resetAnimationFlags: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  roomId: 'room-' + Math.random().toString(36).substring(2, 8),
  currentUser: null,
  users: [],
  notes: [],
  tracks: [],
  bpm: 120,
  isPlaying: false,
  playhead: 0,
  selectedNoteType: 'quarter',
  selectedNoteId: null,
  draggingNoteId: null,
  isInitialized: false,

  setRoomId: (id) => set({ roomId: id }),

  initUser: (userName) => {
    const storedUserId = localStorage.getItem('userId');
    const storedUserName = localStorage.getItem('userName');
    const userId = storedUserId || generateId();
    const name = userName || storedUserName || `用户${Math.floor(Math.random() * 1000)}`;

    if (!storedUserId) localStorage.setItem('userId', userId);
    localStorage.setItem('userName', name);

    const existingUsers = get().users;
    const assignedColor = USER_COLORS[existingUsers.length % USER_COLORS.length];

    const user: User = {
      id: userId,
      name,
      color: assignedColor,
    };

    set({ currentUser: user });
  },

  setUsers: (users) => set({ users }),

  addUser: (user) => {
    const { users, currentUser } = get();
    if (currentUser && user.id === currentUser.id) {
      set({ 
        currentUser: { ...currentUser, color: user.color },
        users: users.map(u => u.id === user.id ? user : u)
      });
    } else if (!users.find(u => u.id === user.id)) {
      set({ users: [...users, user] });
    }
  },

  removeUser: (userId) => {
    set({ users: get().users.filter(u => u.id !== userId) });
  },

  updateUserCursor: (userId, x, y) => {
    set({
      users: get().users.map(u =>
        u.id === userId ? { ...u, cursor: { x, y } } : u
      ),
    });
  },

  setNotes: (notes) => set({ notes }),

  addNote: (note, remote = false) => {
    const { notes } = get();
    const exists = notes.find(n => n.id === note.id);
    if (exists) return;

    const animatedNote = { ...note, animate: true };
    set({ notes: [...notes, animatedNote] });

    if (!remote) {
      syncClient.sendNoteAdd(note);
    }
  },

  moveNote: (noteId, x, y, remote = false) => {
    set({
      notes: get().notes.map(n =>
        n.id === noteId ? { ...n, x, y, animate: true } : n
      ),
    });

    if (!remote) {
      syncClient.sendNoteMove(noteId, x, y);
    }
  },

  deleteNote: (noteId, remote = false) => {
    set({ notes: get().notes.filter(n => n.id !== noteId) });
    set({ selectedNoteId: null });

    if (!remote) {
      syncClient.sendNoteDelete(noteId);
    }
  },

  setSelectedNoteType: (type) => set({ selectedNoteType: type }),
  setSelectedNoteId: (id) => set({ selectedNoteId: id }),
  setDraggingNoteId: (id) => set({ draggingNoteId: id }),

  setTracks: (tracks) => set({ tracks }),

  updateTrack: (track, remote = false) => {
    const { tracks } = get();
    const exists = tracks.find(t => t.id === track.id);
    if (!exists) {
      set({ tracks: [...tracks, track] });
    } else {
      set({ tracks: tracks.map(t => t.id === track.id ? track : t) });
    }

    if (!remote) {
      syncClient.sendTrackUpdate(track);
    }
  },

  setBpm: (bpm, remote = false) => {
    set({ bpm });
    if (!remote) {
      syncClient.sendBpmUpdate(bpm);
    }
  },

  togglePlay: () => {
    const { isPlaying } = get();
    if (isPlaying) {
      set({ isPlaying: false });
    } else {
      set({ isPlaying: true, playhead: 0 });
    }
  },

  setPlayhead: (position) => set({ playhead: position }),

  stopPlay: () => set({ isPlaying: false, playhead: 0 }),

  handleCanvasClick: (x, y, trackId) => {
    const state = get();
    const existingNote = state.notes.find(n => {
      const dx = Math.abs(n.x - x);
      const dy = Math.abs(n.y - y);
      return dx < 20 && dy < 20;
    });

    if (existingNote) {
      if (state.selectedNoteId === existingNote.id) {
        state.deleteNote(existingNote.id);
      } else {
        set({ selectedNoteId: existingNote.id });
      }
    } else {
      const measure = Math.floor(x / MEASURE_WIDTH);
      const beat = ((x % MEASURE_WIDTH) / MEASURE_WIDTH) * 4;

      const note: Note = {
        id: generateId(),
        type: state.selectedNoteType,
        x,
        y,
        trackId,
        measure,
        beat,
        createdAt: Date.now(),
        userId: state.currentUser?.id,
      };

      state.addNote(note);
      set({ selectedNoteId: note.id });
    }
  },

  handleCanvasMouseMove: (x, y) => {
    syncClient.sendCursorMove(x, y);
  },

  resetAnimationFlags: () => {
    set({
      notes: get().notes.map(n => ({ ...n, animate: false })),
    });
  },
}));

export const STAFF_CONSTANTS = {
  MEASURE_WIDTH,
  STAFF_LINE_HEIGHT,
  STAFF_TOP_PADDING,
  NOTE_COLORS,
};
