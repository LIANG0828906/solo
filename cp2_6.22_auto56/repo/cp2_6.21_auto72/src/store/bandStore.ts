import { create } from 'zustand';
import type { BandState, BandActions, MusicianType, MusicianConfig } from '../types';

const defaultMusician = (id: MusicianType, name: string, overrides: Partial<MusicianConfig> = {}): MusicianConfig => ({
  id,
  name,
  volume: 70,
  rhythmShift: 0,
  genre: 'rock',
  complexity: 3,
  rhythmPattern: 0,
  rootNote: 'C',
  chordType: 'major',
  timeSignature: '4/4',
  solo: false,
  ...overrides
});

const initialState: BandState = {
  musicians: {
    drummer: defaultMusician('drummer', '鼓手', { volume: 65, genre: 'rock', complexity: 3 }),
    bassist: defaultMusician('bassist', '贝斯手', { volume: 70, genre: 'funk', complexity: 3, rootNote: 'C' }),
    guitarist: defaultMusician('guitarist', '吉他手', { volume: 65, genre: 'rock', complexity: 4, rootNote: 'E' }),
    keyboardist: defaultMusician('keyboardist', '键盘手', { volume: 60, genre: 'blues', complexity: 3, rootNote: 'C' })
  },
  selectedMusician: null,
  isPlaying: false,
  bpm: 120,
  masterVolume: 75
};

export const useBandStore = create<BandState & BandActions>((set) => ({
  ...initialState,

  selectMusician: (id) => set({ selectedMusician: id }),

  updateMusician: (id, patch) =>
    set((state) => ({
      musicians: {
        ...state.musicians,
        [id]: { ...state.musicians[id], ...patch }
      }
    })),

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  setBpm: (bpm) => set({ bpm: Math.max(60, Math.min(180, bpm)) }),

  setMasterVolume: (masterVolume) => set({ masterVolume: Math.max(0, Math.min(100, masterVolume)) }),

  toggleSolo: (id) =>
    set((state) => ({
      musicians: {
        ...state.musicians,
        [id]: { ...state.musicians[id], solo: !state.musicians[id].solo }
      }
    }))
}));
