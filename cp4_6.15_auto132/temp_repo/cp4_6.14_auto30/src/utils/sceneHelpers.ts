import { v4 as uuidv4 } from 'uuid'

export interface LightPreset {
  id: string
  name: string
  thumbnail?: string
  ambient: { color: string; intensity: number }
  directional: { color: string; intensity: number; position: [number, number, number] }
  pointLights: Array<{
    color: string
    intensity: number
    position: [number, number, number]
    distance: number
  }>
}

export interface MarkPoint {
  id: string
  position: [number, number, number]
  normal: [number, number, number]
  materialName: string
  lightIntensity: number
  worldPosition: { x: number; y: number }
}

export const defaultPresets: LightPreset[] = [
  {
    id: uuidv4(),
    name: '日光',
    thumbnail: undefined,
    ambient: { color: '#ffffff', intensity: 0.6 },
    directional: { color: '#fff8e7', intensity: 2.5, position: [5, 8, 5] },
    pointLights: [],
  },
  {
    id: uuidv4(),
    name: '阴天',
    thumbnail: undefined,
    ambient: { color: '#c8d6e5', intensity: 1.2 },
    directional: { color: '#b8c5d6', intensity: 1.0, position: [3, 6, 3] },
    pointLights: [],
  },
  {
    id: uuidv4(),
    name: '黄昏',
    thumbnail: undefined,
    ambient: { color: '#ff6b35', intensity: 0.5 },
    directional: { color: '#ffa502', intensity: 2.0, position: [8, 3, 2] },
    pointLights: [
      { color: '#ff4757', intensity: 0.8, position: [-5, 2, 5], distance: 20 },
    ],
  },
  {
    id: uuidv4(),
    name: '室内暖光',
    thumbnail: undefined,
    ambient: { color: '#ffbe76', intensity: 0.4 },
    directional: { color: '#f6e58d', intensity: 1.2, position: [2, 5, 2] },
    pointLights: [
      { color: '#ffcc80', intensity: 1.5, position: [3, 3, 3], distance: 15 },
      { color: '#ffab91', intensity: 1.0, position: [-3, 2, -2], distance: 12 },
    ],
  },
  {
    id: uuidv4(),
    name: '冷光',
    thumbnail: undefined,
    ambient: { color: '#74b9ff', intensity: 0.5 },
    directional: { color: '#0984e3', intensity: 1.8, position: [4, 7, 4] },
    pointLights: [
      { color: '#00cec9', intensity: 0.8, position: [-4, 3, -4], distance: 18 },
    ],
  },
  {
    id: uuidv4(),
    name: '聚光灯',
    thumbnail: undefined,
    ambient: { color: '#2d3436', intensity: 0.2 },
    directional: { color: '#ffffff', intensity: 0.5, position: [0, 10, 0] },
    pointLights: [
      { color: '#ffffff', intensity: 3.0, position: [0, 6, 0], distance: 10 },
    ],
  },
]

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 1, g: 1, b: 1 }
}

export function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(Math.max(0, Math.min(1, x)) * 255).toString(16)
        return hex.length === 1 ? '0' + hex : hex
      })
      .join('')
  )
}

export function lerpColor(
  color1: string,
  color2: string,
  t: number
): { r: number; g: number; b: number } {
  const c1 = hexToRgb(color1)
  const c2 = hexToRgb(color2)
  const clampedT = Math.max(0, Math.min(1, t))
  return {
    r: c1.r + (c2.r - c1.r) * clampedT,
    g: c1.g + (c2.g - c1.g) * clampedT,
    b: c1.b + (c2.b - c1.b) * clampedT,
  }
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}
