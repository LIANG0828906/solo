import { PRESET_CONFIGS, VisualizerPreset } from '@/types'

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

export function lerpColor(
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number },
  t: number
): { r: number; g: number; b: number } {
  return {
    r: color1.r + (color2.r - color1.r) * t,
    g: color1.g + (color2.g - color1.g) * t,
    b: color1.b + (color2.b - color1.b) * t,
  }
}

export function getColorFromFrequency(
  frequencyValue: number,
  frequencyIndex: number,
  totalFrequencies: number,
  preset: VisualizerPreset,
  sensitivity: number
): { r: number; g: number; b: number } {
  const config = PRESET_CONFIGS[preset]
  const normalizedIndex = frequencyIndex / totalFrequencies
  const normalizedValue = (frequencyValue / 255) * sensitivity

  const lowColor = hexToRgb(config.colorMapping.low)
  const midColor = hexToRgb(config.colorMapping.mid)
  const highColor = hexToRgb(config.colorMapping.high)

  let baseColor
  if (normalizedIndex < 0.33) {
    const t = normalizedIndex / 0.33
    baseColor = lerpColor(lowColor, midColor, t)
  } else if (normalizedIndex < 0.66) {
    const t = (normalizedIndex - 0.33) / 0.33
    baseColor = lerpColor(midColor, highColor, t)
  } else {
    const t = (normalizedIndex - 0.66) / 0.34
    baseColor = lerpColor(highColor, { r: 0.8, g: 0.6, b: 1 }, t)
  }

  const intensity = 0.3 + normalizedValue * 0.7
  return {
    r: Math.min(1, baseColor.r * intensity),
    g: Math.min(1, baseColor.g * intensity),
    b: Math.min(1, baseColor.b * intensity),
  }
}

export function getFrequencyBand(
  frequencyIndex: number,
  totalFrequencies: number
): 'low' | 'mid' | 'high' {
  const normalizedIndex = frequencyIndex / totalFrequencies
  if (normalizedIndex < 0.33) return 'low'
  if (normalizedIndex < 0.66) return 'mid'
  return 'high'
}
