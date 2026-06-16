import { create } from 'zustand';

export type PlayMode = 'free' | 'auto';
export type MelodyType = 'polka' | 'tango' | 'folk';

export interface NoteEvent {
  noteIndex: number;
  frequency: number;
  noteName: string;
  velocity: number;
  timestamp: number;
  row: number;
}

interface AppState {
  playMode: PlayMode;
  currentMelody: MelodyType;
  melodyProgress: number;
  melodyTotal: number;
  bellowsExpansion: number;
  targetBellowsExpansion: number;
  windSpeed: number;
  activeNotes: Map<number, NoteEvent>;
  recentNotes: NoteEvent[];
  pressedKeys: Set<number>;
  consecutivePlayCount: number;
  lastPlayTime: number;
  fpsHistory: number[];
  particleCount: number;
  currentNoteName: string;

  setPlayMode: (mode: PlayMode) => void;
  setCurrentMelody: (melody: MelodyType) => void;
  setMelodyProgress: (current: number, total: number) => void;
  setBellowsTarget: (value: number) => void;
  setWindSpeed: (speed: number) => void;
  pressNote: (note: NoteEvent) => void;
  releaseNote: (noteIndex: number) => void;
  updateBellows: (dt: number) => void;
  addFpsSample: (fps: number) => void;
  setCurrentNoteName: (name: string) => void;
  clearAllNotes: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  playMode: 'free',
  currentMelody: 'polka',
  melodyProgress: 0,
  melodyTotal: 0,
  bellowsExpansion: 0.3,
  targetBellowsExpansion: 0.3,
  windSpeed: 1.0,
  activeNotes: new Map(),
  recentNotes: [],
  pressedKeys: new Set(),
  consecutivePlayCount: 0,
  lastPlayTime: 0,
  fpsHistory: [],
  particleCount: 400,
  currentNoteName: '—',

  setPlayMode: (mode) => set({ playMode: mode }),
  setCurrentMelody: (melody) => set({ currentMelody: melody }),
  setMelodyProgress: (current, total) => set({ melodyProgress: current, melodyTotal: total }),
  setBellowsTarget: (value) => set({ targetBellowsExpansion: Math.max(0, Math.min(1, value)) }),
  setWindSpeed: (speed) => set({ windSpeed: speed }),

  pressNote: (note) => {
    const state = get();
    const now = performance.now();
    const isConsecutive = now - state.lastPlayTime < 350;
    const newCount = isConsecutive ? state.consecutivePlayCount + 1 : 1;

    const newActive = new Map(state.activeNotes);
    newActive.set(note.noteIndex, note);

    const newRecent = [...state.recentNotes, note].slice(-20);
    const newPressed = new Set(state.pressedKeys);
    newPressed.add(note.noteIndex);

    let expansion = 0.25 + Math.random() * 0.25;
    if (newCount >= 3) {
      expansion *= 1.5;
    }
    expansion = Math.min(1, expansion);

    set({
      activeNotes: newActive,
      recentNotes: newRecent,
      pressedKeys: newPressed,
      consecutivePlayCount: newCount,
      lastPlayTime: now,
      targetBellowsExpansion: expansion,
      currentNoteName: note.noteName,
    });
  },

  releaseNote: (noteIndex) => {
    const state = get();
    const newActive = new Map(state.activeNotes);
    newActive.delete(noteIndex);
    const newPressed = new Set(state.pressedKeys);
    newPressed.delete(noteIndex);

    set({
      activeNotes: newActive,
      pressedKeys: newPressed,
    });
  },

  updateBellows: (dt) => {
    const state = get();
    const smoothing = 1 - Math.exp(-dt / 0.3);
    const newExpansion = state.bellowsExpansion + (state.targetBellowsExpansion - state.bellowsExpansion) * smoothing;

    if (state.activeNotes.size === 0 && performance.now() - state.lastPlayTime > 800) {
      set({
        bellowsExpansion: newExpansion,
        targetBellowsExpansion: 0.3,
        consecutivePlayCount: 0,
      });
    } else {
      set({ bellowsExpansion: newExpansion });
    }
  },

  addFpsSample: (fps) => {
    const state = get();
    const history = [...state.fpsHistory, fps].slice(-30);
    const avgFps = history.reduce((a, b) => a + b, 0) / history.length;

    let newCount = state.particleCount;
    if (avgFps < 40 && history.length >= 20) {
      newCount = Math.max(200, state.particleCount - 25);
    } else if (avgFps > 55 && history.length >= 20) {
      newCount = Math.min(500, state.particleCount + 25);
    }

    set({ fpsHistory: history, particleCount: newCount });
  },

  setCurrentNoteName: (name) => set({ currentNoteName: name }),
  clearAllNotes: () => set({ activeNotes: new Map(), pressedKeys: new Set() }),
}));

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function getNoteInfo(noteIndex: number) {
  const totalNotes = 24;
  const startOctave = 4;
  const semitonesFromC4 = noteIndex;
  const midi = 60 + semitonesFromC4;
  const octave = Math.floor(midi / 12) - 1;
  const noteNameInOctave = NOTE_NAMES[midi % 12];
  const frequency = 440 * Math.pow(2, (midi - 69) / 12);
  const row = noteIndex < 12 ? 0 : 1;
  const displayName = `${noteNameInOctave}${octave}`;
  return { frequency, noteName: displayName, row, midi, totalNotes };
}

export const KEYBOARD_MAP: Record<string, number> = {
  'a': 0, 's': 2, 'd': 4, 'f': 5, 'g': 7, 'h': 9, 'j': 11,
  'k': 12, 'l': 14, ';': 16, "'": 17,
  'w': 1, 'e': 3, 't': 6, 'y': 8, 'u': 10, 'o': 13, 'p': 15,
};
