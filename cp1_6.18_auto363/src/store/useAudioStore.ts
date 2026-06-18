import { create } from 'zustand'

export interface AudioFeatures {
  lowFreq: number
  midFreq: number
  highFreq: number
  overallVolume: number
}

export type ColorScheme = 'fast' | 'smooth' | 'monochrome'

export interface ParticleConfig {
  density: number
  colorScheme: ColorScheme
  damping: number
}

interface AppState {
  isCapturing: boolean
  audioFeatures: AudioFeatures
  particleConfig: ParticleConfig
  permissionError: boolean
  setCapturing: (v: boolean) => void
  setAudioFeatures: (f: AudioFeatures) => void
  setParticleConfig: (c: Partial<ParticleConfig>) => void
  setPermissionError: (v: boolean) => void
}

export const useAudioStore = create<AppState>((set) => ({
  isCapturing: false,
  audioFeatures: {
    lowFreq: 0,
    midFreq: 0,
    highFreq: 0,
    overallVolume: 0,
  },
  particleConfig: {
    density: 500,
    colorScheme: 'smooth',
    damping: 0.95,
  },
  permissionError: false,
  setCapturing: (v) => set({ isCapturing: v }),
  setAudioFeatures: (f) => set({ audioFeatures: f }),
  setParticleConfig: (c) =>
    set((state) => ({
      particleConfig: { ...state.particleConfig, ...c },
    })),
  setPermissionError: (v) => set({ permissionError: v }),
}))
