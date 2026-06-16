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
  _recordHistory: () => void;
  canUndo: boolean;
}

export const ROWS = 3;
export const COLS = 8;

export const calculateColor = (col: number, row: number): string => {
  let h = col * 45 + 30;
  while (h < 0) h += 360;
  h = h % 360;
  const s = 80;
  const l = Math.min(60 + row * 10, 100);
  return `hsl(${h}, ${s}%, ${l}%)`;
};

const saveToHistory = (notes: Note[]): HistoryEntry => ({
  notes: JSON.parse(JSON.stringify(notes)),
});

const MAX_HISTORY = 10;

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
  canUndo: false,

  _recordHistory: () => {
    const state = get();
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(saveToHistory(state.notes));
    if (newHistory.length > MAX_HISTORY + 1) {
      const excess = newHistory.length - (MAX_HISTORY + 1);
      newHistory.splice(0, excess);
    }
    const newIndex = Math.min(newHistory.length - 1, MAX_HISTORY);
    set({
      history: newHistory,
      historyIndex: newIndex,
      canUndo: newIndex > 0,
    });
  },

  addNote: (row: number, col: number) => {
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return null;

    const state = get();
    const existing = state.notes.find((n) => n.row === row && n.col === col);
    if (existing) return existing;

    state._recordHistory();

    const note: Note = {
      id: uuidv4(),
      row,
      col,
      color: calculateColor(col, row),
      noteType: audioEngine.getOscillatorType(row),
      frequency: audioEngine.getFrequencyForPosition(col, row),
    };

    audioEngine.playNote(note.frequency, note.noteType, 0.2);

    set({ notes: [...get().notes, note] });
    return note;
  },

  removeNote: (row: number, col: number) => {
    const state = get();
    const exists = state.notes.some((n) => n.row === row && n.col === col);
    if (!exists) return;

    state._recordHistory();
    set({ notes: get().notes.filter((n) => !(n.row === row && n.col === col)) });
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
    state._recordHistory();
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
        canUndo: newIndex > 0,
      });
    }
  },

  pushHistory: () => {
    get()._recordHistory();
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

if (typeof window !== 'undefined') {
  (window as any).__zustand_store = useStore;
}
