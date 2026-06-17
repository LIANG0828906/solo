import chroma from 'chroma-js'
import type { SchemeType, ColorScheme } from '@/store/useColorStore'

export function generateColorScheme(hue: number, saturation: number, lightness: number, type: SchemeType): ColorScheme {
  const primary = chroma.hsl(hue, saturation / 100, lightness / 100).hex()
  let secondaryHues: number[]

  switch (type) {
    case 'triadic':
      secondaryHues = [(hue + 120) % 360, (hue + 240) % 360]
      break
    case 'complementary':
      secondaryHues = [(hue + 180) % 360]
      break
    case 'analogous':
      secondaryHues = [(hue + 30) % 360, (hue + 330) % 360]
      break
    case 'splitComplementary':
      secondaryHues = [(hue + 150) % 360, (hue + 210) % 360]
      break
    default:
      secondaryHues = [(hue + 120) % 360, (hue + 240) % 360]
  }

  const secondary = secondaryHues.map(h => chroma.hsl(h, saturation / 100, lightness / 100).hex())

  return { primary, secondary, type }
}

export function getSecondaryHues(hue: number, type: SchemeType): number[] {
  switch (type) {
    case 'triadic':
      return [(hue + 120) % 360, (hue + 240) % 360]
    case 'complementary':
      return [(hue + 180) % 360]
    case 'analogous':
      return [(hue + 30) % 360, (hue + 330) % 360]
    case 'splitComplementary':
      return [(hue + 150) % 360, (hue + 210) % 360]
    default:
      return [(hue + 120) % 360, (hue + 240) % 360]
  }
}

export function getDarkVariant(hex: string): string {
  return chroma(hex).darken(2.5).hex()
}

export function getLightVariant(): string {
  return '#F9F9FB'
}
