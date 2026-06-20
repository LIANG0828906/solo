import { create } from 'zustand';
import { VisualMode } from '../types';

interface AudioStore {
  file: File | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  mode: VisualMode;
  amplitudes: Float32Array;
  frequencies: Float32Array;

  setFile: (file: File | null) => void;
  setPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  setMode: (mode: VisualMode) => void;
  setAmplitudes: (amplitudes: Float32Array) => void;
  setFrequencies: (frequencies: Float32Array) => void;
  reset: () => void;
}

const initialAmplitudes = new Float32Array(360);
const initialFrequencies = new Float32Array(64);

export const useAudioStore = create<AudioStore>((set) => ({
  file: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.7,
  mode: 'hybrid',
  amplitudes: initialAmplitudes,
  frequencies: initialFrequencies,

  setFile: (file) => set({ file }),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume }),
  setMode: (mode) => set({ mode }),
  setAmplitudes: (amplitudes) => set({ amplitudes }),
  setFrequencies: (frequencies) => set({ frequencies }),
  reset: () =>
    set({
      file: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      amplitudes: new Float32Array(360),
      frequencies: new Float32Array(64),
    }),
}));
