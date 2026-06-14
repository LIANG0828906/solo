export type ThemeType = 'gothic' | 'forest' | 'steampunk'

export interface ThemeConfig {
  floorColor: string
  wallColor: string
  tableColor: string
  barColor: string
  decorationColor: string
  ambientColor: string
  lightColor: string
  fogColor: string
}

export const themeConfigs: Record<ThemeType, ThemeConfig> = {
  gothic: {
    floorColor: '#1a1228',
    wallColor: '#2d1b3d',
    tableColor: '#4a2a5e',
    barColor: '#6b1a8a',
    decorationColor: '#D4AF37',
    ambientColor: '#2a0a3e',
    lightColor: '#ffd700',
    fogColor: '#0d0518',
  },
  forest: {
    floorColor: '#1a3d2e',
    wallColor: '#2d5a3d',
    tableColor: '#4a7c59',
    barColor: '#2e8b57',
    decorationColor: '#ffd700',
    ambientColor: '#0a2f1a',
    lightColor: '#98fb98',
    fogColor: '#051a10',
  },
  steampunk: {
    floorColor: '#3d2817',
    wallColor: '#5c3a1e',
    tableColor: '#8b6914',
    barColor: '#cd853f',
    decorationColor: '#ffa500',
    ambientColor: '#3a1f0a',
    lightColor: '#ff8c00',
    fogColor: '#1a0f05',
  },
}

export const themeNames: Record<ThemeType, string> = {
  gothic: '哥特暗黑',
  forest: '精灵森林',
  steampunk: '机械蒸汽',
}

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 }
}

const rgbToHex = (r: number, g: number, b: number): string => {
  const toHex = (n: number) =>
    Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

export const lerpColor = (fromHex: string, toHex: string, t: number): string => {
  const from = hexToRgb(fromHex)
  const to = hexToRgb(toHex)
  const progress = Math.max(0, Math.min(1, t))
  return rgbToHex(
    from.r + (to.r - from.r) * progress,
    from.g + (to.g - from.g) * progress,
    from.b + (to.b - from.b) * progress,
  )
}

export const transitionTheme = (
  from: ThemeConfig,
  to: ThemeConfig,
  progress: number,
): ThemeConfig => {
  const t = Math.max(0, Math.min(1, progress))
  const keys = Object.keys(from) as (keyof ThemeConfig)[]
  const result = {} as ThemeConfig
  for (const key of keys) {
    result[key] = lerpColor(from[key], to[key], t)
  }
  return result
}

export const hexToThreeColor = (hex: string): THREEParameters => {
  const rgb = hexToRgb(hex)
  return { r: rgb.r / 255, g: rgb.g / 255, b: rgb.b / 255 }
}

interface THREEParameters {
  r: number
  g: number
  b: number
}
