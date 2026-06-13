import type { HSL, RGB, ColorItem } from './ColorItem'

export function hslToRgb(h: number, s: number, l: number): RGB {
  const hue = ((h % 360) + 360) % 360
  const sat = Math.max(0, Math.min(100, s)) / 100
  const light = Math.max(0, Math.min(100, l)) / 100

  const c = (1 - Math.abs(2 * light - 1)) * sat
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1))
  const m = light - c / 2

  let r1 = 0, g1 = 0, b1 = 0
  if (hue < 60)       { r1 = c; g1 = x; b1 = 0 }
  else if (hue < 120) { r1 = x; g1 = c; b1 = 0 }
  else if (hue < 180) { r1 = 0; g1 = c; b1 = x }
  else if (hue < 240) { r1 = 0; g1 = x; b1 = c }
  else if (hue < 300) { r1 = x; g1 = 0; b1 = c }
  else                { r1 = c; g1 = 0; b1 = x }

  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  }
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(v)))
    const str = clamped.toString(16).toUpperCase()
    return str.length === 1 ? '0' + str : str
  }
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function clampHSL(h: number, s: number, l: number): HSL {
  return {
    h: ((h % 360) + 360) % 360,
    s: Math.max(0, Math.min(100, s)),
    l: Math.max(0, Math.min(100, l)),
  }
}

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

export function createDeviatedColor(
  base: HSL,
  deviationRange: [number, number],
  dim: 'hue' | 'sat' | 'random' = 'random',
): HSL {
  const magnitude = randomInRange(deviationRange[0], deviationRange[1])
  const direction = Math.random() < 0.5 ? -1 : 1
  const deviation = magnitude * direction

  const actualDim = dim === 'random'
    ? (Math.random() < 0.7 ? 'hue' : 'sat')
    : dim

  if (actualDim === 'hue') {
    return clampHSL(base.h + deviation, base.s, base.l)
  } else {
    return clampHSL(base.h, base.s + deviation, base.l)
  }
}

export function isSameColor(a: ColorItem, b: ColorItem): boolean {
  return a.hex.toUpperCase() === b.hex.toUpperCase()
}

export function colorDistance(a: HSL, b: HSL): number {
  const dh = Math.min(Math.abs(a.h - b.h), 360 - Math.abs(a.h - b.h))
  const ds = a.s - b.s
  const dl = a.l - b.l
  return Math.sqrt(dh * dh + ds * ds + dl * dl)
}

export function generateRandomTargetHSL(): HSL {
  return {
    h: Math.floor(Math.random() * 361),
    s: Math.floor(randomInRange(50, 101)),
    l: Math.floor(randomInRange(40, 91)),
  }
}

export function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
