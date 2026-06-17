export interface HSL {
  h: number
  s: number
  l: number
}

export interface RGBA {
  r: number
  g: number
  b: number
  a: number
}

export function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  const toHex = (x: number) => {
    const hex = Math.round(255 * x).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`
}

export function hexToRgba(hex: string, alpha: number = 1): RGBA {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) {
    return { r: 0, g: 0, b: 0, a: alpha }
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
    a: alpha,
  }
}

export function rgbaToString(rgba: RGBA): string {
  return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`
}

export function parseColor(input: string): string | null {
  if (!input) return null

  if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(input)) {
    if (input.length === 4) {
      const r = input[1] + input[1]
      const g = input[2] + input[2]
      const b = input[3] + input[3]
      return `#${r}${g}${b}`.toUpperCase()
    }
    return input.toUpperCase()
  }

  const rgbMatch = /^rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i.exec(input)
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10)
    const g = parseInt(rgbMatch[2], 10)
    const b = parseInt(rgbMatch[3], 10)
    if (r <= 255 && g <= 255 && b <= 255) {
      const toHex = (x: number) => x.toString(16).padStart(2, '0')
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase()
    }
  }

  const s = new Option().style
  s.color = input
  if (s.color !== '') {
    return input
  }

  return null
}

export function generateRandomColor(): string {
  const hue = Math.floor(Math.random() * 360)
  const saturation = 60 + Math.floor(Math.random() * 30)
  const lightness = 45 + Math.floor(Math.random() * 20)
  return hslToHex(hue, saturation, lightness)
}

export function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

export function hexToHsl(hex: string): HSL {
  const rgba = hexToRgba(hex)
  return rgbToHsl(rgba.r, rgba.g, rgba.b)
}
