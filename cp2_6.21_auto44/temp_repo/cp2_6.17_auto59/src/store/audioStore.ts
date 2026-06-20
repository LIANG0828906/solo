import { create } from 'zustand';

export const FFT_SIZE = 1024;
export const TIME_DOMAIN_SIZE = 1024;

interface AudioState {
  frequencyData: Uint8Array;
  timeDomainData: Uint8Array;
  beat: number;
  volume: number;
  isPlaying: boolean;
  fileName: string;
  duration: number;
  update: (
    frequencyData: Uint8Array,
    timeDomainData: Uint8Array,
    beat: number,
    volume: number,
  ) => void;
  setPlaying: (isPlaying: boolean) => void;
  setTrackInfo: (fileName: string, duration: number) => void;
  setVolume: (volume: number) => void;
}

export const useAudioStore = create<AudioState>((set) => ({
  frequencyData: new Uint8Array(FFT_SIZE / 2),
  timeDomainData: new Uint8Array(TIME_DOMAIN_SIZE),
  beat: 0,
  volume: 0.8,
  isPlaying: false,
  fileName: '',
  duration: 0,
  update: (frequencyData, timeDomainData, beat, volume) =>
    set({ frequencyData, timeDomainData, beat, volume }),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setTrackInfo: (fileName, duration) => set({ fileName, duration }),
  setVolume: (volume) => set({ volume }),
}));
