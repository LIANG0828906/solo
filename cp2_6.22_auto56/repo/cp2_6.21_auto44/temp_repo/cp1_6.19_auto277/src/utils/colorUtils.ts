export const BUBBLE_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD'
] as const

export function getRandomColor(): string {
  return BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)]
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return { r: 0, g: 0, b: 0 }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  }
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

export function mixColors(color1: string, color2: string, ratio: number = 0.5): string {
  const c1 = hexToRgb(color1)
  const c2 = hexToRgb(color2)
  const r = c1.r * ratio + c2.r * (1 - ratio)
  const g = c1.g * ratio + c2.g * (1 - ratio)
  const b = c1.b * ratio + c2.b * (1 - ratio)
  return rgbToHex(r, g, b)
}

export function adjustBrightness(hex: string, percent: number): string {
  const { r, g, b } = hexToRgb(hex)
  const factor = 1 + percent / 100
  return rgbToHex(
    Math.max(0, Math.min(255, r * factor)),
    Math.max(0, Math.min(255, g * factor)),
    Math.max(0, Math.min(255, b * factor))
  )
}
