import { hsl, rgb } from 'd3-color'
import type { ColorData, HarmonyType, HarmonyScheme } from '../types'

const generateId = (): string => Math.random().toString(36).substr(2, 9)

const hexToColorData = (hex: string): ColorData => {
  const rgbColor = rgb(hex)
  const hslColor = hsl(hex)
  return {
    id: generateId(),
    hex: hex.toUpperCase(),
    rgb: {
      r: Math.round(rgbColor?.r ?? 0),
      g: Math.round(rgbColor?.g ?? 0),
      b: Math.round(rgbColor?.b ?? 0)
    },
    hsl: {
      h: Math.round(hslColor?.h ?? 0),
      s: Math.round((hslColor?.s ?? 0) * 100),
      l: Math.round((hslColor?.l ?? 0) * 100)
    }
  }
}

const hslToHex = (h: number, s: number, l: number): string => {
  const color = hsl(h, s / 100, l / 100)
  return color.hex().toUpperCase()
}

const generateHarmonyColors = (
  baseHsl: { h: number; s: number; l: number },
  type: HarmonyType
): ColorData[] => {
  const { h, s, l } = baseHsl
  const colors: ColorData[] = []

  switch (type) {
    case 'complementary':
      colors.push(hexToColorData(hslToHex(h, s, l)))
      colors.push(hexToColorData(hslToHex((h + 180) % 360, s, l)))
      colors.push(hexToColorData(hslToHex(h, s, Math.max(l - 15, 10))))
      colors.push(hexToColorData(hslToHex((h + 180) % 360, s, Math.min(l + 15, 90))))
      colors.push(hexToColorData(hslToHex(h, Math.max(s - 20, 20), l)))
      break

    case 'analogous':
      colors.push(hexToColorData(hslToHex(h, s, l)))
      colors.push(hexToColorData(hslToHex((h + 30) % 360, s, l)))
      colors.push(hexToColorData(hslToHex((h + 60) % 360, s, l)))
      colors.push(hexToColorData(hslToHex((h - 30 + 360) % 360, s, l)))
      colors.push(hexToColorData(hslToHex((h - 60 + 360) % 360, s, l)))
      break

    case 'triadic':
      colors.push(hexToColorData(hslToHex(h, s, l)))
      colors.push(hexToColorData(hslToHex((h + 120) % 360, s, l)))
      colors.push(hexToColorData(hslToHex((h + 240) % 360, s, l)))
      colors.push(hexToColorData(hslToHex(h, s, Math.min(l + 20, 90))))
      colors.push(hexToColorData(hslToHex((h + 120) % 360, s, Math.max(l - 20, 10))))
      break

    case 'splitComplementary':
      colors.push(hexToColorData(hslToHex(h, s, l)))
      colors.push(hexToColorData(hslToHex((h + 150) % 360, s, l)))
      colors.push(hexToColorData(hslToHex((h + 210) % 360, s, l)))
      colors.push(hexToColorData(hslToHex(h, s, Math.min(l + 15, 90))))
      colors.push(hexToColorData(hslToHex((h + 150) % 360, s, Math.max(l - 15, 10))))
      break

    case 'tetradic':
      colors.push(hexToColorData(hslToHex(h, s, l)))
      colors.push(hexToColorData(hslToHex((h + 90) % 360, s, l)))
      colors.push(hexToColorData(hslToHex((h + 180) % 360, s, l)))
      colors.push(hexToColorData(hslToHex((h + 270) % 360, s, l)))
      colors.push(hexToColorData(hslToHex(h, Math.max(s - 30, 20), l)))
      break
  }

  return colors
}

export const generateAllHarmonySchemes = (baseColor: ColorData): HarmonyScheme[] => {
  const baseHsl = baseColor.hsl
  const schemes: { name: string; type: HarmonyType }[] = [
    { name: '互补色', type: 'complementary' },
    { name: '类似色', type: 'analogous' },
    { name: '三角色', type: 'triadic' },
    { name: '分裂互补', type: 'splitComplementary' },
    { name: '四角色', type: 'tetradic' }
  ]

  return schemes.map((s) => ({
    name: s.name,
    type: s.type,
    colors: generateHarmonyColors(baseHsl, s.type)
  }))
}

export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null
}

export const rgbToHex = (r: number, g: number, b: number): string => {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16)
        return hex.length === 1 ? '0' + hex : hex
      })
      .join('')
      .toUpperCase()
  )
}

export const isValidHex = (hex: string): boolean => {
  return /^#?([a-f\d]{3}|[a-f\d]{6})$/i.test(hex)
}

export { hexToColorData, generateId }
