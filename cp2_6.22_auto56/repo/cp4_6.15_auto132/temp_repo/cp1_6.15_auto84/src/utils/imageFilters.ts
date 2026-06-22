export function calculateLightingFilter(angle: number, intensity: number): string {
  const brightness = 0.5 + (intensity / 100) * 1.0
  const radians = (angle * Math.PI) / 180
  const contrast = 1.0 + Math.abs(Math.sin(radians)) * 0.4 + Math.abs(Math.cos(radians)) * 0.4
  return `brightness(${brightness.toFixed(3)}) contrast(${contrast.toFixed(3)})`
}

export interface ImageItem {
  id: string
  url: string
  name: string
}

export interface LightingParams {
  angle: number
  intensity: number
}
