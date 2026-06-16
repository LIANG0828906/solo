export const DEFAULT_PALETTE = [
  '#6C5CE7',
  '#0984E3',
  '#FD79A8',
  '#FDCB6E',
  '#00B894',
]

export const DEEP_SEA_PALETTE = [
  '#00CEC9',
  '#0984E3',
  '#2D3436',
  '#B2BEC3',
  '#DFE6E9',
]

export const RUNE_COLOR = '#FFD700'
export const VORTEX_CENTER_COLOR = '#FFFFFF'

export type ThemeName = 'default' | 'deepSea'

export interface ButtonColors {
  pause: string
  reset: string
  save: string
  theme: string
  pauseText: string
  resetText: string
  saveText: string
  themeText: string
}

export const DEFAULT_BUTTON_COLORS: ButtonColors = {
  pause: '#2D3436',
  reset: '#E17055',
  save: '#00CEC9',
  theme: '#6C5CE7',
  pauseText: '#FFFFFF',
  resetText: '#FFFFFF',
  saveText: '#FFFFFF',
  themeText: '#FFFFFF',
}

export const DEEP_SEA_BUTTON_COLORS: ButtonColors = {
  pause: '#0984E3',
  reset: '#2D3436',
  save: '#00CEC9',
  theme: '#DFE6E9',
  pauseText: '#FFFFFF',
  resetText: '#FFFFFF',
  saveText: '#FFFFFF',
  themeText: '#2D3436',
}

export const getPalette = (theme: ThemeName): string[] => {
  return theme === 'default' ? DEFAULT_PALETTE : DEEP_SEA_PALETTE
}

export const getButtonColors = (theme: ThemeName): ButtonColors => {
  return theme === 'default' ? DEFAULT_BUTTON_COLORS : DEEP_SEA_BUTTON_COLORS
}

export interface NebulaColors {
  bgTop: string
  bgBottom: string
  glow1: string
  glow2: string
  band1: string
  band2: string
}

export const DEFAULT_NEBULA_COLORS: NebulaColors = {
  bgTop: '#0a0a1a',
  bgBottom: '#1a0a2e',
  glow1: '#6C5CE7',
  glow2: '#0984E3',
  band1: '#FD79A8',
  band2: '#FDCB6E',
}

export const DEEP_SEA_NEBULA_COLORS: NebulaColors = {
  bgTop: '#020810',
  bgBottom: '#0a1628',
  glow1: '#00CEC9',
  glow2: '#0984E3',
  band1: '#B2BEC3',
  band2: '#DFE6E9',
}

export const getNebulaColors = (theme: ThemeName): NebulaColors => {
  return theme === 'default' ? DEFAULT_NEBULA_COLORS : DEEP_SEA_NEBULA_COLORS
}

export const pickRandomColor = (palette: string[]): string => {
  return palette[Math.floor(Math.random() * palette.length)]
}

export const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 }
}

export const rgbToHex = (r: number, g: number, b: number): string => {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16)
        return hex.length === 1 ? '0' + hex : hex
      })
      .join('')
  )
}

export const mixColors = (
  color1: string,
  color2: string,
  ratio: number
): string => {
  const c1 = hexToRgb(color1)
  const c2 = hexToRgb(color2)
  const r = c1.r * (1 - ratio) + c2.r * ratio
  const g = c1.g * (1 - ratio) + c2.g * ratio
  const b = c1.b * (1 - ratio) + c2.b * ratio
  return rgbToHex(r, g, b)
}

export const generateSnapshot = (
  canvas: HTMLCanvasElement,
  size: number = 512
): string => {
  const offscreen = document.createElement('canvas')
  offscreen.width = size
  offscreen.height = size
  const ctx = offscreen.getContext('2d')!

  const tapestryW = canvas.width * 0.8
  const tapestryH = canvas.height * 0.8
  const tapestryX = canvas.width * 0.1
  const tapestryY = canvas.height * 0.1

  ctx.fillStyle = '#0a0a0a'
  ctx.fillRect(0, 0, size, size)
  ctx.drawImage(
    canvas,
    tapestryX,
    tapestryY,
    tapestryW,
    tapestryH,
    0,
    0,
    size,
    size
  )

  return offscreen.toDataURL('image/png')
}

export const downloadSnapshot = (dataUrl: string, filename: string = 'magic-loom.png'): void => {
  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
