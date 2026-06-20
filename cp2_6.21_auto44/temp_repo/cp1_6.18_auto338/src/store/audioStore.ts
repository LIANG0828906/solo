import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type EffectType = 'lowcut' | 'reverb' | 'delay' | 'compressor' | 'none';

export interface EffectSlot {
  id: string;
  type: EffectType;
  enabled: boolean;
  position: 'pre' | 'post';
  params: {
    cutoff?: number;
    wetDry?: number;
    feedback?: number;
    threshold?: number;
  };
}

export interface Track {
  id: string;
  title: string;
  color: string;
  volume: number;
  muted: boolean;
  solo: boolean;
  audioBufferId: string | null;
  clipStart: number;
  clipEnd: number;
  duration: number;
  effectSlots: EffectSlot[];
}

export interface AudioState {
  tracks: Track[];
  globalBpm: number;
  globalVolume: number;
  isPlaying: boolean;
  peakLevels: Record<string, number>;
  rmsLevels: Record<string, number>;
  peakHoldValues: Record<string, number>;
  peakHoldTimers: Record<string, number>;
  addTrack: () => void;
  removeTrack: (id: string) => void;
  updateTrack: (id: string, updates: Partial<Track>) => void;
  setTrackTitle: (id: string, title: string) => void;
  setTrackColor: (id: string, color: string) => void;
  setTrackVolume: (id: string, volume: number) => void;
  toggleMute: (id: string) => void;
  toggleSolo: (id: string) => void;
  setClipRange: (id: string, start: number, end: number) => void;
  setAudioBuffer: (id: string, bufferId: string, duration: number) => void;
  setEffectType: (trackId: string, slotId: string, type: EffectType) => void;
  setEffectEnabled: (trackId: string, slotId: string, enabled: boolean) => void;
  setEffectPosition: (trackId: string, slotId: string, position: 'pre' | 'post') => void;
  setEffectParam: (trackId: string, slotId: string, param: string, value: number) => void;
  setGlobalBpm: (bpm: number) => void;
  setGlobalVolume: (volume: number) => void;
  togglePlay: () => void;
  setIsPlaying: (playing: boolean) => void;
  setRmsLevel: (trackId: string, level: number) => void;
  setPeakLevel: (trackId: string, level: number) => void;
}

const COLOR_PALETTE = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1'
];

const createDefaultEffectSlots = (): EffectSlot[] => [
  { id: uuidv4(), type: 'none', enabled: false, position: 'pre', params: {} },
  { id: uuidv4(), type: 'none', enabled: false, position: 'pre', params: {} },
  { id: uuidv4(), type: 'none', enabled: false, position: 'post', params: {} }
];

const createDefaultTrack = (index: number): Track => ({
  id: uuidv4(),
  title: `轨道 ${index + 1}`,
  color: COLOR_PALETTE[index % COLOR_PALETTE.length],
  volume: 75,
  muted: false,
  solo: false,
  audioBufferId: null,
  clipStart: 0,
  clipEnd: 0,
  duration: 0,
  effectSlots: createDefaultEffectSlots()
});

export const useAudioStore = create<AudioState>((set) => ({
  tracks: [createDefaultTrack(0), createDefaultTrack(1)],
  globalBpm: 120,
  globalVolume: 80,
  isPlaying: false,
  peakLevels: {},
  rmsLevels: {},
  peakHoldValues: {},
  peakHoldTimers: {},

  addTrack: () => set((state) => {
    if (state.tracks.length >= 8) return state;
    return { tracks: [...state.tracks, createDefaultTrack(state.tracks.length)] };
  }),

  removeTrack: (id) => set((state) => ({
    tracks: state.tracks.filter((t) => t.id !== id)
  })),

  updateTrack: (id, updates) => set((state) => ({
    tracks: state.tracks.map((t) => t.id === id ? { ...t, ...updates } : t)
  })),

  setTrackTitle: (id, title) => set((state) => ({
    tracks: state.tracks.map((t) => t.id === id ? { ...t, title } : t)
  })),

  setTrackColor: (id, color) => set((state) => ({
    tracks: state.tracks.map((t) => t.id === id ? { ...t, color } : t)
  })),

  setTrackVolume: (id, volume) => set((state) => ({
    tracks: state.tracks.map((t) => t.id === id ? { ...t, volume } : t)
  })),

  toggleMute: (id) => set((state) => ({
    tracks: state.tracks.map((t) => t.id === id ? { ...t, muted: !t.muted } : t)
  })),

  toggleSolo: (id) => set((state) => ({
    tracks: state.tracks.map((t) => t.id === id ? { ...t, solo: !t.solo } : t)
  })),

  setClipRange: (id, start, end) => set((state) => ({
    tracks: state.tracks.map((t) => t.id === id ? { ...t, clipStart: start, clipEnd: end } : t)
  })),

  setAudioBuffer: (id, bufferId, duration) => set((state) => ({
    tracks: state.tracks.map((t) =>
      t.id === id ? { ...t, audioBufferId: bufferId, duration, clipStart: 0, clipEnd: duration } : t
    )
  })),

  setEffectType: (trackId, slotId, type) => set((state) => ({
    tracks: state.tracks.map((t) => {
      if (t.id !== trackId) return t;
      return {
        ...t,
        effectSlots: t.effectSlots.map((slot) => {
          if (slot.id !== slotId) return slot;
          const defaultParams: Record<string, number> = {};
          if (type === 'lowcut') defaultParams.cutoff = 200;
          if (type === 'reverb') defaultParams.wetDry = 30;
          if (type === 'delay') defaultParams.feedback = 30;
          if (type === 'compressor') defaultParams.threshold = -12;
          return { ...slot, type, params: defaultParams, enabled: type !== 'none' };
        })
      };
    })
  })),

  setEffectEnabled: (trackId, slotId, enabled) => set((state) => ({
    tracks: state.tracks.map((t) => {
      if (t.id !== trackId) return t;
      return {
        ...t,
        effectSlots: t.effectSlots.map((slot) =>
          slot.id === slotId ? { ...slot, enabled } : slot
        )
      };
    })
  })),

  setEffectPosition: (trackId, slotId, position) => set((state) => ({
    tracks: state.tracks.map((t) => {
      if (t.id !== trackId) return t;
      return {
        ...t,
        effectSlots: t.effectSlots.map((slot) =>
          slot.id === slotId ? { ...slot, position } : slot
        )
      };
    })
  })),

  setEffectParam: (trackId, slotId, param, value) => set((state) => ({
    tracks: state.tracks.map((t) => {
      if (t.id !== trackId) return t;
      return {
        ...t,
        effectSlots: t.effectSlots.map((slot) => {
          if (slot.id !== slotId) return slot;
          return { ...slot, params: { ...slot.params, [param]: value } };
        })
      };
    })
  })),

  setGlobalBpm: (bpm) => set({ globalBpm: bpm }),

  setGlobalVolume: (volume) => set({ globalVolume: volume }),

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  setIsPlaying: (playing) => set({ isPlaying: playing }),

  setRmsLevel: (trackId, level) => set((state) => ({
    rmsLevels: { ...state.rmsLevels, [trackId]: level }
  })),

  setPeakLevel: (trackId, level) => set((state) => {
    const now = Date.now();
    const currentHold = state.peakHoldValues[trackId] || 0;
    const holdTime = state.peakHoldTimers[trackId] || 0;
    let newHoldValue = currentHold;
    let newHoldTime = holdTime;

    if (level > currentHold || now - holdTime > 2000) {
      newHoldValue = level;
      newHoldTime = now;
    }

    return {
      peakLevels: { ...state.peakLevels, [trackId]: level },
      peakHoldValues: { ...state.peakHoldValues, [trackId]: newHoldValue },
      peakHoldTimers: { ...state.peakHoldTimers, [trackId]: newHoldTime }
    };
  })
}));

export { COLOR_PALETTE };
