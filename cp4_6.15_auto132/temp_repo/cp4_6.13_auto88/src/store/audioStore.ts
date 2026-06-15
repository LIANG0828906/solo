import { create } from 'zustand';
import type { AudioFeatures, AudioSourceType } from '@/types';
import { AUDIO_CONSTANTS } from '@/utils/constants';

interface AudioState extends AudioFeatures {
  audioFileName: string;
  error: string | null;
  isLoading: boolean;
  setAudioFeatures: (features: Partial<AudioFeatures>) => void;
  setPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setAudioSourceType: (type: AudioSourceType) => void;
  setAudioFileName: (name: string) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  resetAudio: () => void;
}

const createInitialFrequencyData = (): Uint8Array =>
  new Uint8Array(AUDIO_CONSTANTS.FFT_SIZE / 2);

const createInitialTimeDomainData = (): Uint8Array =>
  new Uint8Array(AUDIO_CONSTANTS.FFT_SIZE);

const initialAudioFeatures: AudioFeatures = {
  isPlaying: false,
  duration: 0,
  currentTime: 0,
  amplitude: 0,
  bass: 0,
  mid: 0,
  treble: 0,
  frequencyData: createInitialFrequencyData(),
  timeDomainData: createInitialTimeDomainData(),
  beatDetected: false,
  bpm: 0,
  audioSourceType: null,
};

export const useAudioStore = create<AudioState>((set) => ({
  ...initialAudioFeatures,
  audioFileName: '',
  error: null,
  isLoading: false,

  setAudioFeatures: (features) =>
    set((state) => {
      const newState: Partial<AudioState> = {};
      if ('isPlaying' in features) newState.isPlaying = features.isPlaying;
      if ('duration' in features) newState.duration = features.duration;
      if ('currentTime' in features) newState.currentTime = features.currentTime;
      if ('amplitude' in features) newState.amplitude = features.amplitude;
      if ('bass' in features) newState.bass = features.bass;
      if ('mid' in features) newState.mid = features.mid;
      if ('treble' in features) newState.treble = features.treble;
      if ('frequencyData' in features)
        newState.frequencyData = features.frequencyData;
      if ('timeDomainData' in features)
        newState.timeDomainData = features.timeDomainData;
      if ('beatDetected' in features)
        newState.beatDetected = features.beatDetected;
      if ('bpm' in features) newState.bpm = features.bpm;
      if ('audioSourceType' in features)
        newState.audioSourceType = features.audioSourceType;
      return newState;
    }),

  setPlaying: (isPlaying) => set({ isPlaying }),

  setCurrentTime: (currentTime) => set({ currentTime }),

  setDuration: (duration) => set({ duration }),

  setAudioSourceType: (audioSourceType) => set({ audioSourceType }),

  setAudioFileName: (audioFileName) => set({ audioFileName }),

  setError: (error) => set({ error }),

  setLoading: (isLoading) => set({ isLoading }),

  resetAudio: () =>
    set({
      ...initialAudioFeatures,
      frequencyData: createInitialFrequencyData(),
      timeDomainData: createInitialTimeDomainData(),
      audioFileName: '',
      error: null,
      isLoading: false,
    }),
}));

export const selectBandEnergy = (band: 'bass' | 'mid' | 'treble') => {
  return (state: AudioState) => state[band];
};

export const selectIsPlaying = (state: AudioState) => state.isPlaying;
export const selectAmplitude = (state: AudioState) => state.amplitude;
export const selectFrequencyData = (state: AudioState) => state.frequencyData;
export const selectTimeDomainData = (state: AudioState) => state.timeDomainData;
export const selectBeatDetected = (state: AudioState) => state.beatDetected;
