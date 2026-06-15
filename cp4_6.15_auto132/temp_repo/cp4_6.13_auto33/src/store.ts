import { create } from 'zustand';

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isLoaded: boolean;
}

export interface SpectrumData {
  frequencies: Float32Array;
  waveform: Float32Array;
  timeDomainData: Uint8Array;
  freqDomainData: Uint8Array;
}

interface StoreState {
  playbackState: PlaybackState;
  spectrumData: SpectrumData;
  audioBuffer: AudioBuffer | null;
  cursorPosition: number;
  setPlaybackState: (state: Partial<PlaybackState>) => void;
  setSpectrumData: (data: Partial<SpectrumData>) => void;
  setAudioBuffer: (buffer: AudioBuffer | null) => void;
  setCursorPosition: (position: number) => void;
  reset: () => void;
}

const initialPlaybackState: PlaybackState = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.7,
  isLoaded: false,
};

const initialSpectrumData: SpectrumData = {
  frequencies: new Float32Array(128),
  waveform: new Float32Array(1024),
  timeDomainData: new Uint8Array(2048),
  freqDomainData: new Uint8Array(2048),
};

export const useStore = create<StoreState>((set) => ({
  playbackState: initialPlaybackState,
  spectrumData: initialSpectrumData,
  audioBuffer: null,
  cursorPosition: 0,
  
  setPlaybackState: (state) =>
    set((prev) => ({
      playbackState: { ...prev.playbackState, ...state },
    })),
  
  setSpectrumData: (data) =>
    set((prev) => ({
      spectrumData: { ...prev.spectrumData, ...data },
    })),
  
  setAudioBuffer: (buffer) => set({ audioBuffer: buffer }),
  
  setCursorPosition: (position) => set({ cursorPosition: position }),
  
  reset: () =>
    set({
      playbackState: initialPlaybackState,
      spectrumData: initialSpectrumData,
      audioBuffer: null,
      cursorPosition: 0,
    }),
}));
