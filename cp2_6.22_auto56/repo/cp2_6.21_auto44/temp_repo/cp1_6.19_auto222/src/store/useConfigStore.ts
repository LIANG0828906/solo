import { create } from 'zustand'

export type MaterialType = 'matte' | 'walnut' | 'mirror'
export type EnvironmentType = 'studio' | 'sunset' | 'neon'

interface ConfigState {
  color: string
  material: MaterialType
  environment: EnvironmentType
  setColor: (color: string) => void
  setMaterial: (material: MaterialType) => void
  setEnvironment: (environment: EnvironmentType) => void
}

export const useConfigStore = create<ConfigState>((set) => ({
  color: '#FF6B35',
  material: 'walnut',
  environment: 'studio',
  setColor: (color) => set({ color }),
  setMaterial: (material) => set({ material }),
  setEnvironment: (environment) => set({ environment }),
}))

export const COLOR_PRESETS = [
  '#FF6B35',
  '#2D3436',
  '#636E72',
  '#DFE6E9',
  '#E17055',
  '#00B894',
  '#6C5CE7',
  '#FDCB6E',
]

export const MATERIAL_LABELS: Record<MaterialType, string> = {
  matte: '磨砂黑',
  walnut: '胡桃木纹',
  mirror: '镜面银',
}

export const ENVIRONMENT_LABELS: Record<EnvironmentType, string> = {
  studio: 'Studio',
  sunset: 'Sunset',
  neon: 'Neon',
}
