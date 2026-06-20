export interface RGB { r: number; g: number; b: number }
export interface HSL { h: number; s: number; l: number }
export interface LAB { l: number; a: number; b: number }
export interface XYZ { x: number; y: number; z: number }

export type ColorFormat = 'hex' | 'rgb' | 'hsl'

export const hexToRgb = (hex: string): RGB => {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  if (h.length !== 6) return { r: 0, g: 0, b: 0 }
  const num = parseInt(h, 16)
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 }
}

export const rgbToHex = (rgb: RGB): string => {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`
}

export const rgbToHsl = (rgb: RGB): HSL => {
  const r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
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
  return { h: h * 360, s: s * 100, l: l * 100 }
}

export const hslToRgb = (hsl: HSL): RGB => {
  const h = hsl.h / 360, s = hsl.s / 100, l = hsl.l / 100
  if (s === 0) { const v = l * 255; return { r: v, g: v, b: v } }
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
  return {
    r: hue2rgb(p, q, h + 1 / 3) * 255,
    g: hue2rgb(p, q, h) * 255,
    b: hue2rgb(p, q, h - 1 / 3) * 255
  }
}

export const rgbToLab = (rgb: RGB): LAB => {
  let r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255
  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92
  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047
  const y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883
  const f = (t: number) => t > 0.008856 ? Math.pow(t, 1 / 3) : (7.787 * t + 16 / 116)
  return { l: 116 * f(y) - 16, a: 500 * (f(x) - f(y)), b: 200 * (f(y) - f(z)) }
}

export const deltaE94 = (lab1: LAB, lab2: LAB, application: 'graphic' | 'textiles' = 'graphic'): number => {
  const params = application === 'graphic'
    ? { kL: 1, k1: 0.045, k2: 0.015 }
    : { kL: 2, k1: 0.048, k2: 0.014 }
  const { kL, k1, k2 } = params
  const dL = lab1.l - lab2.l
  const C1 = Math.sqrt(lab1.a ** 2 + lab1.b ** 2)
  const C2 = Math.sqrt(lab2.a ** 2 + lab2.b ** 2)
  const dC = C1 - C2
  const da = lab1.a - lab2.a
  const db = lab1.b - lab2.b
  let dH2 = da ** 2 + db ** 2 - dC ** 2
  if (dH2 < 0) dH2 = 0
  const dH = Math.sqrt(dH2)
  const sL = 1
  const sC = 1 + k1 * C1
  const sH = 1 + k2 * C1
  const vL = dL / (kL * sL)
  const vC = dC / sC
  const vH = dH / sH
  return Math.sqrt(vL ** 2 + vC ** 2 + vH ** 2)
}

export const colorDifference = (hex1: string, hex2: string): number => {
  return deltaE94(rgbToLab(hexToRgb(hex1)), rgbToLab(hexToRgb(hex2)))
}

export const generateHarmoniousColors = (baseHex: string, mode: 'complementary' | 'analogous' | 'triadic' | 'split' | 'tetradic' = 'analogous'): string[] => {
  const hsl = rgbToHsl(hexToRgb(baseHex))
  const h = hsl.h, s = hsl.s, l = hsl.l
  const make = (hOffset: number, sMul = 1, lOffset = 0) => {
    const newH = ((h + hOffset) % 360 + 360) % 360
    const newS = Math.max(10, Math.min(100, s * sMul))
    const newL = Math.max(10, Math.min(90, l + lOffset))
    return rgbToHex(hslToRgb({ h: newH, s: newS, l: newL }))
  }
  switch (mode) {
    case 'complementary':
      return [baseHex, make(180, 0.9, 0), make(180, 0.7, 15), make(0, 0.7, -15)]
    case 'analogous':
      return [baseHex, make(-30, 1, 5), make(30, 1, 5), make(-15, 0.8, -10), make(15, 0.8, 10)]
    case 'triadic':
      return [baseHex, make(120, 1, 0), make(240, 1, 0), make(120, 0.8, 15), make(240, 0.8, -15)]
    case 'split':
      return [baseHex, make(150, 1, 0), make(210, 1, 0), make(150, 0.7, 15), make(210, 0.7, -15)]
    case 'tetradic':
      return [baseHex, make(90, 1, 0), make(180, 1, 0), make(270, 1, 0)]
  }
}

export const lighten = (hex: string, amount: number): string => {
  const hsl = rgbToHsl(hexToRgb(hex))
  return rgbToHex(hslToRgb({ ...hsl, l: Math.min(100, hsl.l + amount) }))
}

export const darken = (hex: string, amount: number): string => {
  const hsl = rgbToHsl(hexToRgb(hex))
  return rgbToHex(hslToRgb({ ...hsl, l: Math.max(0, hsl.l - amount) }))
}

export const saturate = (hex: string, amount: number): string => {
  const hsl = rgbToHsl(hexToRgb(hex))
  return rgbToHex(hslToRgb({ ...hsl, s: Math.min(100, hsl.s + amount) }))
}

export const getContrastColor = (hex: string): string => {
  const rgb = hexToRgb(hex)
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
  return luminance > 0.5 ? '#000000' : '#ffffff'
}

export const isValidHex = (hex: string): boolean => {
  return /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex)
}

export const normalizeHex = (hex: string): string => {
  if (!hex.startsWith('#')) hex = '#' + hex
  if (hex.length === 4) {
    hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3]
  }
  return hex.toUpperCase()
}
