import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Track, Note, Collaborator, NotePreview } from '../types';

const TRACK_COLORS = ['#e94560', '#0f3460', '#16213e', '#533483', '#e94560', '#00b4d8', '#90e0ef', '#f77f00'];

const defaultTracks: Track[] = [
  { id: uuidv4(), name: 'Drums', volume: 0.8, muted: false, solo: false, height: 120, auxSend: 0.3, color: TRACK_COLORS[0] },
  { id: uuidv4(), name: 'Bass', volume: 0.75, muted: false, solo: false, height: 120, auxSend: 0.2, color: TRACK_COLORS[1] },
  { id: uuidv4(), name: 'Synth Lead', volume: 0.7, muted: false, solo: false, height: 120, auxSend: 0.4, color: TRACK_COLORS[2] },
  { id: uuidv4(), name: 'Pad', volume: 0.6, muted: false, solo: false, height: 120, auxSend: 0.5, color: TRACK_COLORS[3] },
  { id: uuidv4(), name: 'Piano', volume: 0.75, muted: false, solo: false, height: 120, auxSend: 0.3, color: TRACK_COLORS[4] },
  { id: uuidv4(), name: 'Guitar', volume: 0.7, muted: false, solo: false, height: 120, auxSend: 0.35, color: TRACK_COLORS[5] },
  { id: uuidv4(), name: 'Strings', volume: 0.65, muted: false, solo: false, height: 120, auxSend: 0.45, color: TRACK_COLORS[6] },
  { id: uuidv4(), name: 'FX', volume: 0.55, muted: false, solo: false, height: 120, auxSend: 0.6, color: TRACK_COLORS[7] },
];

const defaultCollaborators: Collaborator[] = [
  { id: 'user-1', name: 'Alex', avatar: '🎹', color: '#e94560', cursorX: 200, cursorY: 300, isActive: true, lastBlinkTime: 0 },
  { id: 'user-2', name: 'Maya', avatar: '🎸', color: '#00b4d8', cursorX: 400, cursorY: 200, isActive: true, lastBlinkTime: 0 },
  { id: 'user-3', name: 'Jordan', avatar: '🥁', color: '#f77f00', cursorX: 600, cursorY: 400, isActive: true, lastBlinkTime: 0 },
  { id: 'user-4', name: 'Casey', avatar: '🎤', color: '#90e0ef', cursorX: 300, cursorY: 500, isActive: true, lastBlinkTime: 0 },
  { id: 'user-5', name: 'Riley', avatar: '🎧', color: '#533483', cursorX: 500, cursorY: 350, isActive: true, lastBlinkTime: 0 },
];

const generateDefaultNotes = (tracks: Track[]): Note[] => {
  const notes: Note[] = [];
  const patterns = [
    { trackIdx: 0, pitches: [36, 38, 42], pattern: [[0, 0], [1, 1], [2, 0], [3, 2], [4, 0], [5, 1], [6, 0], [7, 2]] },
    { trackIdx: 1, pitches: [40, 43, 45, 48], pattern: [[0, 0], [2, 1], [4, 2], [6, 3]] },
    { trackIdx: 2, pitches: [60, 64, 67, 72], pattern: [[0, 0, 2], [4, 1, 2]] },
    { trackIdx: 4, pitches: [60, 62, 64, 65, 67, 69, 71, 72], pattern: [[0, 0], [1, 2], [2, 4], [3, 5], [4, 7], [5, 5], [6, 4], [7, 2]] },
  ];

  patterns.forEach(({ trackIdx, pitches, pattern }) => {
    const trackId = tracks[trackIdx].id;
    pattern.forEach(([start, pitchIdx, duration = 1]) => {
      notes.push({
        id: uuidv4(),
        trackId,
        pitch: pitches[pitchIdx],
        start,
        duration,
        velocity: 100,
      });
    });
  });

  return notes;
};

interface SequencerState {
  tracks: Track[];
  notes: Note[];
  cursorPosition: number;
  isPlaying: boolean;
  bpm: number;
  masterVolume: number;
  collaborators: Collaborator[];
  zoomLevel: number;
  selectedNoteId: string | null;
  notePreview: NotePreview | null;
  draggingNoteId: string | null;
  setTracks: (tracks: Track[]) => void;
  setNotes: (notes: Note[]) => void;
  setCursorPosition: (pos: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setBpm: (bpm: number) => void;
  setMasterVolume: (vol: number) => void;
  setCollaborators: (collaborators: Collaborator[]) => void;
  updateCollaborator: (id: string, data: Partial<Collaborator>) => void;
  setZoomLevel: (zoom: number) => void;
  setSelectedNoteId: (id: string | null) => void;
  setNotePreview: (preview: NotePreview | null) => void;
  setDraggingNoteId: (id: string | null) => void;
  addNote: (note: Omit<Note, 'id'>) => void;
  removeNote: (id: string) => void;
  updateNote: (id: string, data: Partial<Note>) => void;
  updateTrack: (id: string, data: Partial<Track>) => void;
  toggleMute: (trackId: string) => void;
  toggleSolo: (trackId: string) => void;
}

export const useSequencerStore = create<SequencerState>((set) => {
  const initialTracks = defaultTracks;
  const initialNotes = generateDefaultNotes(initialTracks);

  return {
    tracks: initialTracks,
    notes: initialNotes,
    cursorPosition: 0,
    isPlaying: false,
    bpm: 120,
    masterVolume: 0.8,
    collaborators: defaultCollaborators,
    zoomLevel: 1,
    selectedNoteId: null,
    notePreview: null,
    draggingNoteId: null,

    setTracks: (tracks) => set({ tracks }),
    setNotes: (notes) => set({ notes }),
    setCursorPosition: (cursorPosition) => set({ cursorPosition }),
    setIsPlaying: (isPlaying) => set({ isPlaying }),
    setBpm: (bpm) => set({ bpm }),
    setMasterVolume: (masterVolume) => set({ masterVolume }),
    setCollaborators: (collaborators) => set({ collaborators }),
    updateCollaborator: (id, data) =>
      set((state) => ({
        collaborators: state.collaborators.map((c) =>
          c.id === id ? { ...c, ...data } : c
        ),
      })),
    setZoomLevel: (zoomLevel) => set({ zoomLevel }),
    setSelectedNoteId: (selectedNoteId) => set({ selectedNoteId }),
    setNotePreview: (notePreview) => set({ notePreview }),
    setDraggingNoteId: (draggingNoteId) => set({ draggingNoteId }),

    addNote: (note) =>
      set((state) => ({
        notes: [...state.notes, { ...note, id: uuidv4() }],
      })),
    removeNote: (id) =>
      set((state) => ({
        notes: state.notes.filter((n) => n.id !== id),
      })),
    updateNote: (id, data) =>
      set((state) => ({
        notes: state.notes.map((n) => (n.id === id ? { ...n, ...data } : n)),
      })),
    updateTrack: (id, data) =>
      set((state) => ({
        tracks: state.tracks.map((t) => (t.id === id ? { ...t, ...data } : t)),
      })),
    toggleMute: (trackId) =>
      set((state) => ({
        tracks: state.tracks.map((t) =>
          t.id === trackId ? { ...t, muted: !t.muted } : t
        ),
      })),
    toggleSolo: (trackId) =>
      set((state) => ({
        tracks: state.tracks.map((t) =>
          t.id === trackId ? { ...t, solo: !t.solo } : t
        ),
      })),
  };
});
