import { create } from 'zustand'

export type AudioSourceType = 'mic' | 'file' | null

export interface PresetConfig {
  name: string
  hueStart: number
  hueEnd: number
  speedBase: number
  saturation: number
  value: number
}

export const PRESETS: Record<string, PresetConfig> = {
  neon: {
    name: '霓虹光谱',
    hueStart: 0,
    hueEnd: 360,
    speedBase: 1.0,
    saturation: 100,
    value: 100,
  },
  galaxy: {
    name: '银河星云',
    hueStart: 240,
    hueEnd: 320,
    speedBase: 0.6,
    saturation: 80,
    value: 90,
  },
  forest: {
    name: '森林精灵',
    hueStart: 80,
    hueEnd: 160,
    speedBase: 0.8,
    saturation: 75,
    value: 85,
  },
  ocean: {
    name: '海洋泡沫',
    hueStart: 180,
    hueEnd: 230,
    speedBase: 0.7,
    saturation: 70,
    value: 95,
  },
}

export interface AudioState {
  spectrum: Float32Array
  volume: number
  beat: boolean
  beatTimestamp: number
  sourceType: AudioSourceType
  isPlaying: boolean
  presetKey: string
  particleCount: number

  setSpectrum: (spectrum: Float32Array) => void
  setVolume: (volume: number) => void
  triggerBeat: () => void
  setSourceType: (type: AudioSourceType) => void
  setIsPlaying: (playing: boolean) => void
  setPresetKey: (key: string) => void
  setParticleCount: (count: number) => void
  reset: () => void
}

const initialSpectrum = new Float32Array(256)

export const useAudioStore = create<AudioState>((set) => ({
  spectrum: initialSpectrum,
  volume: 0,
  beat: false,
  beatTimestamp: 0,
  sourceType: null,
  isPlaying: false,
  presetKey: 'neon',
  particleCount: 800,

  setSpectrum: (spectrum) => set({ spectrum }),
  setVolume: (volume) => set({ volume }),
  triggerBeat: () => set({ beat: true, beatTimestamp: Date.now() }),
  setSourceType: (type) => set({ sourceType: type, isPlaying: type !== null }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setPresetKey: (key) => set({ presetKey: key }),
  setParticleCount: (count) => set({ particleCount: count }),
  reset: () => set({
    spectrum: new Float32Array(256),
    volume: 0,
    beat: false,
    beatTimestamp: 0,
    isPlaying: false,
  }),
}))
