export interface ColorData {
  id: string
  hex: string
  rgb: { r: number; g: number; b: number }
  hsl: { h: number; s: number; l: number }
}

export interface ColorScheme {
  id: string
  name: string
  colors: ColorData[]
  tags: string[]
  createdAt: number
}

export type HarmonyType =
  | 'complementary'
  | 'analogous'
  | 'triadic'
  | 'splitComplementary'
  | 'tetradic'

export interface HarmonyScheme {
  name: string
  type: HarmonyType
  colors: ColorData[]
}

export type SortType = 'date' | 'name'
