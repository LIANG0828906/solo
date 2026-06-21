
import axios from 'axios'
import type { ColorStop } from './CanvasRenderer'
import type { NoiseType } from './NoiseEngine'

export interface Preset {
  id: string
  name: string
  noiseType: NoiseType
  frequency: number
  octaves: number
  seed: number
  colorStops: ColorStop[]
  createdAt: number
}

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
})

export async function getPresets(): Promise<Preset[]> {
  try {
    const response = await api.get<{ presets: Preset[] }>('/presets')
    return response.data.presets
  } catch (error) {
    console.error('Failed to fetch presets:', error)
    return []
  }
}

export interface SavePresetRequest {
  name: string
  noiseType: NoiseType
  frequency: number
  octaves: number
  seed: number
  colorStops: ColorStop[]
}

export async function savePreset(data: SavePresetRequest): Promise<Preset | null> {
  try {
    const response = await api.post<{ success: boolean; preset: Preset }>('/presets', data)
    if (response.data.success) {
      return response.data.preset
    }
    return null
  } catch (error) {
    console.error('Failed to save preset:', error)
    return null
  }
}
