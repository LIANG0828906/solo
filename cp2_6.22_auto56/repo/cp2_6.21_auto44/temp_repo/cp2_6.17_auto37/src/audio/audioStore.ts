import { create } from 'zustand';

export type PulseType = 'normal' | 'highFrequency' | 'echo' | 'collect' | 'exit' | 'gameover' | 'blind';

export interface AudioStore {
  masterVolume: number;
  pulseVolume: number;
  sfxVolume: number;
  currentPulseType: PulseType | null;

  playPulse: (type: PulseType) => void;
  playCollect: () => void;
  playAlert: () => void;
  playExit: () => void;
  playGameOver: () => void;
  playBlind: () => void;
  setVolume: (volume: number) => void;
  setCurrentPulseType: (type: PulseType | null) => void;
}

export const useAudioStore = create<AudioStore>((set) => ({
  masterVolume: 0.5,
  pulseVolume: 0.4,
  sfxVolume: 0.5,
  currentPulseType: null,

  playPulse: (type: PulseType) => set({ currentPulseType: type }),
  playCollect: () => set({ currentPulseType: 'collect' }),
  playAlert: () => set({ currentPulseType: 'echo' }),
  playExit: () => set({ currentPulseType: 'exit' }),
  playGameOver: () => set({ currentPulseType: 'gameover' }),
  playBlind: () => set({ currentPulseType: 'blind' }),
  setVolume: (volume: number) => set({ masterVolume: volume }),
  setCurrentPulseType: (type: PulseType | null) => set({ currentPulseType: type })
}));
