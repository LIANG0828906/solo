import { create } from 'zustand'
import { PARTICLE_CONFIG, UI_CONFIG } from '@/config/constants'
import { AudioAnalyzer } from '@/audio/AudioAnalyzer'

interface AppState {
  audioFile: File | null
  audioBuffer: AudioBuffer | null
  isAnalyzing: boolean
  isPlaying: boolean
  analysisProgress: number
  hueShift: number
  particleCount: number
  audioAnalyzer: AudioAnalyzer | null
  showExportMenu: boolean
  isExportingVideo: boolean
  exportProgress: number
  controlPanelOpen: boolean
  error: string | null

  setAudioFile: (file: File | null) => void
  setAudioBuffer: (buffer: AudioBuffer | null) => void
  setIsAnalyzing: (analyzing: boolean) => void
  setIsPlaying: (playing: boolean) => void
  setAnalysisProgress: (progress: number) => void
  setHueShift: (value: number) => void
  setParticleCount: (value: number) => void
  setAudioAnalyzer: (analyzer: AudioAnalyzer | null) => void
  setShowExportMenu: (show: boolean) => void
  setIsExportingVideo: (exporting: boolean) => void
  setExportProgress: (progress: number) => void
  setControlPanelOpen: (open: boolean) => void
  setError: (error: string | null) => void
  resetAudio: () => void
}

export const useAppStore = create<AppState>((set) => ({
  audioFile: null,
  audioBuffer: null,
  isAnalyzing: false,
  isPlaying: false,
  analysisProgress: 0,
  hueShift: UI_CONFIG.HUE_DEFAULT,
  particleCount: PARTICLE_CONFIG.DEFAULT_COUNT,
  audioAnalyzer: null,
  showExportMenu: false,
  isExportingVideo: false,
  exportProgress: 0,
  controlPanelOpen: false,
  error: null,

  setAudioFile: (file) => set({ audioFile: file }),
  setAudioBuffer: (buffer) => set({ audioBuffer: buffer }),
  setIsAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setAnalysisProgress: (progress) => set({ analysisProgress: progress }),
  setHueShift: (value) => set({ hueShift: value }),
  setParticleCount: (value) => set({ particleCount: value }),
  setAudioAnalyzer: (analyzer) => set({ audioAnalyzer: analyzer }),
  setShowExportMenu: (show) => set({ showExportMenu: show }),
  setIsExportingVideo: (exporting) => set({ isExportingVideo: exporting }),
  setExportProgress: (progress) => set({ exportProgress: progress }),
  setControlPanelOpen: (open) => set({ controlPanelOpen: open }),
  setError: (error) => set({ error }),
  resetAudio: () =>
    set({
      audioFile: null,
      audioBuffer: null,
      isAnalyzing: false,
      isPlaying: false,
      analysisProgress: 0,
      error: null,
    }),
}))
