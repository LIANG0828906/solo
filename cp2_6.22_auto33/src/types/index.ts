export type EffectType = 'bars' | 'waveform' | 'particles'
export type Sensitivity = 'low' | 'medium' | 'high'
export type ColorTheme = 'neon' | 'ocean' | 'aurora'

export interface VisualizationPreset {
  id: string
  name: string
  effectType: EffectType
  particleSpeed: number
  sensitivity: Sensitivity
  colorTheme: ColorTheme
  createdAt: number
}

export interface AudioDataPayload {
  frequencyData: Uint8Array
  timeData: Uint8Array
  sampleRate: number
}

export interface PerformanceMetrics {
  fps: number
  sampleRate: number
  switchTime: number
}

export interface ColorThemeConfig {
  name: string
  primary: string
  secondary: string
  accent: string
  gradient: [string, string]
  particle: [string, string]
}

export const COLOR_THEMES: Record<ColorTheme, ColorThemeConfig> = {
  neon: {
    name: '霓虹紫',
    primary: '#8a2be2',
    secondary: '#ff00ff',
    accent: '#00ffff',
    gradient: ['#0066ff', '#ff69b4'],
    particle: ['#8a2be2', '#ff00ff']
  },
  ocean: {
    name: '海洋蓝',
    primary: '#0077be',
    secondary: '#00d4ff',
    accent: '#00ffcc',
    gradient: ['#001a33', '#00aaff'],
    particle: ['#0077be', '#00ffff']
  },
  aurora: {
    name: '极光绿',
    primary: '#00ff88',
    secondary: '#88ff00',
    accent: '#00ffcc',
    gradient: ['#003322', '#00ff88'],
    particle: ['#00ff88', '#88ff00']
  }
}

export const SENSITIVITY_MULTIPLIERS: Record<Sensitivity, number> = {
  low: 0.7,
  medium: 1.0,
  high: 1.5
}
