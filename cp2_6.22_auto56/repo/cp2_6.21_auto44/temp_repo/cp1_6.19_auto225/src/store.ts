import { create } from 'zustand';
import {
  StoreState,
  WaveType,
  TriggerMode,
  ChannelKey,
  WaveParams,
} from './types';

function defaultWave(type: WaveType, freq: number): WaveParams {
  return {
    type,
    frequency: freq,
    amplitude: 0.8,
    phase: 0,
    dutyCycle: 0.5,
    noiseLevel: 0,
    mix: 0.25,
    enabled: true,
  };
}

export const useWaveformStore = create<StoreState>((set) => ({
  ch1: defaultWave(WaveType.SINE, 100),
  ch2: defaultWave(WaveType.SQUARE, 200),
  ch3: { ...defaultWave(WaveType.TRIANGLE, 300), enabled: false },
  ch4: { ...defaultWave(WaveType.SAWTOOTH, 400), enabled: false },

  masterMix: 0.9,
  timeBase: 5,
  triggerMode: TriggerMode.AUTO,
  triggerSource: 'ch1',
  triggerLevel: 0,
  sampleRate: 1024,
  cursors: {
    h1: 0.5,
    h2: -0.5,
    v1: 0.002,
    v2: 0.008,
  },
  showIndividualWaves: true,
  showCursors: false,

  setChannelParam: (ch, key, value) =>
    set((state) => ({
      [ch]: { ...(state[ch] as WaveParams), [key]: value },
    })),

  setMasterMix: (v) => set({ masterMix: Math.max(0, Math.min(1, v)) }),

  setTimeBase: (v) => set({ timeBase: Math.max(1, Math.min(100, v)) }),

  setTriggerMode: (m) => set({ triggerMode: m }),

  setTriggerSource: (s) => set({ triggerSource: s }),

  setTriggerLevel: (v) => set({ triggerLevel: Math.max(-1, Math.min(1, v)) }),

  setCursor: (key, value) =>
    set((state) => ({
      cursors: { ...state.cursors, [key]: value },
    })),

  toggleShowIndividual: () =>
    set((state) => ({ showIndividualWaves: !state.showIndividualWaves })),

  toggleShowCursors: () =>
    set((state) => ({ showCursors: !state.showCursors })),

  setSampleRate: (r) => set({ sampleRate: r }),
}));

export function useChannelParam<K extends keyof WaveParams>(
  ch: ChannelKey,
  key: K,
): WaveParams[K] {
  return useWaveformStore((s) => (s[ch] as WaveParams)[key]);
}
