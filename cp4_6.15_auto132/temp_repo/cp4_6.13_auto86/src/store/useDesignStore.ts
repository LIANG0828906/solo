import { create } from 'zustand'

export interface PlacedIcon {
  id: string
  iconType: string
  x: number
  y: number
  size: number
  rotation: number
}

export interface FontItem {
  name: string
  family: string
}

export const FONT_LIST: FontItem[] = [
  { name: 'Playfair Display', family: '"Playfair Display", serif' },
  { name: 'Oswald', family: '"Oswald", sans-serif' },
  { name: 'Pacifico', family: '"Pacifico", cursive' },
  { name: 'Lobster', family: '"Lobster", cursive' },
  { name: 'Bebas Neue', family: '"Bebas Neue", sans-serif' },
  { name: 'Righteous', family: '"Righteous", cursive' },
  { name: 'Permanent Marker', family: '"Permanent Marker", cursive' },
  { name: 'Press Start 2P', family: '"Press Start 2P", monospace' },
  { name: 'Abril Fatface', family: '"Abril Fatface", serif' },
  { name: 'Bungee', family: '"Bungee", cursive' },
  { name: 'Fascinate', family: '"Fascinate", cursive' },
  { name: 'Monoton', family: '"Monoton", cursive' },
  { name: 'Orbitron', family: '"Orbitron", sans-serif' },
  { name: 'Ribeye', family: '"Ribeye", cursive' },
  { name: 'Special Elite', family: '"Special Elite", cursive' },
  { name: 'Ultra', family: '"Ultra", serif' },
  { name: 'Bungee Shade', family: '"Bungee Shade", cursive' },
  { name: 'Frijole', family: '"Frijole", cursive' },
  { name: 'Bitter', family: '"Bitter", serif' },
  { name: 'Russo One', family: '"Russo One", sans-serif' },
]

export const ICON_LIST = [
  'Star', 'Shield', 'Flame', 'Leaf', 'Crown',
  'Zap', 'Heart', 'Gem', 'Sun', 'Moon',
  'Mountain', 'Feather', 'Target', 'Compass', 'Trophy',
] as const

export type IconType = typeof ICON_LIST[number]

export const BORDER_STYLES = [
  { id: 'none', label: '无边框', className: '' },
  { id: 'dashed-rounded', label: '圆角虚线', className: 'border-dashed-rounded' },
  { id: 'double-line', label: '双线', className: 'border-double-line' },
  { id: 'lace', label: '花边', className: 'border-lace' },
  { id: 'geometric', label: '几何条纹', className: 'border-geometric' },
] as const

export const TEXTURES = [
  { id: 'none', label: '无纹理', className: '' },
  { id: 'grain', label: '磨砂颗粒', className: 'texture-grain' },
  { id: 'watercolor', label: '水彩晕染', className: 'texture-watercolor' },
  { id: 'gradient', label: '光影渐变', className: 'texture-gradient' },
] as const

interface DesignState {
  text: string
  fontFamily: string
  fontFamilyName: string
  textColor: string
  placedIcons: PlacedIcon[]
  borderStyle: string
  backgroundTexture: string
  selectedIconId: string | null
  isFontFading: boolean
  decorAnimating: boolean
}

interface DesignActions {
  setText: (text: string) => void
  setFontFamily: (family: string, name: string) => void
  setTextColor: (color: string) => void
  addIcon: (icon: PlacedIcon) => void
  updateIcon: (id: string, updates: Partial<PlacedIcon>) => void
  removeIcon: (id: string) => void
  setSelectedIconId: (id: string | null) => void
  setBorderStyle: (style: string) => void
  setBackgroundTexture: (texture: string) => void
  setIsFontFading: (fading: boolean) => void
  setDecorAnimating: (animating: boolean) => void
  resetDesign: () => void
}

const initialState: DesignState = {
  text: 'BADGE',
  fontFamily: '"Bungee", cursive',
  fontFamilyName: 'Bungee',
  textColor: '#ffffff',
  placedIcons: [],
  borderStyle: 'none',
  backgroundTexture: 'none',
  selectedIconId: null,
  isFontFading: false,
  decorAnimating: false,
}

export const useDesignStore = create<DesignState & DesignActions>((set) => ({
  ...initialState,

  setText: (text) => set({ text }),

  setFontFamily: (family, name) => {
    set({ isFontFading: true })
    setTimeout(() => {
      set({ fontFamily: family, fontFamilyName: name, isFontFading: false })
    }, 150)
  },

  setTextColor: (color) => set({ textColor: color }),

  addIcon: (icon) => set((state) => ({
    placedIcons: [...state.placedIcons, icon],
  })),

  updateIcon: (id, updates) => set((state) => ({
    placedIcons: state.placedIcons.map((icon) =>
      icon.id === id ? { ...icon, ...updates } : icon
    ),
  })),

  removeIcon: (id) => set((state) => ({
    placedIcons: state.placedIcons.filter((icon) => icon.id !== id),
    selectedIconId: state.selectedIconId === id ? null : state.selectedIconId,
  })),

  setSelectedIconId: (id) => set({ selectedIconId: id }),

  setBorderStyle: (style) => {
    set({ borderStyle: style, decorAnimating: true })
    setTimeout(() => set({ decorAnimating: false }), 200)
  },

  setBackgroundTexture: (texture) => {
    set({ backgroundTexture: texture, decorAnimating: true })
    setTimeout(() => set({ decorAnimating: false }), 200)
  },

  setIsFontFading: (fading) => set({ isFontFading: fading }),

  setDecorAnimating: (animating) => set({ decorAnimating: animating }),

  resetDesign: () => set({ ...initialState }),
}))
