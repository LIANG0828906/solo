export type ThemeType = 'neon' | 'aurora' | 'lava'

export interface ThemeConfig {
  name: string
  backgroundColor: string
  colorRange: {
    low: [number, number]
    mid: [number, number]
    high: [number, number]
  }
  glowEffect: boolean
  trailEffect: boolean
  dotColor: string
  sizeRange: [number, number]
}

export interface FrequencyBands {
  low: number
  mid: number
  high: number
}

export interface ParticleData {
  basePosition: Float32Array
  phaseOffset: Float32Array
  currentPosition: Float32Array
  colors: Float32Array
  sizes: Float32Array
}

export interface AudioAnalyzerState {
  frequencyData: Uint8Array
  timeDomainData: Uint8Array
  analyser: AnalyserNode | null
  audioContext: AudioContext | null
  source: MediaElementAudioSourceNode | null
}

export interface AppState {
  audioFile: File | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  particleCount: number
  speedMultiplier: number
  colorSaturation: number
  glowIntensity: number
  currentTheme: ThemeType
  frequencyData: Uint8Array
  timeDomainData: Uint8Array
  setAudioFile: (file: File | null) => void
  setIsPlaying: (playing: boolean) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setVolume: (volume: number) => void
  setParticleCount: (count: number) => void
  setSpeedMultiplier: (multiplier: number) => void
  setColorSaturation: (saturation: number) => void
  setGlowIntensity: (intensity: number) => void
  setCurrentTheme: (theme: ThemeType) => void
  setAudioData: (freq: Uint8Array, time: Uint8Array) => void
}
