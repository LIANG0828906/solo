import { create } from 'zustand';

export interface AudioParams {
  frequency: number;
  amplitude: number;
  phase: number;
}

interface AudioStore extends AudioParams {
  subscribers: Set<(params: AudioParams) => void>;
  setFrequency: (f: number) => void;
  setAmplitude: (a: number) => void;
  setPhase: (p: number) => void;
  subscribe: (callback: (params: AudioParams) => void) => () => void;
  notifySubscribers: () => void;
}

export const useAudioStore = create<AudioStore>((set, get) => ({
  frequency: 60,
  amplitude: 3,
  phase: 0,
  subscribers: new Set(),

  setFrequency: (f: number) => {
    const clamped = Math.max(20, Math.min(200, f));
    set({ frequency: clamped });
    get().notifySubscribers();
  },

  setAmplitude: (a: number) => {
    const clamped = Math.max(0, Math.min(10, a));
    set({ amplitude: clamped });
    get().notifySubscribers();
  },

  setPhase: (p: number) => {
    const twoPi = Math.PI * 2;
    let normalized = p % twoPi;
    if (normalized < 0) normalized += twoPi;
    set({ phase: normalized });
    get().notifySubscribers();
  },

  subscribe: (callback) => {
    get().subscribers.add(callback);
    return () => {
      get().subscribers.delete(callback);
    };
  },

  notifySubscribers: () => {
    const state = get();
    const params: AudioParams = {
      frequency: state.frequency,
      amplitude: state.amplitude,
      phase: state.phase
    };
    state.subscribers.forEach(cb => cb(params));
  }
}));

export function calculateWaveHeight(
  x: number,
  z: number,
  time: number,
  params: AudioParams
): number {
  const { frequency, amplitude, phase } = params;
  const omega = frequency / 100;
  const distance = Math.sqrt(x * x + z * z);
  const wave = Math.sin(distance * omega + time * frequency * 0.05 + phase) * amplitude;
  const waveX = Math.sin(x * omega * 0.7 + phase * 0.5) * amplitude * 0.3;
  const waveZ = Math.cos(z * omega * 0.7 + phase * 0.5) * amplitude * 0.3;
  return wave + waveX + waveZ;
}

export function calculateGradient(
  x: number,
  z: number,
  time: number,
  params: AudioParams,
  baseHeightFn: (x: number, z: number) => number,
  epsilon: number = 1
): { dx: number; dz: number; height: number } {
  const hCenter = baseHeightFn(x, z) + calculateWaveHeight(x, z, time, params);
  const hX = baseHeightFn(x + epsilon, z) + calculateWaveHeight(x + epsilon, z, time, params);
  const hZ = baseHeightFn(x, z + epsilon) + calculateWaveHeight(x, z + epsilon, time, params);
  return {
    dx: (hX - hCenter) / epsilon,
    dz: (hZ - hCenter) / epsilon,
    height: hCenter
  };
}
