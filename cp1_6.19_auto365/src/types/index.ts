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

export type ColorblindMode = 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia'

export type SchemeType = 'monochromatic' | 'complementary' | 'split-complementary' | 'analogous' | 'triadic'

export interface ColorScheme {
  id: string
  name: string
  type: SchemeType
  colors: string[]
  createdAt: number
}

export interface ColorValues {
  hex: string
  rgb: string
  hsl: string
}
