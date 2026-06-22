import type { HSL, RGB, SchemeType } from '../types'

export function hslToRgb(hsl: HSL): RGB {
  const { h, s, l } = hsl
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0, g = 0, b = 0

  if (h >= 0 && h < 60) { r = c; g = x; b = 0 }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0 }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c }
  else if (h >= 300 && h < 360) { r = c; g = 0; b = x }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  }
}

export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }

  return { h: Math.round(h * 360), s: Number(s.toFixed(2)), l: Number(l.toFixed(2)) }
}

export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => n.toString(16).padStart(2, '0')
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase()
}

export function hexToRgb(hex: string): RGB | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

export function hslToHex(hsl: HSL): string {
  return rgbToHex(hslToRgb(hsl))
}

export function hexToHsl(hex: string): HSL | null {
  const rgb = hexToRgb(hex)
  return rgb ? rgbToHsl(rgb) : null
}

export function formatHex(hsl: HSL): string {
  return hslToHex(hsl)
}

export function formatRgb(hsl: HSL): string {
  const rgb = hslToRgb(hsl)
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
}

export function formatHsl(hsl: HSL): string {
  return `hsl(${hsl.h}, ${Math.round(hsl.s * 100)}%, ${Math.round(hsl.l * 100)}%)`
}

export function generateScheme(baseHsl: HSL, type: SchemeType): HSL[] {
  const { h, s, l } = baseHsl
  const colors: HSL[] = []

  switch (type) {
    case 'monochromatic':
      colors.push({ h, s: Math.max(s * 0.3, 0.1), l: Math.min(l * 1.3, 0.95) })
      colors.push({ h, s: Math.max(s * 0.6, 0.2), l: Math.min(l * 1.15, 0.9) })
      colors.push({ h, s, l })
      colors.push({ h, s: Math.min(s * 1.1, 1), l: Math.max(l * 0.85, 0.1) })
      colors.push({ h, s: Math.min(s * 1.2, 1), l: Math.max(l * 0.7, 0.05) })
      break

    case 'complementary':
      colors.push({ h, s, l })
      colors.push({ h: (h + 15) % 360, s: s * 0.8, l: Math.min(l * 1.2, 0.9) })
      colors.push({ h: (h + 180) % 360, s, l })
      colors.push({ h: (h + 195) % 360, s: s * 0.8, l: Math.min(l * 1.2, 0.9) })
      colors.push({ h: (h + 180) % 360, s: s * 0.6, l: Math.max(l * 0.7, 0.1) })
      break

    case 'split-complementary':
      colors.push({ h, s, l })
      colors.push({ h: (h + 30) % 360, s: s * 0.7, l: Math.min(l * 1.15, 0.9) })
      colors.push({ h: (h + 150) % 360, s: s * 0.9, l: Math.max(l * 0.8, 0.15) })
      colors.push({ h: (h + 210) % 360, s: s * 0.9, l: Math.max(l * 0.8, 0.15) })
      colors.push({ h: (h + 330) % 360, s: s * 0.7, l: Math.min(l * 1.15, 0.9) })
      break

    case 'analogous':
      colors.push({ h: (h - 60 + 360) % 360, s: s * 0.8, l: Math.min(l * 1.1, 0.9) })
      colors.push({ h: (h - 30 + 360) % 360, s: s * 0.9, l })
      colors.push({ h, s, l })
      colors.push({ h: (h + 30) % 360, s: s * 0.9, l })
      colors.push({ h: (h + 60) % 360, s: s * 0.8, l: Math.min(l * 1.1, 0.9) })
      break

    case 'triadic':
      colors.push({ h, s, l })
      colors.push({ h: (h + 120) % 360, s, l })
      colors.push({ h: (h + 240) % 360, s, l })
      colors.push({ h: (h + 60) % 360, s: s * 0.7, l: Math.min(l * 1.2, 0.9) })
      colors.push({ h: (h + 180) % 360, s: s * 0.7, l: Math.min(l * 1.2, 0.9) })
      break
  }

  return colors
}

export function generateAllSchemes(baseHsl: HSL): { type: SchemeType; name: string; colors: string[] }[] {
  const schemeTypes: { type: SchemeType; name: string }[] = [
    { type: 'monochromatic', name: '单色' },
    { type: 'complementary', name: '互补' },
    { type: 'split-complementary', name: '分裂互补' },
    { type: 'analogous', name: '类似' },
    { type: 'triadic', name: '三色' }
  ]

  return schemeTypes.map(({ type, name }) => ({
    type,
    name,
    colors: generateScheme(baseHsl, type).map(hsl => hslToHex(hsl))
  }))
}

export function getContrastColor(hex: string): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return '#ffffff'
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
  return luminance > 0.5 ? '#000000' : '#ffffff'
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
}
