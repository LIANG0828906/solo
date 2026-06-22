import { create } from 'zustand'
import type { AppState, ThemeType } from '@/types'

const initialFrequencyData = new Uint8Array(128)
const initialTimeDomainData = new Uint8Array(128)

export const useAppStore = create<AppState>((set) => ({
  audioFile: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.7,
  particleCount: 20000,
  speedMultiplier: 1.0,
  colorSaturation: 80,
  glowIntensity: 0.5,
  currentTheme: 'neon',
  frequencyData: initialFrequencyData,
  timeDomainData: initialTimeDomainData,

  setAudioFile: (file) => set({ audioFile: file }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume }),
  setParticleCount: (count) => set({ particleCount: count }),
  setSpeedMultiplier: (multiplier) => set({ speedMultiplier: multiplier }),
  setColorSaturation: (saturation) => set({ colorSaturation: saturation }),
  setGlowIntensity: (intensity) => set({ glowIntensity: intensity }),
  setCurrentTheme: (theme: ThemeType) => set({ currentTheme: theme }),
  setAudioData: (freq, time) => set({ frequencyData: freq, timeDomainData: time }),
}))
