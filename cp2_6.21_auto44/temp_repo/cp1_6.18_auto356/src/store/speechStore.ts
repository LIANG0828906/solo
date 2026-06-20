import { create } from 'zustand'

type Preset = 'default' | 'warm' | 'bright' | 'deep'
type Lang = 'zh' | 'en'

interface SpeechState {
  text: string
  lang: Lang
  rate: number
  pitch: number
  volume: number
  isPlaying: boolean
  isPaused: boolean
  progress: number
  preset: Preset
  analyserNode: AnalyserNode | null
  audioContext: AudioContext | null
  setText: (text: string) => void
  setLang: (lang: Lang) => void
  setRate: (rate: number) => void
  setPitch: (pitch: number) => void
  setVolume: (volume: number) => void
  setIsPlaying: (val: boolean) => void
  setIsPaused: (val: boolean) => void
  setProgress: (val: number) => void
  setPreset: (preset: Preset) => void
  setAnalyserNode: (node: AnalyserNode | null) => void
  setAudioContext: (ctx: AudioContext | null) => void
  resetPreset: () => void
}

const presetConfig: Record<Preset, { rate: number; pitch: number; volume: number }> = {
  default: { rate: 1.0, pitch: 1.0, volume: 80 },
  warm: { rate: 0.9, pitch: 0.85, volume: 90 },
  bright: { rate: 1.1, pitch: 1.4, volume: 85 },
  deep: { rate: 0.8, pitch: 0.6, volume: 95 },
}

export const useSpeechStore = create<SpeechState>((set) => ({
  text: '',
  lang: 'zh',
  rate: 1.0,
  pitch: 1.0,
  volume: 80,
  isPlaying: false,
  isPaused: false,
  progress: 0,
  preset: 'default',
  analyserNode: null,
  audioContext: null,
  setText: (text) => set({ text: text.slice(0, 500) }),
  setLang: (lang) => set({ lang }),
  setRate: (rate) => set({ rate }),
  setPitch: (pitch) => set({ pitch }),
  setVolume: (volume) => set({ volume }),
  setIsPlaying: (val) => set({ isPlaying: val }),
  setIsPaused: (val) => set({ isPaused: val }),
  setProgress: (val) => set({ progress: val }),
  setPreset: (preset) => set({ preset, ...presetConfig[preset] }),
  setAnalyserNode: (node) => set({ analyserNode: node }),
  setAudioContext: (ctx) => set({ audioContext: ctx }),
  resetPreset: () => set({ preset: 'default', ...presetConfig.default }),
}))
