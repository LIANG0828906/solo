import { hslToRgb, rgbToHex } from './utils'

export interface HSL {
  h: number
  s: number
  l: number
}

export interface RGB {
  r: number
  g: number
  b: number
}

export interface ColorItem {
  id: string
  hsl: HSL
  rgb: RGB
  hex: string
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function createColorItem(hsl: HSL): ColorItem {
  const rgb = hslToRgb(hsl.h, hsl.s, hsl.l)
  const hex = rgbToHex(rgb.r, rgb.g, rgb.b)
  return {
    id: generateUUID(),
    hsl: { ...hsl },
    rgb,
    hex,
  }
}
