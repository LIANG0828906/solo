import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { HSL, ColorblindMode, ColorScheme, SchemeType } from './types'
import { generateId } from './utils/colorUtils'

interface ColorState {
  hue: number
  saturation: number
  lightness: number
  alpha: number
  colorblindMode: ColorblindMode
  favorites: ColorScheme[]
  selectedScheme: ColorScheme | null
  searchQuery: string
  sortBy: 'name' | 'date'
  sidebarOpen: boolean

  setHue: (hue: number) => void
  setSaturation: (value: number) => void
  setLightness: (value: number) => void
  setAlpha: (value: number) => void
  setColorblindMode: (mode: ColorblindMode) => void
  addFavorite: (scheme: Omit<ColorScheme, 'id' | 'createdAt'>) => void
  removeFavorite: (id: string) => void
  selectScheme: (scheme: ColorScheme | null) => void
  setSearchQuery: (query: string) => void
  setSortBy: (sort: 'name' | 'date') => void
  setSidebarOpen: (open: boolean) => void
  updateFavoriteName: (id: string, name: string) => void
}

const sampleSchemes: ColorScheme[] = [
  {
    id: 'sample-1',
    name: '落日余晖',
    type: 'analogous' as SchemeType,
    colors: ['#FF6B6B', '#FF8E53', '#FFA94D', '#FFD93D', '#F7DC6F'],
    createdAt: Date.now() - 86400000
  },
  {
    id: 'sample-2',
    name: '深海幽蓝',
    type: 'monochromatic' as SchemeType,
    colors: ['#E3F2FD', '#90CAF9', '#42A5F5', '#1976D2', '#0D47A1'],
    createdAt: Date.now() - 172800000
  },
  {
    id: 'sample-3',
    name: '森林秘境',
    type: 'triadic' as SchemeType,
    colors: ['#2E7D32', '#81C784', '#FFD54F', '#FF7043', '#5C6BC0'],
    createdAt: Date.now() - 259200000
  },
  {
    id: 'sample-4',
    name: '霓虹夜色',
    type: 'complementary' as SchemeType,
    colors: ['#BB86FC', '#3700B3', '#03DAC6', '#018786', '#CF6679'],
    createdAt: Date.now() - 345600000
  },
  {
    id: 'sample-5',
    name: '樱花粉调',
    type: 'split-complementary' as SchemeType,
    colors: ['#FCE4EC', '#F48FB1', '#EC407A', '#B2DFDB', '#80CBC4'],
    createdAt: Date.now() - 432000000
  }
]

export const useColorStore = create<ColorState>()(
  persist(
    (set) => ({
      hue: 260,
      saturation: 70,
      lightness: 55,
      alpha: 1,
      colorblindMode: 'normal',
      favorites: sampleSchemes,
      selectedScheme: null,
      searchQuery: '',
      sortBy: 'date',
      sidebarOpen: false,

      setHue: (hue) => set({ hue }),
      setSaturation: (saturation) => set({ saturation }),
      setLightness: (lightness) => set({ lightness }),
      setAlpha: (alpha) => set({ alpha }),
      setColorblindMode: (colorblindMode) => set({ colorblindMode }),

      addFavorite: (scheme) =>
        set((state) => ({
          favorites: [
            {
              ...scheme,
              id: generateId(),
              createdAt: Date.now()
            },
            ...state.favorites
          ]
        })),

      removeFavorite: (id) =>
        set((state) => ({
          favorites: state.favorites.filter((f) => f.id !== id),
          selectedScheme: state.selectedScheme?.id === id ? null : state.selectedScheme
        })),

      selectScheme: (selectedScheme) => set({ selectedScheme }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setSortBy: (sortBy) => set({ sortBy }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

      updateFavoriteName: (id, name) =>
        set((state) => ({
          favorites: state.favorites.map((f) =>
            f.id === id ? { ...f, name } : f
          )
        }))
    }),
    {
      name: 'color-palette-storage',
      partialize: (state) => ({
        favorites: state.favorites,
        hue: state.hue,
        saturation: state.saturation,
        lightness: state.lightness,
        colorblindMode: state.colorblindMode
      })
    }
  )
)

export const getCurrentHsl = (): HSL => {
  const state = useColorStore.getState()
  return {
    h: state.hue,
    s: state.saturation / 100,
    l: state.lightness / 100
  }
}
