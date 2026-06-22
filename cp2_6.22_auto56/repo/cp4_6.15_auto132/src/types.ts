export type GradientType = 'linear' | 'radial'

export interface GradientStop {
  id: string
  color: string
  position: number
}

export interface GradientConfig {
  type: GradientType
  angle: number
  stops: GradientStop[]
}

export interface HistoryItem {
  id: string
  timestamp: number
  config: GradientConfig
  favorite: boolean
}

export interface Palette {
  id: string
  name: string
  primary: string
  secondary: string
  accent: string
}
