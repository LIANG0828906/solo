import type { ThemeType, ThemeConfig, FrequencyBands } from '@/types'

export const themeConfigs: Record<ThemeType, ThemeConfig> = {
  neon: {
    name: '霓虹',
    backgroundColor: '#0A0A1A',
    colorRange: {
      low: [270, 300],
      mid: [200, 270],
      high: [300, 330],
    },
    glowEffect: true,
    trailEffect: false,
    dotColor: '#8B5CF6',
    sizeRange: [0.5, 3.0],
  },
  aurora: {
    name: '极光',
    backgroundColor: '#001F3F',
    colorRange: {
      low: [160, 180],
      mid: [180, 220],
      high: [120, 160],
    },
    glowEffect: false,
    trailEffect: true,
    dotColor: '#06B6D4',
    sizeRange: [0.3, 2.5],
  },
  lava: {
    name: '熔岩',
    backgroundColor: '#1A0500',
    colorRange: {
      low: [0, 30],
      mid: [30, 60],
      high: [60, 90],
    },
    glowEffect: true,
    trailEffect: false,
    dotColor: '#F97316',
    sizeRange: [0.7, 3.5],
  },
}

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0,
    g = 0,
    b = 0

  if (h >= 0 && h < 60) {
    r = c
    g = x
    b = 0
  } else if (h >= 60 && h < 120) {
    r = x
    g = c
    b = 0
  } else if (h >= 120 && h < 180) {
    r = 0
    g = c
    b = x
  } else if (h >= 180 && h < 240) {
    r = 0
    g = x
    b = c
  } else if (h >= 240 && h < 300) {
    r = x
    g = 0
    b = c
  } else if (h >= 300 && h < 360) {
    r = c
    g = 0
    b = x
  }

  return [Math.round((r + m) * 255) / 255, Math.round((g + m) * 255) / 255, Math.round((b + m) * 255) / 255]
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function getHueFromFrequency(
  bands: FrequencyBands,
  colorRange: ThemeConfig['colorRange'],
  saturation: number,
): number {
  const totalEnergy = bands.low + bands.mid + bands.high
  if (totalEnergy === 0) return 0

  const lowWeight = bands.low / totalEnergy
  const midWeight = bands.mid / totalEnergy
  const highWeight = bands.high / totalEnergy

  const lowHue = lerp(colorRange.low[0], colorRange.low[1], bands.low)
  const midHue = lerp(colorRange.mid[0], colorRange.mid[1], bands.mid)
  const highHue = lerp(colorRange.high[0], colorRange.high[1], bands.high)

  let hue = lowHue * lowWeight + midHue * midWeight + highHue * highWeight
  hue = hue % 360
  if (hue < 0) hue += 360

  return hue
}

export function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255,
      ]
    : [0, 0, 0]
}

export function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(x * 255).toString(16)
        return hex.length === 1 ? '0' + hex : hex
      })
      .join('')
  )
}
