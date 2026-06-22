export type LightType = 'point' | 'spot' | 'directional'

export interface LightSource {
  id: string
  type: LightType
  position: { x: number; y: number; z: number }
  direction: { x: number; y: number; z: number }
  intensity: number
  colorTemperature: number
}

export interface LightingPlan {
  id: string
  name: string
  lights: LightSource[]
  createdAt: string
}
