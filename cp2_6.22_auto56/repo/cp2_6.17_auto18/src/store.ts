import { create } from 'zustand';
import { Note, Tone, audioEngine } from './utils/audio';

export interface Melody {
  id: string;
  name: string;
  notes: Note[];
  duration: number;
  createdAt: number;
}

interface AppState {
  pressedKeys: Set<string>;
  currentNotes: Note[];
  nextNoteTime: number;
  tone: Tone;
  isRecording: boolean;
  recordingStartTime: number;
  recordingNotes: Note[];
  melodies: Melody[];
  isPlaying: boolean;
  playingMelodyId: string | null;
  playProgress: number;
  isEditMode: boolean;
  editingMelodyId: string | null;
  staffNotes: Note[];
  beatWidth: number;
  jamStartTime: number;
  isJamMode: boolean;

  pressKey: (note: string) => void;
  releaseKey: (note: string) => void;
  clearStaff: () => void;
  setTone: (tone: Tone) => Promise<void>;
  startRecording: () => void;
  stopRecording: () => void;
  playMelody: (melodyId: string) => void;
  stopPlaying: () => void;
  enterEditMode: (melodyId: string) => void;
  exitEditMode: () => void;
  updateNote: (noteId: string, updates: Partial<Note>) => void;
  deleteNote: (noteId: string) => void;
  addNote: (pitch: string, time: number) => void;
  saveMelody: () => void;
  setStaffNotes: (notes: Note[]) => void;
}

const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

const formatMelodyName = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `旋律_${year}${month}${day}_${hours}${minutes}${seconds}`;
};

const initialMelodies: Melody[] = [
  {
    id: 'demo1',
    name: '示例旋律_小星星',
    notes: [
      { id: 'n1', pitch: 'C4', midi: 60, time: 0, duration: 0.25 },
      { id: 'n2', pitch: 'C4', midi: 60, time: 0.5, duration: 0.25 },
      { id: 'n3', pitch: 'G4', midi: 67, time: 1, duration: 0.25 },
      { id: 'n4', pitch: 'G4', midi: 67, time: 1.5, duration: 0.25 },
      { id: 'n5', pitch: 'A4', midi: 69, time: 2, duration: 0.25 },
      { id: 'n6', pitch: 'A4', midi: 69, time: 2.5, duration: 0.25 },
      { id: 'n7', pitch: 'G4', midi: 67, time: 3, duration: 0.5 },
      { id: 'n8', pitch: 'F4', midi: 65, time: 4, duration: 0.25 },
      { id: 'n9', pitch: 'F4', midi: 65, time: 4.5, duration: 0.25 },
      { id: 'n10', pitch: 'E4', midi: 64, time: 5, duration: 0.25 },
      { id: 'n11', pitch: 'E4', midi: 64, time: 5.5, duration: 0.25 },
      { id: 'n12', pitch: 'D4', midi: 62, time: 6, duration: 0.25 },
      { id: 'n13', pitch: 'D4', midi: 62, time: 6.5, duration: 0.25 },
      { id: 'n14', pitch: 'C4', midi: 60, time: 7, duration: 0.5 },
    ],
    duration: 8,
    createdAt: Date.now() - 100000,
  },
];

export const useStore = create<AppState>((set, get) => ({
  pressedKeys: new Set(),
  currentNotes: [],
  nextNoteTime: 0,
  tone: 'piano',
  isRecording: false,
  recordingStartTime: 0,
  recordingNotes: [],
  melodies: initialMelodies,
  isPlaying: false,
  playingMelodyId: null,
  playProgress: 0,
  isEditMode: false,
  editingMelodyId: null,
  staffNotes: [],
  beatWidth: 42,
  jamStartTime: 0,
  isJamMode: false,

  clearStaff: () => {
    set({
      staffNotes: [],
      isJamMode: false,
      jamStartTime: 0,
    });
  },

  pressKey: (note: string) => {
    const state = get();
    const { pressedKeys, isRecording, recordingNotes, recordingStartTime, tone, isPlaying, isEditMode, isJamMode, jamStartTime, staffNotes } = state;
    if (pressedKeys.has(note)) return;

    const newPressed = new Set(pressedKeys);
    newPressed.add(note);

    audioEngine.setTone(tone);
    audioEngine.startNote(note);

    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = parseInt(note.slice(-1));
    const noteName = note.slice(0, -1);
    const midi = (octave + 1) * 12 + noteNames.indexOf(noteName);

    const now = performance.now();
    let noteTime = 0;

    if (isRecording) {
      noteTime = (now - recordingStartTime) / 1000;
    } else if (!isPlaying && !isEditMode) {
      if (!isJamMode || staffNotes.length === 0) {
        noteTime = 0;
      } else {
        noteTime = (now - jamStartTime) / 1000;
      }
    }

    const newNote: Note = {
      id: generateId(),
      pitch: note,
      midi,
      time: Math.max(0, noteTime),
      duration: 0.25,
    };

    const newState: Partial<AppState> = {
      pressedKeys: newPressed,
      currentNotes: [...state.currentNotes, newNote],
    };

    if (isRecording) {
      newState.recordingNotes = [...recordingNotes, newNote];
    }

    if (!isPlaying && !isEditMode) {
      if (!isJamMode || staffNotes.length === 0) {
        newState.isJamMode = true;
        newState.jamStartTime = now;
        newState.staffNotes = [newNote];
      } else {
        newState.staffNotes = [...staffNotes, newNote];
      }
    }

    set(newState as AppState);
  },

  releaseKey: (note: string) => {
    const { pressedKeys } = get();
    if (!pressedKeys.has(note)) return;

    const newPressed = new Set(pressedKeys);
    newPressed.delete(note);

    audioEngine.stopNote(note);

    set({
      pressedKeys: newPressed,
      currentNotes: get().currentNotes.filter(n => n.pitch !== note),
    });
  },

  setTone: async (tone: Tone) => {
    await audioEngine.setTone(tone);
    set({ tone });
  },

  startRecording: () => {
    set({
      isRecording: true,
      recordingStartTime: performance.now(),
      recordingNotes: [],
    });
  },

  stopRecording: () => {
    const { recordingNotes } = get();
    if (recordingNotes.length === 0) {
      set({ isRecording: false, recordingNotes: [] });
      return;
    }

    const maxTime = Math.max(...recordingNotes.map(n => n.time + n.duration));
    const newMelody: Melody = {
      id: generateId(),
      name: formatMelodyName(),
      notes: [...recordingNotes],
      duration: Math.ceil(maxTime * 4) / 4,
      createdAt: Date.now(),
    };

    set(state => ({
      isRecording: false,
      recordingNotes: [],
      melodies: [...state.melodies, newMelody],
    }));
  },

  playMelody: (melodyId: string) => {
    const { melodies, tone, isPlaying } = get();
    if (isPlaying) {
      get().stopPlaying();
    }

    const melody = melodies.find(m => m.id === melodyId);
    if (!melody || melody.notes.length === 0) return;

    audioEngine.setTone(tone);
    audioEngine.resume();

    set({
      isPlaying: true,
      playingMelodyId: melodyId,
      playProgress: 0,
      staffNotes: [...melody.notes],
    });

    const startTime = performance.now();
    const totalDuration = melody.duration;
    const noteDurations = new Map<string, number>();

    melody.notes.forEach(note => {
      noteDurations.set(note.id, note.duration);
    });

    const playedNotes = new Set<string>();

    const animate = () => {
      const state = get();
      if (!state.isPlaying || state.playingMelodyId !== melodyId) return;

      const elapsed = (performance.now() - startTime) / 1000;
      const progress = elapsed / totalDuration;

      if (progress >= 1) {
        set({ isPlaying: false, playingMelodyId: null, playProgress: 1 });
        return;
      }

      melody.notes.forEach(note => {
      if (note.time <= elapsed && !playedNotes.has(note.id)) {
        playedNotes.add(note.id);
        audioEngine.playNoteWithTone(note.pitch, note.duration * 0.8, tone);
      }
    });

      set({ playProgress: progress });
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  },

  stopPlaying: () => {
    audioEngine.stopAllNotes();
    set({
      isPlaying: false,
      playingMelodyId: null,
      playProgress: 0,
    });
  },

  enterEditMode: (melodyId: string) => {
    const { melodies } = get();
    const melody = melodies.find(m => m.id === melodyId);
    if (!melody) return;

    set({
      isEditMode: true,
      editingMelodyId: melodyId,
      staffNotes: [...melody.notes],
      isPlaying: false,
      playingMelodyId: null,
    });
  },

  exitEditMode: () => {
    set({
      isEditMode: false,
      editingMelodyId: null,
      staffNotes: [],
    });
  },

  updateNote: (noteId: string, updates: Partial<Note>) => {
    set(state => ({
      staffNotes: state.staffNotes.map(n =>
        n.id === noteId ? { ...n, ...updates } : n
      ),
    }));
  },

  deleteNote: (noteId: string) => {
    set(state => ({
      staffNotes: state.staffNotes.filter(n => n.id !== noteId),
    }));
  },

  addNote: (pitch: string, time: number) => {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = parseInt(pitch.slice(-1));
    const noteName = pitch.slice(0, -1);
    const midi = (octave + 1) * 12 + noteNames.indexOf(noteName);

    const newNote: Note = {
      id: generateId(),
      pitch,
      midi,
      time,
      duration: 0.25,
    };

    set(state => ({
      staffNotes: [...state.staffNotes, newNote],
    }));
  },

  saveMelody: () => {
    const { editingMelodyId, staffNotes, melodies } = get();
    if (!editingMelodyId) return;

    const maxTime = staffNotes.length > 0
      ? Math.max(...staffNotes.map(n => n.time + n.duration))
      : 0;

    set(state => ({
      melodies: state.melodies.map(m =>
        m.id === editingMelodyId
          ? { ...m, notes: [...state.staffNotes], duration: Math.ceil(maxTime * 4) / 4 }
          : m
      ),
      isEditMode: false,
      editingMelodyId: null,
    }));
  },

  setStaffNotes: (notes: Note[]) => {
    set({ staffNotes: notes });
  },
}));
