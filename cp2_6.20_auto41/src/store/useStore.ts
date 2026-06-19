import { create } from 'zustand'
import {
  AudioAnalysisResult,
  AudioState,
  ControlParams,
  DEFAULT_CONTROL_PARAMS,
  FPSState,
  VisualizationMode,
  VisualizerPreset,
} from '@/types'

interface VisualizerState {
  audioAnalysis: AudioAnalysisResult | null
  audioState: AudioState
  controlParams: ControlParams
  fpsState: FPSState

  setAudioAnalysis: (analysis: AudioAnalysisResult) => void
  setAudioState: (state: Partial<AudioState>) => void
  setControlParams: (params: Partial<ControlParams>) => void
  setFPSState: (state: Partial<FPSState>) => void
  setPreset: (preset: VisualizerPreset) => void
  setVisualizationMode: (mode: VisualizationMode) => void
  togglePerformanceMode: () => void
  reset: () => void
}

const initialAudioState: AudioState = {
  isPlaying: false,
  isLoading: false,
  currentFileName: '',
  currentTime: 0,
  duration: 0,
}

const initialFPSState: FPSState = {
  fps: 60,
  isLowFPS: false,
  manualOverride: false,
}

const initialAudioAnalysis: AudioAnalysisResult = {
  frequencyData: new Uint8Array(256),
  waveformData: new Uint8Array(256),
  lowFrequency: 0,
  midFrequency: 0,
  highFrequency: 0,
  averageVolume: 0,
  isBeat: false,
  timestamp: 0,
  beatIntensity: 0,
  estimatedBPM: null,
}

export const useVisualizerStore = create<VisualizerState>((set) => ({
  audioAnalysis: initialAudioAnalysis,
  audioState: initialAudioState,
  controlParams: { ...DEFAULT_CONTROL_PARAMS },
  fpsState: initialFPSState,

  setAudioAnalysis: (analysis) =>
    set((state) => ({
      audioAnalysis: {
        ...state.audioAnalysis,
        ...analysis,
      },
    })),

  setAudioState: (newState) =>
    set((state) => ({
      audioState: {
        ...state.audioState,
        ...newState,
      },
    })),

  setControlParams: (params) =>
    set((state) => ({
      controlParams: {
        ...state.controlParams,
        ...params,
      },
    })),

  setFPSState: (state) =>
    set((prev) => ({
      fpsState: {
        ...prev.fpsState,
        ...state,
      },
    })),

  setPreset: (preset) =>
    set((state) => ({
      controlParams: {
        ...state.controlParams,
        currentPreset: preset,
      },
    })),

  setVisualizationMode: (mode) =>
    set((state) => ({
      controlParams: {
        ...state.controlParams,
        visualizationMode: mode,
      },
    })),

  togglePerformanceMode: () =>
    set((state) => ({
      controlParams: {
        ...state.controlParams,
        performanceMode: !state.controlParams.performanceMode,
        particleCount: !state.controlParams.performanceMode ? 2000 : 5000,
      },
      fpsState: {
        ...state.fpsState,
        manualOverride: true,
      },
    })),

  reset: () =>
    set({
      audioAnalysis: initialAudioAnalysis,
      audioState: initialAudioState,
      controlParams: { ...DEFAULT_CONTROL_PARAMS },
      fpsState: initialFPSState,
    }),
}))

export const useAudioAnalysis = () =>
  useVisualizerStore((state) => state.audioAnalysis)
export const useAudioState = () =>
  useVisualizerStore((state) => state.audioState)
export const useControlParams = () =>
  useVisualizerStore((state) => state.controlParams)
export const useFPSState = () =>
  useVisualizerStore((state) => state.fpsState)
