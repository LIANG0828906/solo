export interface HSL {
  h: number
  s: number
  l: number
}

export interface HSV {
  h: number
  s: number
  v: number
}

export interface RGB {
  r: number
  g: number
  b: number
}

export interface ColorShades {
  50: string
  100: string
  200: string
  300: string
  400: string
  500: string
  600: string
  700: string
  800: string
  900: string
}

export type SchemeType = 'analogous' | 'complementary' | 'triadic' | 'monochromatic' | 'adjacent'

export interface SchemeColor {
  base: string
  hsl: HSL
  shades: ColorShades
}

export interface HistoryItem {
  id: string
  name: string
  timestamp: number
  primaryColor: string
  schemeType: SchemeType
  schemeColors: SchemeColor[]
}

const SHADE_LIGHTNESS = {
  50: 0.97,
  100: 0.93,
  200: 0.86,
  300: 0.78,
  400: 0.65,
  500: 0.5,
  600: 0.39,
  700: 0.29,
  800: 0.2,
  900: 0.13,
}

const SHADE_SATURATION_ADJUST = {
  50: 0.2,
  100: 0.4,
  200: 0.6,
  300: 0.8,
  400: 0.95,
  500: 1,
  600: 1,
  700: 0.95,
  800: 0.9,
  900: 0.85,
}

export function hslToHex(h: number, s: number, l: number): string {
  const { r, g, b } = hslToRgb(h, s, l)
  return rgbToHex(r, g, b)
}

export function hslToRgb(h: number, s: number, l: number): RGB {
  h = h / 360
  s = s / 100
  l = l / 100

  let r, g, b

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  }
}

export function rgbToHsl(r: number, g: number, b: number): HSL {
  r = r / 255
  g = g / 255
  b = b / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

export function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 }
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

export function hexToHsl(hex: string): HSL {
  const { r, g, b } = hexToRgb(hex)
  return rgbToHsl(r, g, b)
}

export function generateShades(hex: string): ColorShades {
  const hsl = hexToHsl(hex)
  const shades: Partial<ColorShades> = {}

  const keys = Object.keys(SHADE_LIGHTNESS) as unknown as Array<keyof ColorShades>
  for (const key of keys) {
    const targetLightness = SHADE_LIGHTNESS[key] * 100
    const satAdjust = SHADE_SATURATION_ADJUST[key]
    const adjustedSat = hsl.s * satAdjust
    shades[key] = hslToHex(hsl.h, adjustedSat, targetLightness)
  }

  return shades as ColorShades
}

export function generateSchemeColors(baseHex: string, type: SchemeType): SchemeColor[] {
  const baseHsl = hexToHsl(baseHex)
  const offsets: number[] = []

  switch (type) {
    case 'analogous':
      offsets.push(-30, -15, 0, 15, 30)
      break
    case 'complementary':
      offsets.push(-30, -15, 0, 15, 180)
      break
    case 'triadic':
      offsets.push(-120, -60, 0, 60, 120)
      break
    case 'monochromatic':
      offsets.push(0, 0, 0, 0, 0)
      break
    case 'adjacent':
      offsets.push(-20, -10, 0, 10, 20)
      break
  }

  return offsets.map((offset, i) => {
    let h = (baseHsl.h + offset + 360) % 360
    let s = baseHsl.s
    let l = baseHsl.l

    if (type === 'monochromatic') {
      l = [85, 65, 50, 35, 20][i]
      s = Math.min(100, baseHsl.s + (i - 2) * 5)
    }

    const hex = hslToHex(h, s, l)
    return {
      base: hex,
      hsl: { h, s, l },
      shades: generateShades(hex),
    }
  })
}

export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)
  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b)
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b)

  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)

  return (lighter + 0.05) / (darker + 0.05)
}

export function getWCAGRating(ratio: number): { level: 'AAA' | 'AA' | 'Fail'; text: string } {
  if (ratio >= 7) return { level: 'AAA', text: 'AAA' }
  if (ratio >= 4.5) return { level: 'AA', text: 'AA' }
  return { level: 'Fail', text: '失败' }
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${month}-${day} ${hours}:${minutes}`
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

export function hsvToHsl(h: number, s: number, v: number): HSL {
  s = s / 100
  v = v / 100

  const l = v * (1 - s / 2)
  let sat = 0

  if (l !== 0 && l !== 1) {
    sat = (v - l) / Math.min(l, 1 - l)
  }

  return {
    h: Math.round(h),
    s: Math.round(sat * 100),
    l: Math.round(l * 100),
  }
}

export function hslToHsv(h: number, s: number, l: number): HSV {
  s = s / 100
  l = l / 100

  const v = l + s * Math.min(l, 1 - l)
  let sat = 0

  if (v !== 0) {
    sat = 2 * (1 - l / v)
  }

  return {
    h: Math.round(h),
    s: Math.round(sat * 100),
    v: Math.round(v * 100),
  }
}
