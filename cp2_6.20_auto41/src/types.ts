export type VisualizerPreset = 'nebula' | 'pulse' | 'spiral'

export type VisualizationMode = '3d' | '2d' | 'spectrum'

export interface AudioAnalysisResult {
  frequencyData: Uint8Array
  waveformData: Uint8Array
  lowFrequency: number
  midFrequency: number
  highFrequency: number
  averageVolume: number
  isBeat: boolean
  timestamp: number
}

export interface ParticleData {
  id: string
  position: { x: number; y: number; z: number }
  basePosition: { x: number; y: number; z: number }
  velocity: { x: number; y: number; z: number }
  color: { r: number; g: number; b: number }
  size: number
  baseSize: number
  frequencyIndex: number
  angle: number
  radius: number
  phase: number
}

export interface ControlParams {
  particleCount: number
  speed: number
  colorSensitivity: number
  opacity: number
  currentPreset: VisualizerPreset
  visualizationMode: VisualizationMode
  performanceMode: boolean
}

export interface AudioState {
  isPlaying: boolean
  isLoading: boolean
  currentFileName: string
  currentTime: number
  duration: number
}

export interface FPSState {
  fps: number
  isLowFPS: boolean
  manualOverride: boolean
}

export interface PresetConfig {
  name: string
  label: string
  motion: {
    type: 'flow' | 'expand' | 'rotate'
    speedMultiplier: number
    amplitude: number
  }
  distribution: {
    type: 'sphere' | 'cube' | 'disc'
    radius: number
  }
  colorMapping: {
    low: string
    mid: string
    high: string
  }
}

export const PRESET_CONFIGS: Record<VisualizerPreset, PresetConfig> = {
  nebula: {
    name: 'nebula',
    label: '星云流动',
    motion: {
      type: 'flow',
      speedMultiplier: 0.8,
      amplitude: 2.0
    },
    distribution: {
      type: 'sphere',
      radius: 8.0
    },
    colorMapping: {
      low: '#ff4500',
      mid: '#9acd32',
      high: '#4169e1'
    }
  },
  pulse: {
    name: 'pulse',
    label: '脉冲膨胀',
    motion: {
      type: 'expand',
      speedMultiplier: 1.2,
      amplitude: 3.0
    },
    distribution: {
      type: 'sphere',
      radius: 6.0
    },
    colorMapping: {
      low: '#ff6347',
      mid: '#ffd700',
      high: '#00bfff'
    }
  },
  spiral: {
    name: 'spiral',
    label: '螺旋旋转',
    motion: {
      type: 'rotate',
      speedMultiplier: 1.5,
      amplitude: 1.5
    },
    distribution: {
      type: 'disc',
      radius: 9.0
    },
    colorMapping: {
      low: '#ff1493',
      mid: '#00ff7f',
      high: '#9400d3'
    }
  }
}

export const DEFAULT_CONTROL_PARAMS: ControlParams = {
  particleCount: 5000,
  speed: 1.0,
  colorSensitivity: 1.0,
  opacity: 0.8,
  currentPreset: 'nebula',
  visualizationMode: '3d',
  performanceMode: false
}
