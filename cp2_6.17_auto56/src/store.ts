import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { audioEngine, NoteData } from './AudioEngine';

export interface Note {
  id: string;
  row: number;
  col: number;
  color: string;
  noteType: 'sine' | 'square' | 'sawtooth';
  frequency: number;
}

interface HistoryEntry {
  notes: Note[];
}

interface StoreState {
  notes: Note[];
  history: HistoryEntry[];
  historyIndex: number;
  bpm: number;
  rows: number;
  cols: number;
  currentPlayingCol: number | null;
  isPlaying: boolean;
  stopCallback: (() => void) | null;

  addNote: (row: number, col: number) => Note | null;
  removeNote: (row: number, col: number) => void;
  toggleNote: (row: number, col: number) => Note | null;
  clearAll: () => void;
  setBpm: (bpm: number) => void;
  undo: () => void;
  toNoteSequence: () => NoteData[];
  setCurrentPlayingCol: (col: number | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setStopCallback: (cb: (() => void) | null) => void;
  pushHistory: () => void;
}

export const ROWS = 3;
export const COLS = 8;

export const calculateColor = (col: number, row: number): string => {
  const h = (col * 45 + 30) % 360;
  const s = 80;
  const l = 60 + row * 10;
  return `hsl(${h}, ${s}%, ${l}%)`;
};

const saveToHistory = (notes: Note[]): HistoryEntry => ({
  notes: JSON.parse(JSON.stringify(notes)),
});

export const useStore = create<StoreState>((set, get) => ({
  notes: [],
  history: [{ notes: [] }],
  historyIndex: 0,
  bpm: 120,
  rows: ROWS,
  cols: COLS,
  currentPlayingCol: null,
  isPlaying: false,
  stopCallback: null,

  addNote: (row: number, col: number) => {
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return null;

    const state = get();
    const existing = state.notes.find((n) => n.row === row && n.col === col);
    if (existing) return existing;

    const note: Note = {
      id: uuidv4(),
      row,
      col,
      color: calculateColor(col, row),
      noteType: audioEngine.getOscillatorType(row),
      frequency: audioEngine.getFrequencyForPosition(col, row),
    };

    audioEngine.playNote(note.frequency, note.noteType, 0.2);

    set({ notes: [...state.notes, note] });
    return note;
  },

  removeNote: (row: number, col: number) => {
    const state = get();
    set({ notes: state.notes.filter((n) => !(n.row === row && n.col === col)) });
  },

  toggleNote: (row: number, col: number) => {
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return null;

    const state = get();
    const existing = state.notes.find((n) => n.row === row && n.col === col);

    if (existing) {
      state.removeNote(row, col);
      return null;
    } else {
      return state.addNote(row, col);
    }
  },

  clearAll: () => {
    const state = get();
    if (state.stopCallback) {
      state.stopCallback();
    }
    set({ notes: [], isPlaying: false, stopCallback: null, currentPlayingCol: null });
  },

  setBpm: (bpm: number) => {
    set({ bpm: Math.max(30, Math.min(300, Math.round(bpm))) });
  },

  undo: () => {
    const state = get();
    if (state.historyIndex > 0) {
      const newIndex = state.historyIndex - 1;
      const previousState = state.history[newIndex];
      set({
        notes: JSON.parse(JSON.stringify(previousState.notes)),
        historyIndex: newIndex,
      });
    }
  },

  pushHistory: () => {
    const state = get();
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(saveToHistory(state.notes));
    const maxHistory = 11;
    if (newHistory.length > maxHistory) {
      const excess = newHistory.length - maxHistory;
      newHistory.splice(0, excess);
      set({
        history: newHistory,
        historyIndex: maxHistory - 1,
      });
    } else {
      set({
        history: newHistory,
        historyIndex: newHistory.length - 1,
      });
    }
  },

  toNoteSequence: (): NoteData[] => {
    const state = get();
    const beatDuration = 60 / state.bpm / 2;
    return state.notes.map((note) => ({
      frequency: note.frequency,
      type: note.noteType,
      duration: beatDuration * 0.5,
      startTime: note.col * beatDuration,
    }));
  },

  setCurrentPlayingCol: (col: number | null) => {
    set({ currentPlayingCol: col });
  },

  setIsPlaying: (playing: boolean) => {
    set({ isPlaying: playing });
  },

  setStopCallback: (cb: (() => void) | null) => {
    set({ stopCallback: cb });
  },
}));
