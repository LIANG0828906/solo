import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { BeatType, BeatPattern, SoundType } from './types';

interface AppState {
  bpm: number;
  isPlaying: boolean;
  currentBeatIndex: number;
  patterns: BeatPattern[];
  activePatternId: string;
  soundType: SoundType;
  volume: number;
  customPatternLength: number;

  setBpm: (bpm: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentBeatIndex: (index: number) => void;
  setActivePattern: (id: string) => void;
  setSoundType: (type: SoundType) => void;
  setVolume: (volume: number) => void;
  setCustomPatternLength: (length: number) => void;
  updateBeatInPattern: (patternId: string, beatIndex: number, beatType: BeatType) => void;
  getActivePattern: () => BeatPattern | undefined;
}

const defaultPatterns: BeatPattern[] = [
  {
    id: uuidv4(),
    name: '4/4 拍',
    beats: ['accent', 'normal', 'normal', 'normal'],
  },
  {
    id: uuidv4(),
    name: '3/4 拍',
    beats: ['accent', 'normal', 'normal'],
  },
  {
    id: uuidv4(),
    name: '6/8 拍',
    beats: ['accent', 'normal', 'normal', 'accent', 'normal', 'normal'],
  },
];

export const useAppStore = create<AppState>((set, get) => ({
  bpm: 120,
  isPlaying: false,
  currentBeatIndex: 0,
  patterns: defaultPatterns,
  activePatternId: defaultPatterns[0].id,
  soundType: 'click',
  volume: 0.7,
  customPatternLength: 4,

  setBpm: (bpm: number) => set({ bpm: Math.max(30, Math.min(300, bpm)) }),
  setIsPlaying: (isPlaying: boolean) => set({ isPlaying }),
  setCurrentBeatIndex: (index: number) => set({ currentBeatIndex: index }),
  setActivePattern: (id: string) => set({ activePatternId: id, currentBeatIndex: 0 }),
  setSoundType: (type: SoundType) => set({ soundType: type }),
  setVolume: (volume: number) => set({ volume: Math.max(0, Math.min(1, volume)) }),
  setCustomPatternLength: (length: number) => {
    const len = Math.max(4, Math.min(12, length));
    set({ customPatternLength: len });

    const { patterns, activePatternId } = get();
    const pattern = patterns.find((p) => p.id === activePatternId);
    if (pattern) {
      const newBeats = [...pattern.beats];
      while (newBeats.length < len) {
        newBeats.push('normal');
      }
      newBeats.length = len;
      if (newBeats[0] !== 'accent') {
        newBeats[0] = 'accent';
      }

      set({
        patterns: patterns.map((p) =>
          p.id === activePatternId ? { ...p, beats: newBeats } : p
        ),
      });
    }
  },

  updateBeatInPattern: (patternId: string, beatIndex: number, beatType: BeatType) => {
    set((state) => ({
      patterns: state.patterns.map((p) =>
        p.id === patternId
          ? {
              ...p,
              beats: p.beats.map((b, i) => (i === beatIndex ? beatType : b)),
            }
          : p
      ),
    }));
  },

  getActivePattern: () => {
    const { patterns, activePatternId } = get();
    return patterns.find((p) => p.id === activePatternId);
  },
}));
