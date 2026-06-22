import { create } from 'zustand';

export type FrequencyBands = {
  low: number;
  mid: number;
  high: number;
};

interface AudioState {
  audioFile: File | null;
  fileName: string;
  duration: number;
  currentTime: number;
  frequencies: Float32Array | null;
  frequencyBands: FrequencyBands;
  bpm: number;
  isPlaying: boolean;
  isLoaded: boolean;

  setAudioFile: (file: File | null) => void;
  setFileName: (name: string) => void;
  setDuration: (duration: number) => void;
  setCurrentTime: (time: number) => void;
  setFrequencies: (freq: Float32Array | null) => void;
  setFrequencyBands: (bands: FrequencyBands) => void;
  setBpm: (bpm: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsLoaded: (loaded: boolean) => void;
  reset: () => void;
}

const initialFrequencyBands: FrequencyBands = {
  low: 0,
  mid: 0,
  high: 0,
};

export const useAudioStore = create<AudioState>((set) => ({
  audioFile: null,
  fileName: '',
  duration: 0,
  currentTime: 0,
  frequencies: null,
  frequencyBands: initialFrequencyBands,
  bpm: 0,
  isPlaying: false,
  isLoaded: false,

  setAudioFile: (file) => set({ audioFile: file }),
  setFileName: (name) => set({ fileName: name }),
  setDuration: (duration) => set({ duration }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setFrequencies: (freq) => set({ frequencies: freq }),
  setFrequencyBands: (bands) => set({ frequencyBands: bands }),
  setBpm: (bpm) => set({ bpm }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setIsLoaded: (loaded) => set({ isLoaded: loaded }),
  reset: () =>
    set({
      audioFile: null,
      fileName: '',
      duration: 0,
      currentTime: 0,
      frequencies: null,
      frequencyBands: initialFrequencyBands,
      bpm: 0,
      isPlaying: false,
      isLoaded: false,
    }),
}));
