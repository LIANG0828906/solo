export type DyeColor = 'red' | 'blue' | 'yellow' | null
export type Mordant = 'alum' | 'greenVitriol' | 'blueVitriol' | null

export interface ColorResult {
  hex: string
  name: string
  hsl: { h: number; s: number; l: number }
}

const BASE_COLORS: Record<string, { wet: string; dry: string; name: string }> = {
  red: { wet: '#6b2a1d', dry: '#c43a31', name: '茜草红' },
  blue: { wet: '#1a3a5c', dry: '#2d6a9f', name: '蓼蓝蓝' },
  yellow: { wet: '#a67c1a', dry: '#e6b422', name: '栀子黄' },
}

const MORDANT_EFFECTS: Record<string, Record<string, { shift: { h: number; s: number; l: number }; name: string }>> = {
  red: {
    alum: { shift: { h: -5, s: 5, l: 8 }, name: '樱红' },
    greenVitriol: { shift: { h: 35, s: -15, l: -12 }, name: '紫褐' },
    blueVitriol: { shift: { h: 25, s: -5, l: -5 }, name: '绛紫' },
  },
  blue: {
    alum: { shift: { h: 3, s: 8, l: 5 }, name: '天蓝' },
    greenVitriol: { shift: { h: -8, s: 10, l: -8 }, name: '苍蓝' },
    blueVitriol: { shift: { h: -15, s: 15, l: -15 }, name: '靛青' },
  },
  yellow: {
    alum: { shift: { h: 5, s: 10, l: 8 }, name: '鹅黄' },
    greenVitriol: { shift: { h: 40, s: 5, l: -5 }, name: '秋香' },
    blueVitriol: { shift: { h: 60, s: 15, l: -10 }, name: '橄榄' },
  },
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
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

function hslToHex(h: number, s: number, l: number): string {
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

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

export function lerpHsl(
  from: { h: number; s: number; l: number },
  to: { h: number; s: number; l: number },
  t: number
): { h: number; s: number; l: number } {
  const tClamped = Math.max(0, Math.min(1, t))
  return {
    h: from.h + (to.h - from.h) * tClamped,
    s: from.s + (to.s - from.s) * tClamped,
    l: from.l + (to.l - from.l) * tClamped,
  }
}

export function calculateDyeColor(
  baseColor: DyeColor,
  oxidationProgress: number,
  mordant: Mordant,
  mordantProgress: number
): ColorResult {
  if (!baseColor) {
    return {
      hex: '#ffffff',
      name: '素白',
      hsl: { h: 0, s: 0, l: 100 },
    }
  }

  const base = BASE_COLORS[baseColor]
  const wetHsl = hexToHsl(base.wet)
  const dryHsl = hexToHsl(base.dry)

  const oxidizedHsl = lerpHsl(wetHsl, dryHsl, oxidationProgress)

  let finalHsl = oxidizedHsl
  let colorName = base.name

  if (mordant && mordantProgress > 0) {
    const effect = MORDANT_EFFECTS[baseColor][mordant]
    const targetHsl = {
      h: (dryHsl.h + effect.shift.h + 360) % 360,
      s: Math.max(0, Math.min(100, dryHsl.s + effect.shift.s)),
      l: Math.max(0, Math.min(100, dryHsl.l + effect.shift.l)),
    }
    finalHsl = lerpHsl(oxidizedHsl, targetHsl, mordantProgress)
    colorName = `${base.name}${getMordantName(mordant)}${effect.name}`
  }

  return {
    hex: hslToHex(finalHsl.h, finalHsl.s, finalHsl.l),
    name: colorName,
    hsl: finalHsl,
  }
}

export function getMordantName(mordant: Mordant): string {
  const names: Record<string, string> = {
    alum: '明矾',
    greenVitriol: '绿矾',
    blueVitriol: '蓝矾',
  }
  return mordant ? names[mordant] || '' : ''
}

export function getDyeSpeedMultiplier(temperature: number): number {
  const baseTemp = 20
  const increasePer10Deg = 0.15
  const tempDiff = temperature - baseTemp
  return 1 + Math.floor(tempDiff / 10) * increasePer10Deg
}

export const MORDANT_COLORS: Record<string, string> = {
  alum: 'rgba(255, 255, 255, 0.6)',
  greenVitriol: 'rgba(122, 207, 138, 0.6)',
  blueVitriol: 'rgba(106, 158, 207, 0.6)',
}

export const DYE_COLORS: Record<string, string> = {
  red: '#c43a31',
  blue: '#2d6a9f',
  yellow: '#e6b422',
}
