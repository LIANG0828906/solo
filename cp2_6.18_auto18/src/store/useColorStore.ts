import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { generateColorScheme } from '@/modules/colorHarmony'
import chroma from 'chroma-js'

export type SchemeType = 'triadic' | 'complementary' | 'analogous' | 'splitComplementary'

export interface ColorScheme {
  primary: string
  secondary: string[]
  type: SchemeType
}

export interface SavedScheme {
  id: string
  name: string
  primary: string
  secondary: string[]
  type: SchemeType
  hue: number
  saturation: number
  lightness: number
}

interface ColorStoreState {
  hue: number
  saturation: number
  lightness: number
  schemeType: SchemeType
  colorScheme: ColorScheme
  savedSchemes: SavedScheme[]
  isStarred: boolean
  toastMessage: string
  toastVisible: boolean
  setHue: (hue: number) => void
  setSaturation: (sat: number) => void
  setLightness: (light: number) => void
  setSchemeType: (type: SchemeType) => void
  saveScheme: (name?: string) => void
  removeScheme: (id: string) => void
  applyScheme: (scheme: SavedScheme) => void
  toggleStar: () => void
  showToast: (msg: string) => void
}

function buildScheme(hue: number, sat: number, light: number, type: SchemeType): ColorScheme {
  return generateColorScheme(hue, sat, light, type)
}

function hslFromHex(hex: string): [number, number, number] {
  try {
    const [h, s, l] = chroma(hex).hsl()
    return [isNaN(h) ? 0 : h, s * 100, l * 100]
  } catch {
    return [0, 70, 55]
  }
}

export const useColorStore = create<ColorStoreState>((set, get) => ({
  hue: 210,
  saturation: 70,
  lightness: 55,
  schemeType: 'triadic',
  colorScheme: buildScheme(210, 70, 55, 'triadic'),
  savedSchemes: [],
  isStarred: false,
  toastMessage: '',
  toastVisible: false,

  setHue: (hue: number) => {
    const s = get()
    set({ hue, colorScheme: buildScheme(hue, s.saturation, s.lightness, s.schemeType), isStarred: false })
  },
  setSaturation: (saturation: number) => {
    const s = get()
    set({ saturation, colorScheme: buildScheme(s.hue, saturation, s.lightness, s.schemeType), isStarred: false })
  },
  setLightness: (lightness: number) => {
    const s = get()
    set({ lightness, colorScheme: buildScheme(s.hue, s.saturation, lightness, s.schemeType), isStarred: false })
  },
  setSchemeType: (schemeType: SchemeType) => {
    const s = get()
    set({ schemeType, colorScheme: buildScheme(s.hue, s.saturation, s.lightness, schemeType), isStarred: false })
  },
  saveScheme: (name?: string) => {
    const s = get()
    const scheme: SavedScheme = {
      id: uuidv4(),
      name: name || `${s.schemeType} ${Math.round(s.hue)}°`,
      primary: s.colorScheme.primary,
      secondary: s.colorScheme.secondary,
      type: s.colorScheme.type,
      hue: s.hue,
      saturation: s.saturation,
      lightness: s.lightness,
    }
    set({ savedSchemes: [...s.savedSchemes, scheme], isStarred: true })
  },
  removeScheme: (id: string) => {
    const s = get()
    set({ savedSchemes: s.savedSchemes.filter(sc => sc.id !== id) })
  },
  applyScheme: (scheme: SavedScheme) => {
    const [h, sat, light] = hslFromHex(scheme.primary)
    const hue = scheme.hue != null ? scheme.hue : Math.round(h)
    const saturation = scheme.saturation != null ? scheme.saturation : Math.round(sat)
    const lightness = scheme.lightness != null ? scheme.lightness : Math.round(light)
    set({
      hue,
      saturation,
      lightness,
      schemeType: scheme.type,
      colorScheme: { primary: scheme.primary, secondary: scheme.secondary, type: scheme.type },
      isStarred: true,
    })
  },
  toggleStar: () => {
    const s = get()
    if (s.isStarred) {
      set({ isStarred: false })
    } else {
      const scheme: SavedScheme = {
        id: uuidv4(),
        name: `${s.schemeType} ${Math.round(s.hue)}°`,
        primary: s.colorScheme.primary,
        secondary: s.colorScheme.secondary,
        type: s.colorScheme.type,
        hue: s.hue,
        saturation: s.saturation,
        lightness: s.lightness,
      }
      set({ savedSchemes: [...s.savedSchemes, scheme], isStarred: true })
    }
  },
  showToast: (msg: string) => {
    set({ toastMessage: msg, toastVisible: true })
    setTimeout(() => set({ toastVisible: false }), 2000)
  },
}))
