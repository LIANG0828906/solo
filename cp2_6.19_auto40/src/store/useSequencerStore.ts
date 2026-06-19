import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  Track,
  Note,
  Collaborator,
  CollaboratorCursor,
  AutomationPoint,
  DEFAULT_BPM,
  MAX_TRACK_HEIGHT,
  MIN_TRACK_HEIGHT,
} from '../types';

interface SequencerState {
  tracks: Track[];
  notes: Note[];
  automationPoints: AutomationPoint[];
  collaborators: Collaborator[];
  collaboratorCursors: CollaboratorCursor[];
  cursorPosition: number;
  isPlaying: boolean;
  bpm: number;
  selectedNoteId: string | null;
  zoomLevel: number;
  mainVolume: number;

  setTracks: (tracks: Track[]) => void;
  setTrackVolume: (trackId: string, volume: number) => void;
  setTrackMuted: (trackId: string, muted: boolean) => void;
  setTrackSolo: (trackId: string, solo: boolean) => void;
  setTrackHeight: (trackId: string, height: number) => void;
  setTrackSend: (trackId: string, send: number) => void;

  addNote: (note: Omit<Note, 'id'>) => void;
  removeNote: (noteId: string) => void;
  moveNote: (noteId: string, start: number, pitch: number, duration: number) => void;
  setNotes: (notes: Note[]) => void;
  setSelectedNoteId: (id: string | null) => void;

  setCursorPosition: (position: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setBpm: (bpm: number) => void;
  setZoomLevel: (level: number) => void;
  setMainVolume: (volume: number) => void;

  updateCollaboratorCursor: (cursor: CollaboratorCursor) => void;
  addAutomationPoint: (point: Omit<AutomationPoint, 'id'>) => void;
}

const defaultTracks: Track[] = [
  { id: uuidv4(), name: '钢琴', volume: 0.8, muted: false, solo: false, height: 120, send: 0, color: '#4ecdc4', instrument: 'piano' },
  { id: uuidv4(), name: '贝斯', volume: 0.7, muted: false, solo: false, height: 100, send: 0.2, color: '#ff6b6b', instrument: 'bass' },
  { id: uuidv4(), name: '鼓组', volume: 0.9, muted: false, solo: false, height: 80, send: 0.1, color: '#ffe66d', instrument: 'drums' },
  { id: uuidv4(), name: '合成器', volume: 0.6, muted: false, solo: false, height: 100, send: 0.3, color: '#a78bfa', instrument: 'synth' },
];

const defaultNotes: Note[] = [
  { id: uuidv4(), trackId: defaultTracks[0].id, pitch: 60, start: 0, duration: 2, velocity: 0.8 },
  { id: uuidv4(), trackId: defaultTracks[0].id, pitch: 64, start: 1, duration: 2, velocity: 0.8 },
  { id: uuidv4(), trackId: defaultTracks[0].id, pitch: 67, start: 2, duration: 2, velocity: 0.8 },
  { id: uuidv4(), trackId: defaultTracks[0].id, pitch: 72, start: 3, duration: 4, velocity: 0.9 },
  { id: uuidv4(), trackId: defaultTracks[1].id, pitch: 48, start: 0, duration: 4, velocity: 0.9 },
  { id: uuidv4(), trackId: defaultTracks[1].id, pitch: 48, start: 4, duration: 4, velocity: 0.9 },
  { id: uuidv4(), trackId: defaultTracks[2].id, pitch: 36, start: 0, duration: 1, velocity: 1.0 },
  { id: uuidv4(), trackId: defaultTracks[2].id, pitch: 38, start: 1, duration: 1, velocity: 0.7 },
  { id: uuidv4(), trackId: defaultTracks[2].id, pitch: 36, start: 2, duration: 1, velocity: 1.0 },
  { id: uuidv4(), trackId: defaultTracks[2].id, pitch: 38, start: 3, duration: 1, velocity: 0.7 },
  { id: uuidv4(), trackId: defaultTracks[3].id, pitch: 72, start: 8, duration: 4, velocity: 0.6 },
  { id: uuidv4(), trackId: defaultTracks[3].id, pitch: 79, start: 10, duration: 2, velocity: 0.6 },
];

const defaultCollaborators: Collaborator[] = [
  { id: 'user-1', name: '你', avatar: '👨‍🎤', color: '#4ecdc4', isOnline: true },
  { id: 'user-2', name: '小李', avatar: '👩‍🎨', color: '#ff6b6b', isOnline: true },
  { id: 'user-3', name: '小王', avatar: '🧑‍🎹', color: '#ffe66d', isOnline: true },
  { id: 'user-4', name: '小张', avatar: '👨‍🎸', color: '#a78bfa', isOnline: true },
  { id: 'user-5', name: '小刘', avatar: '👩‍🎤', color: '#6ee7b7', isOnline: true },
];

const defaultCursors: CollaboratorCursor[] = defaultCollaborators.slice(1).map((c) => ({
  collaboratorId: c.id,
  x: Math.random() * 800,
  y: Math.random() * 400,
  targetX: Math.random() * 800,
  targetY: Math.random() * 400,
  action: 'idle' as const,
}));

export const useSequencerStore = create<SequencerState>((set) => ({
  tracks: defaultTracks,
  notes: defaultNotes,
  automationPoints: [],
  collaborators: defaultCollaborators,
  collaboratorCursors: defaultCursors,
  cursorPosition: 0,
  isPlaying: false,
  bpm: DEFAULT_BPM,
  selectedNoteId: null,
  zoomLevel: 1,
  mainVolume: 0.8,

  setTracks: (tracks) => set({ tracks }),
  setTrackVolume: (trackId, volume) =>
    set((state) => ({
      tracks: state.tracks.map((t) => (t.id === trackId ? { ...t, volume: Math.max(0, Math.min(1.2, volume)) } : t)),
    })),
  setTrackMuted: (trackId, muted) =>
    set((state) => ({
      tracks: state.tracks.map((t) => (t.id === trackId ? { ...t, muted } : t)),
    })),
  setTrackSolo: (trackId, solo) =>
    set((state) => ({
      tracks: state.tracks.map((t) => (t.id === trackId ? { ...t, solo } : t)),
    })),
  setTrackHeight: (trackId, height) =>
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId ? { ...t, height: Math.max(MIN_TRACK_HEIGHT, Math.min(MAX_TRACK_HEIGHT, height)) } : t
      ),
    })),
  setTrackSend: (trackId, send) =>
    set((state) => ({
      tracks: state.tracks.map((t) => (t.id === trackId ? { ...t, send: Math.max(0, Math.min(1, send)) } : t)),
    })),

  addNote: (note) =>
    set((state) => {
      const trackNotes = state.notes.filter((n) => n.trackId === note.trackId);
      if (trackNotes.length >= 128) return state;
      return { notes: [...state.notes, { ...note, id: uuidv4() }] };
    }),
  removeNote: (noteId) => set((state) => ({ notes: state.notes.filter((n) => n.id !== noteId) })),
  moveNote: (noteId, start, pitch, duration) =>
    set((state) => ({
      notes: state.notes.map((n) => (n.id === noteId ? { ...n, start, pitch, duration } : n)),
    })),
  setNotes: (notes) => set({ notes }),
  setSelectedNoteId: (id) => set({ selectedNoteId: id }),

  setCursorPosition: (position) => set({ cursorPosition: position }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setBpm: (bpm) => set({ bpm: Math.max(60, Math.min(200, bpm)) }),
  setZoomLevel: (zoomLevel) => set({ zoomLevel: Math.max(0.5, Math.min(3, zoomLevel)) }),
  setMainVolume: (volume) => set({ mainVolume: Math.max(0, Math.min(1.2, volume)) }),

  updateCollaboratorCursor: (cursor) =>
    set((state) => ({
      collaboratorCursors: state.collaboratorCursors.map((c) =>
        c.collaboratorId === cursor.collaboratorId ? { ...c, ...cursor } : c
      ),
    })),
  addAutomationPoint: (point) =>
    set((state) => ({
      automationPoints: [...state.automationPoints, { ...point, id: uuidv4() }],
    })),
}));
