import { create } from 'zustand';
import type { Chord, Note } from '@/utils/chordParser';
import type { RhythmPattern } from '@/utils/rhythmCalculator';
import { RHYTHM_PATTERNS } from '@/utils/rhythmCalculator';
import { DEFAULT_TEMPO, MAX_BEATS } from '@/utils/constants';

interface AppState {
  currentKey: string;
  currentMode: string;
  chordSequence: Chord[];
  selectedPattern: RhythmPattern;
  currentTime: number;
  isPlaying: boolean;
  tempo: number;
  totalBeats: number;
  activeNotes: Note[];
  selectedChordId: string | null;
  currentSliderPosition: number;

  setCurrentKey: (key: string) => void;
  setCurrentMode: (mode: string) => void;
  addChord: (chord: Chord) => void;
  removeChord: (chordId: string) => void;
  updateChordDuration: (chordId: string, duration: number) => void;
  setSelectedPattern: (pattern: RhythmPattern) => void;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setTempo: (tempo: number) => void;
  setActiveNotes: (notes: Note[]) => void;
  setSelectedChordId: (id: string | null) => void;
  setCurrentSliderPosition: (pos: number) => void;
  reset: () => void;
}

export const useStore = create<AppState>((set) => ({
  currentKey: 'C',
  currentMode: '大调',
  chordSequence: [],
  selectedPattern: RHYTHM_PATTERNS[0],
  currentTime: 0,
  isPlaying: false,
  tempo: DEFAULT_TEMPO,
  totalBeats: MAX_BEATS,
  activeNotes: [],
  selectedChordId: null,
  currentSliderPosition: 0,

  setCurrentKey: (key) => set({ currentKey: key }),
  setCurrentMode: (mode) => set({ currentMode: mode }),
  addChord: (chord) =>
    set((state) => ({ chordSequence: [...state.chordSequence, chord] })),
  removeChord: (chordId) =>
    set((state) => ({
      chordSequence: state.chordSequence.filter((c) => c.id !== chordId),
    })),
  updateChordDuration: (chordId, duration) =>
    set((state) => ({
      chordSequence: state.chordSequence.map((c) =>
        c.id === chordId ? { ...c, duration } : c
      ),
    })),
  setSelectedPattern: (pattern) => set({ selectedPattern: pattern }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setTempo: (tempo) => set({ tempo }),
  setActiveNotes: (notes) => set({ activeNotes: notes }),
  setSelectedChordId: (id) => set({ selectedChordId: id }),
  setCurrentSliderPosition: (pos) => set({ currentSliderPosition: pos }),
  reset: () =>
    set({
      chordSequence: [],
      currentTime: 0,
      isPlaying: false,
      activeNotes: [],
      selectedChordId: null,
      currentSliderPosition: 0,
    }),
}));
