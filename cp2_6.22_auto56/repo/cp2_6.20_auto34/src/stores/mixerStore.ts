import { create } from 'zustand';
import { audioEngine } from '../utils/audioEngine';

export interface Effect {
  id: string;
  type: string;
  params: Record<string, number>;
  trackId: string;
}

export interface Track {
  id: string;
  name: string;
  audioBuffer: AudioBuffer | null;
  startTime: number;
  effects: Effect[];
  muted: boolean;
  solo: boolean;
  volume: number;
  color: string;
}

interface MixerState {
  tracks: Track[];
  playing: boolean;
  currentTime: number;
  bpm: number;
  masterVolume: number;
  masterBus: ReturnType<typeof audioEngine.getMasterBus> | null;

  addTrack: (track: Omit<Track, 'id' | 'effects' | 'muted' | 'solo' | 'volume' | 'color'> & Partial<Pick<Track, 'id' | 'effects' | 'muted' | 'solo' | 'volume' | 'color'>>) => void;
  removeTrack: (id: string) => void;
  updateTrack: (id: string, updates: Partial<Track>) => void;
  addEffect: (effect: Omit<Effect, 'id'>) => void;
  removeEffect: (id: string) => void;
  updateEffect: (id: string, updates: Partial<Effect>) => void;
  setPlaying: (playing: boolean) => void;
  setMasterVolume: (volume: number) => void;
  setCurrentTime: (time: number) => void;
  setBpm: (bpm: number) => void;
  initMasterBus: () => void;
}

const generateId = (): string => Math.random().toString(36).substring(2, 11);

const defaultColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
];

let colorIndex = 0;

const getNextColor = (): string => {
  const color = defaultColors[colorIndex % defaultColors.length];
  colorIndex++;
  return color;
};

export const useMixerStore = create<MixerState>((set) => ({
  tracks: [],
  playing: false,
  currentTime: 0,
  bpm: 120,
  masterVolume: 0.8,
  masterBus: null,

  addTrack: (trackData) => {
    const newTrack: Track = {
      effects: [],
      muted: false,
      solo: false,
      volume: 0.8,
      color: getNextColor(),
      ...trackData,
      id: trackData.id || generateId(),
    };
    set((state) => ({ tracks: [...state.tracks, newTrack] }));
  },

  removeTrack: (id) => {
    set((state) => ({
      tracks: state.tracks.filter((track) => track.id !== id),
    }));
  },

  updateTrack: (id, updates) => {
    set((state) => ({
      tracks: state.tracks.map((track) =>
        track.id === id ? { ...track, ...updates } : track
      ),
    }));
  },

  addEffect: (effectData) => {
    const newEffect: Effect = {
      ...effectData,
      id: generateId(),
    };
    set((state) => ({
      tracks: state.tracks.map((track) =>
        track.id === effectData.trackId
          ? { ...track, effects: [...track.effects, newEffect] }
          : track
      ),
    }));
  },

  removeEffect: (id) => {
    set((state) => ({
      tracks: state.tracks.map((track) => ({
        ...track,
        effects: track.effects.filter((effect) => effect.id !== id),
      })),
    }));
  },

  updateEffect: (id, updates) => {
    set((state) => ({
      tracks: state.tracks.map((track) => ({
        ...track,
        effects: track.effects.map((effect) =>
          effect.id === id ? { ...effect, ...updates } : effect
        ),
      })),
    }));
  },

  setPlaying: (playing) => {
    set({ playing });
  },

  setMasterVolume: (volume) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    set({ masterVolume: clampedVolume });
    audioEngine.setMasterVolume(clampedVolume);
  },

  setCurrentTime: (time) => {
    set({ currentTime: time });
  },

  setBpm: (bpm) => {
    set({ bpm: Math.max(20, Math.min(300, bpm)) });
  },

  initMasterBus: async () => {
    try {
      await audioEngine.init();
      const masterBus = audioEngine.getMasterBus();
      set({ masterBus });
    } catch (error) {
      console.error('Failed to initialize master bus:', error);
    }
  },
}));
