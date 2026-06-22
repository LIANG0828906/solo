import { create } from 'zustand';

export type VisualMode = 'waveform' | 'nebula' | 'explosion';

export interface AudioState {
  isPlaying: boolean;
  currentTrack: string | null;
  currentTrackName: string;
  duration: number;
  currentTime: number;
  volume: number;
  frequencyData: Uint8Array;
}

export interface AppState {
  visualMode: VisualMode;
  setVisualMode: (mode: VisualMode) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  audioState: AudioState;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTrack: (track: string | null, name: string) => void;
  setDuration: (duration: number) => void;
  setCurrentTime: (time: number) => void;
  setFrequencyData: (data: Uint8Array) => void;
}

const initialFrequencyData = new Uint8Array(256);

export const useAppStore = create<AppState>((set) => ({
  visualMode: 'nebula',
  setVisualMode: (mode) => set({ visualMode: mode }),
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  audioState: {
    isPlaying: false,
    currentTrack: null,
    currentTrackName: '',
    duration: 0,
    currentTime: 0,
    volume: 1,
    frequencyData: initialFrequencyData,
  },
  setIsPlaying: (playing) =>
    set((state) => ({ audioState: { ...state.audioState, isPlaying: playing } })),
  setCurrentTrack: (track, name) =>
    set((state) => ({
      audioState: { ...state.audioState, currentTrack: track, currentTrackName: name },
    })),
  setDuration: (duration) =>
    set((state) => ({ audioState: { ...state.audioState, duration } })),
  setCurrentTime: (time) =>
    set((state) => ({ audioState: { ...state.audioState, currentTime: time } })),
  setFrequencyData: (data) =>
    set((state) => ({ audioState: { ...state.audioState, frequencyData: data } })),
}));
