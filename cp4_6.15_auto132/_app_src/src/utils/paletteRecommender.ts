import { colorDifference, generateHarmoniousColors, rgbToHsl, hexToRgb, rgbToHex, hslToRgb, lighten, darken, saturate } from './colorUtils'

export interface Palette {
  id: string
  name: string
  primary: string
  secondary: string
  accent: string
}

export interface GradientStop {
  color: string
  position: number
}

const memo = new Map<string, any>()
const memoKey = (...parts: any[]) => parts.join('|')

const getColorHue = (hex: string): number => {
  return rgbToHsl(hexToRgb(hex)).h
}

const getColorWeight = (stop: GradientStop): number => {
  return stop.position / 100 * (rgbToHsl(hexToRgb(stop.color)).s / 100 + 0.5)
}

const extractDominantColors = (stops: GradientStop[]): string[] => {
  if (stops.length === 0) return ['#6366f1', '#ec4899']
  const key = memoKey('dominant', stops.map(s => s.color + s.position).join(','))
  if (memo.has(key)) return memo.get(key)
  const sorted = [...stops].sort((a, b) => getColorWeight(b) - getColorWeight(a))
  const uniqueColors: string[] = []
  for (const s of sorted) {
    const c = s.color.toUpperCase()
    if (!uniqueColors.some(uc => colorDifference(uc, c) < 8)) {
      uniqueColors.push(c)
      if (uniqueColors.length >= 4) break
    }
  }
  const result = uniqueColors.length >= 2 ? uniqueColors : [...uniqueColors, ...stops.filter(s => !uniqueColors.includes(s.color.toUpperCase())).map(s => s.color)]
  memo.set(key, result)
  return result.slice(0, 4)
}

const generateComplementary = (stops: GradientStop[]): Palette => {
  const dom = extractDominantColors(stops)
  const primary = dom[0]
  const modes = ['complementary' as const, 'split' as const]
  const mode = modes[Math.floor(Math.random() * modes.length)]
  const harmonies = generateHarmoniousColors(primary, mode)
  return {
    id: 'comp-' + Date.now() + Math.random().toString(36).slice(2, 7),
    name: '互补色方案',
    primary,
    secondary: harmonies[1] || dom[1] || darken(primary, 20),
    accent: harmonies[2] || lighten(primary, 25)
  }
}

const generateAnalogous = (stops: GradientStop[]): Palette => {
  const dom = extractDominantColors(stops)
  const primary = dom[0]
  const harmonies = generateHarmoniousColors(primary, 'analogous')
  return {
    id: 'anal-' + Date.now() + Math.random().toString(36).slice(2, 7),
    name: '邻近色方案',
    primary,
    secondary: harmonies[1] || dom[1] || lighten(primary, 10),
    accent: harmonies[3] || saturate(harmonies[2] || primary, 30)
  }
}

const generateTriadic = (stops: GradientStop[]): Palette => {
  const dom = extractDominantColors(stops)
  const primary = dom[0]
  const harmonies = generateHarmoniousColors(primary, 'triadic')
  return {
    id: 'tri-' + Date.now() + Math.random().toString(36).slice(2, 7),
    name: '三角色方案',
    primary: harmonies[0],
    secondary: harmonies[1] || dom[1] || darken(harmonies[0], 15),
    accent: harmonies[2] || lighten(harmonies[0], 20)
  }
}

const generateMonochrome = (stops: GradientStop[]): Palette => {
  const dom = extractDominantColors(stops)
  const primary = dom[0]
  const hsl = rgbToHsl(hexToRgb(primary))
  return {
    id: 'mono-' + Date.now() + Math.random().toString(36).slice(2, 7),
    name: '单色调方案',
    primary,
    secondary: rgbToHex(hslToRgb({ h: hsl.h, s: Math.max(20, hsl.s - 25), l: Math.min(90, hsl.l + 20) })),
    accent: rgbToHex(hslToRgb({ h: hsl.h, s: Math.min(100, hsl.s + 10), l: Math.max(15, hsl.l - 25) }))
  }
}

const generateBoldAccent = (stops: GradientStop[]): Palette => {
  const dom = extractDominantColors(stops)
  const primary = dom[0]
  const secondary = dom.length >= 2 ? dom[1] : darken(primary, 15)
  const tetradic = generateHarmoniousColors(primary, 'tetradic')
  return {
    id: 'bold-' + Date.now() + Math.random().toString(36).slice(2, 7),
    name: '大胆强调色',
    primary,
    secondary,
    accent: tetradic[2] || saturate(tetradic[3] || lighten(secondary, 30), 25)
  }
}

const generators = [
  generateComplementary,
  generateAnalogous,
  generateTriadic,
  generateMonochrome,
  generateBoldAccent
]

export const recommendPalettes = (stops: GradientStop[], maxCount: number = 5): Palette[] => {
  const t0 = performance.now()
  const cacheKey = memoKey('recommend', stops.map(s => s.color + s.position).join(','), maxCount)
  if (memo.has(cacheKey)) {
    return memo.get(cacheKey)
  }
  const results: Palette[] = []
  for (let i = 0; i < Math.min(maxCount, generators.length); i++) {
    results.push(generators[i](stops))
  }
  const t1 = performance.now()
  if (t1 - t0 < 90) {
    memo.set(cacheKey, results)
  }
  return results
}

export const paletteToGradientStops = (palette: Palette, existingCount: number): GradientStop[] => {
  const colors = [palette.primary, palette.secondary, palette.accent]
  if (existingCount <= 2) {
    return [
      { color: colors[0], position: 0 },
      { color: colors[2], position: 100 }
    ]
  }
  if (existingCount === 3) {
    return colors.map((c, i) => ({ color: c, position: i * 50 }))
  }
  const result: GradientStop[] = []
  for (let i = 0; i < existingCount; i++) {
    const t = i / (existingCount - 1)
    let colorIdx: number
    if (t < 0.5) colorIdx = 0
    else if (t < 0.85) colorIdx = 1
    else colorIdx = 2
    let color = colors[colorIdx]
    const hue = rgbToHsl(hexToRgb(color))
    const jitter = (Math.sin(i * 12.9898) * 43758.5453) % 1 * 10 - 5
    color = rgbToHex(hslToRgb({
      h: (hue.h + jitter + 360) % 360,
      s: Math.max(10, Math.min(100, hue.s + jitter * 0.5)),
      l: Math.max(10, Math.min(90, hue.l + jitter * 0.3))
    }))
    result.push({ color, position: Math.round(t * 100) })
  }
  return result
}
