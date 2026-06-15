import chroma from 'chroma-js'

export interface WcagLevel {
  normal: boolean
  large: boolean
  graphics: boolean
}

export interface ContrastResult {
  ratio: number
  wcagLevel: {
    aa: WcagLevel
    aaa: WcagLevel
  }
}

export interface RecommendedColor {
  hex: string
  ratio: number
  level: string
}

interface CacheEntry {
  color: chroma.Color
  hex: string
}

const chromaCache = new Map<string, CacheEntry>()
const MAX_CACHE_SIZE = 64

function getCachedChroma(value: string): chroma.Color | null {
  const cached = chromaCache.get(value)
  if (cached) return cached.color

  try {
    const color = chroma(value)
    if (chromaCache.size >= MAX_CACHE_SIZE) {
      const firstKey = chromaCache.keys().next().value
      if (firstKey !== undefined) chromaCache.delete(firstKey)
    }
    chromaCache.set(value, { color, hex: color.hex() })
    return color
  } catch {
    return null
  }
}

export function clearChromaCache(): void {
  chromaCache.clear()
}

const RGBA_COMMA_REGEX = /^rgba?\s*\(\s*(-?\d{1,3})\s*,\s*(-?\d{1,3})\s*,\s*(-?\d{1,3})\s*(?:,\s*(-?\d*\.?\d+)\s*)?\)$/i
const RGBA_SPACE_REGEX = /^rgba?\s*\(\s*(-?\d{1,3})\s+(-?\d{1,3})\s+(-?\d{1,3})\s*(?:\/\s*(-?\d*\.?\d+)\s*)?\)$/i

function looksLikeRgba(value: string): boolean {
  const trimmed = value.trim().toLowerCase()
  return trimmed.startsWith('rgb(') || trimmed.startsWith('rgba(')
}

export function parseRgba(value: string): { r: number; g: number; b: number; a: number } | null {
  const trimmed = value.trim()

  let match = trimmed.match(RGBA_COMMA_REGEX)
  if (!match) {
    match = trimmed.match(RGBA_SPACE_REGEX)
  }
  if (!match) return null

  const r = Number(match[1])
  const g = Number(match[2])
  const b = Number(match[3])
  const a = match[4] !== undefined ? Number(match[4]) : 1

  if (!Number.isFinite(r) || r < 0 || r > 255) return null
  if (!Number.isFinite(g) || g < 0 || g > 255) return null
  if (!Number.isFinite(b) || b < 0 || b > 255) return null
  if (!Number.isFinite(a) || a < 0 || a > 1) return null

  return { r, g, b, a }
}

export function validateColorInput(value: string): { valid: boolean; error: string } {
  if (!value || value.trim() === '') {
    return { valid: true, error: '' }
  }

  const trimmed = value.trim()

  if (looksLikeRgba(trimmed)) {
    const rgbaParsed = parseRgba(trimmed)
    if (!rgbaParsed) {
      const match = trimmed.match(RGBA_COMMA_REGEX) || trimmed.match(RGBA_SPACE_REGEX)
      if (match) {
        const r = Number(match[1])
        const g = Number(match[2])
        const b = Number(match[3])
        const a = match[4] !== undefined ? Number(match[4]) : 1

        if (r < 0 || r > 255) return { valid: false, error: 'RGB值必须在0到255之间' }
        if (g < 0 || g > 255) return { valid: false, error: 'RGB值必须在0到255之间' }
        if (b < 0 || b > 255) return { valid: false, error: 'RGB值必须在0到255之间' }
        if (a < 0 || a > 1) return { valid: false, error: 'Alpha值必须在0到1之间' }
      }
      return { valid: false, error: '无效的rgba格式' }
    }
    return { valid: true, error: '' }
  }

  const hexRegex = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i
  if (hexRegex.test(trimmed)) {
    return { valid: true, error: '' }
  }

  const cached = getCachedChroma(trimmed)
  if (cached) {
    return { valid: true, error: '' }
  }

  return { valid: false, error: '无效的颜色值，请输入hex或rgba格式' }
}

export function isValidColor(value: string): boolean {
  return validateColorInput(value).valid
}

export function calculateContrastRatio(fg: string, bg: string): ContrastResult | null {
  const fgColor = getCachedChroma(fg)
  const bgColor = getCachedChroma(bg)
  if (!fgColor || !bgColor) return null

  const ratio = chroma.contrast(fgColor, bgColor)

  return {
    ratio,
    wcagLevel: {
      aa: {
        normal: ratio >= 4.5,
        large: ratio >= 3,
        graphics: ratio >= 3,
      },
      aaa: {
        normal: ratio >= 7,
        large: ratio >= 4.5,
        graphics: ratio >= 4.5,
      },
    },
  }
}

export function generateRecommendations(fg: string, bg: string, count: number = 3): RecommendedColor[] {
  const fgColor = getCachedChroma(fg)
  const bgColorRaw = getCachedChroma(bg)
  if (!fgColor || !bgColorRaw) return []
  const bgColor = bgColorRaw

  const fgHsl = fgColor.hsl()
  const bgLuminance = bgColor.luminance()
  const currentRatio = chroma.contrast(fgColor, bgColor)
  const targetRatio = 4.5
  const ratioGap = Math.max(targetRatio - currentRatio, 0)

  const recommendations: RecommendedColor[] = []
  const seenHex = new Set<string>()

  const h = isNaN(fgHsl[0]) ? 0 : fgHsl[0]
  const s = Math.max(0, Math.min(1, fgHsl[1]))
  const l = fgHsl[2] * 100

  const isLighterBetter = bgLuminance > 0.5
  const primaryDirection = isLighterBetter ? -1 : 1

  const hueShifts = [0, -5, 5, -10, 10]
  const satShifts = [0, -0.08, 0.08, -0.15, 0.15]

  function tryCandidate(ch: number, cs: number, cl: number): boolean {
    if (recommendations.length >= count) return true
    if (cl < 0 || cl > 100) return false
    cs = Math.max(0, Math.min(1, cs))

    try {
      const candidate = chroma.hsl(((ch % 360) + 360) % 360, cs, cl / 100)
      const candidateHex = candidate.hex()
      if (seenHex.has(candidateHex)) return false

      const ratio = chroma.contrast(candidate, bgColor)
      if (ratio >= targetRatio) {
        seenHex.add(candidateHex)
        recommendations.push({
          hex: candidateHex,
          ratio: Math.round(ratio * 100) / 100,
          level: ratio >= 7 ? 'AAA' : 'AA',
        })
        return recommendations.length >= count
      }
    } catch {
      // skip
    }
    return false
  }

  function tryLuminosityWithVariations(targetL: number): boolean {
    for (const dh of hueShifts) {
      for (const ds of satShifts) {
        if (tryCandidate(h + dh, s + ds, targetL)) {
          return true
        }
      }
    }
    return false
  }

  let lastL = l
  let lastRatio = currentRatio
  let iterations = 0
  const maxIterations = 12

  while (iterations < maxIterations && recommendations.length < count) {
    iterations++

    const remainingGap = Math.max(targetRatio - lastRatio, 0.01)
    const ratioStep = remainingGap * 0.6
    const stepL = (ratioStep / lastRatio) * 60 * primaryDirection

    let newL = lastL + stepL
    newL = Math.max(0, Math.min(100, newL))

    if (Math.abs(newL - lastL) < 0.5) {
      newL = lastL + primaryDirection * 2
      if (newL < 0 || newL > 100) break
    }

    tryLuminosityWithVariations(newL)

    let testRatio = lastRatio
    for (const dh of hueShifts) {
      for (const ds of satShifts) {
        try {
          const testHue = ((h + dh) % 360 + 360) % 360
          const testSat = Math.max(0, Math.min(1, s + ds))
          const c = chroma.hsl(testHue, testSat, newL / 100)
          const r = chroma.contrast(c, bgColor)
          if (r > testRatio) {
            testRatio = r
          }
        } catch {
          // skip
        }
      }
    }

    lastRatio = testRatio
    lastL = newL

    if (lastRatio >= targetRatio && recommendations.length > 0) {
      break
    }
  }

  if (recommendations.length < count) {
    const extraSteps = isLighterBetter ? [2, 5, 10, 20, 35] : [98, 95, 90, 80, 65]
    for (const stepL of extraSteps) {
      if (recommendations.length >= count) break
      tryLuminosityWithVariations(stepL)
    }
  }

  return recommendations
}

export function colorToHex(value: string): string {
  const rgbaParsed = parseRgba(value.trim())
  if (rgbaParsed) {
    try {
      return chroma(rgbaParsed.r, rgbaParsed.g, rgbaParsed.b, rgbaParsed.a).hex()
    } catch {
      return value
    }
  }

  const cached = chromaCache.get(value.trim())
  if (cached) return cached.hex

  try {
    const color = chroma(value)
    const hex = color.hex()
    chromaCache.set(value.trim(), { color, hex })
    return hex
  } catch {
    return value
  }
}

export function createDebounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout> | null = null
  return ((...args: any[]) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn(...args)
      timer = null
    }, delay)
  }) as T
}
