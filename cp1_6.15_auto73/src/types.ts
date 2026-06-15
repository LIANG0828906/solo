export interface ColorTheme {
  name: string
  centerColor: [number, number, number]
  edgeColor: [number, number, number]
}

export interface GalaxyParams {
  particleCount: number
  attractor1Strength: number
  attractor2Strength: number
  rotationSpeed: number
  moveSpeed: number
  paused: boolean
  colorThemeIndex: number
}

export interface ParticleTransitionState {
  active: boolean
  startTime: number
  duration: number
  oldCount: number
  newCount: number
}

export interface ColorTransitionState {
  active: boolean
  startTime: number
  duration: number
  fromTheme: ColorTheme
  toTheme: ColorTheme
}

export interface FadeInState {
  active: boolean
  startTime: number
  duration: number
}

export interface GalaxyControls {
  setParticleCount: (count: number, uiStartTime: number) => void
  setAttractor1Strength: (strength: number, uiStartTime: number) => void
  setAttractor2Strength: (strength: number, uiStartTime: number) => void
  setColorTheme: (index: number, uiStartTime: number) => void
  setMoveSpeed: (speed: number, uiStartTime: number) => void
  togglePaused: (uiStartTime: number) => boolean
  getParams: () => GalaxyParams
}

export const COLOR_THEMES: ColorTheme[] = [
  {
    name: '星云紫蓝',
    centerColor: [1.0, 0.9, 1.0],
    edgeColor: [0.3, 0.2, 0.9]
  },
  {
    name: '烈焰橙红',
    centerColor: [1.0, 0.95, 0.8],
    edgeColor: [1.0, 0.3, 0.1]
  },
  {
    name: '极光绿青',
    centerColor: [0.9, 1.0, 0.95],
    edgeColor: [0.1, 0.9, 0.8]
  }
]
