import { create } from 'zustand'

export type VisualizerMode = 'waveform' | 'spectrum' | 'circular' | 'particle'

export interface VisualizerState {
  mode: VisualizerMode
  isPlaying: boolean
  primaryColor: string
  backgroundColor: string
  theme: 'dark' | 'light'
  transitionOpacity: number
  waveformLineWidth: number
  fftSize: number
  spectrumBarWidth: number
  spectrumColorMode: 'solid' | 'rainbow'
  circularRadius: number
  particleCount: number
  audioFileName: string | null
  setMode: (mode: VisualizerMode) => void
  setPlaying: (playing: boolean) => void
  setPrimaryColor: (color: string) => void
  setBackgroundColor: (color: string) => void
  setTheme: (theme: 'dark' | 'light') => void
  setParam: (key: string, value: number | string) => void
  setTransitionOpacity: (opacity: number) => void
  setAudioFileName: (name: string | null) => void
}

export const useVisualizerStore = create<VisualizerState>((set) => ({
  mode: 'waveform',
  isPlaying: false,
  primaryColor: '#6366f1',
  backgroundColor: '#0f172a',
  theme: 'dark',
  transitionOpacity: 1,
  waveformLineWidth: 2,
  fftSize: 1024,
  spectrumBarWidth: 4,
  spectrumColorMode: 'rainbow',
  circularRadius: 150,
  particleCount: 100,
  audioFileName: null,

  setMode: (mode) => {
    set({ transitionOpacity: 0 })
    setTimeout(() => {
      set({ mode, transitionOpacity: 1 })
    }, 300)
  },

  setPlaying: (playing) => set({ isPlaying: playing }),

  setPrimaryColor: (color) => {
    document.documentElement.style.setProperty('--primary', color)
    set({ primaryColor: color })
  },

  setBackgroundColor: (color) => set({ backgroundColor: color }),

  setTheme: (theme) => {
    if (theme === 'light') {
      document.body.classList.add('light-theme')
      set({
        theme,
        backgroundColor: '#f8fafc'
      })
    } else {
      document.body.classList.remove('light-theme')
      set({
        theme,
        backgroundColor: '#0f172a'
      })
    }
  },

  setParam: (key, value) => set({ [key]: value } as Partial<VisualizerState>),

  setTransitionOpacity: (opacity) => set({ transitionOpacity: opacity }),

  setAudioFileName: (name) => set({ audioFileName: name })
}))

export const presetColors = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'
]
