import { create } from 'zustand';

interface AudioState {
  audioFile: File | null;
  fileName: string;
  duration: number;
  currentTime: number;
  frequencyData: Uint8Array;
  bpm: number;
  isPlaying: boolean;
  volume: number;
  setAudioFile: (file: File | null) => void;
  setFileName: (name: string) => void;
  setDuration: (d: number) => void;
  setCurrentTime: (t: number) => void;
  setFrequencyData: (data: Uint8Array) => void;
  setBpm: (bpm: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setVolume: (v: number) => void;
  reset: () => void;
}

const initialState = {
  audioFile: null,
  fileName: '',
  duration: 0,
  currentTime: 0,
  frequencyData: new Uint8Array(0),
  bpm: 0,
  isPlaying: false,
  volume: 1,
};

export const useAudioStore = create<AudioState>((set) => ({
  ...initialState,
  setAudioFile: (audioFile) => set({ audioFile }),
  setFileName: (fileName) => set({ fileName }),
  setDuration: (duration) => set({ duration }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setFrequencyData: (frequencyData) => set({ frequencyData }),
  setBpm: (bpm) => set({ bpm }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setVolume: (volume) => set({ volume }),
  reset: () => set(initialState),
}));
