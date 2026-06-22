import { ColorCurve } from '../store'

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '')
  const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16)
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  }
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

export function applyCurve(t: number, curve: ColorCurve): number {
  if (t <= 0) return 0
  if (t >= 1) return 1
  switch (curve) {
    case 'sin':
      return Math.sin(t * Math.PI / 2)
    case 'exp':
      return t * t
    case 'linear':
    default:
      return t
  }
}

export function interpolateColor(
  startHex: string,
  endHex: string,
  t: number,
  curve: ColorCurve = 'linear',
): { r: number; g: number; b: number } {
  const start = hexToRgb(startHex)
  const end = hexToRgb(endHex)
  const ct = applyCurve(t, curve)
  return {
    r: start.r + (end.r - start.r) * ct,
    g: start.g + (end.g - start.g) * ct,
    b: start.b + (end.b - start.b) * ct,
  }
}
