import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface ColorToken {
  id: string
  name: string
  value: string
}

export interface SpacingToken {
  id: string
  name: string
  value: number
}

export interface FontTokens {
  fontFamily: string
  baseSize: number
  lineHeight: number
  h1: number
  h2: number
  h3: number
  h4: number
  h5: number
  h6: number
}

export interface ShadowToken {
  id: string
  name: string
  depth: number
}

export interface RadiusToken {
  id: string
  name: string
  label: string
  value: number | 'full'
}

export interface BorderToken {
  id: string
  name: string
  width: number
  color: string
}

export interface TokenState {
  colors: ColorToken[]
  spacing: SpacingToken[]
  fonts: FontTokens
  shadows: ShadowToken[]
  radii: RadiusToken[]
  borders: BorderToken[]
  colorOrder: string[]
  isResetting: boolean
  updateColor: (id: string, value: string) => void
  updateSpacing: (id: string, value: number) => void
  updateFont: <K extends keyof FontTokens>(key: K, value: FontTokens[K]) => void
  updateShadow: (id: string, depth: number) => void
  updateRadius: (id: string, value: number | 'full') => void
  updateBorderWidth: (id: string, width: number) => void
  updateBorderColor: (id: string, color: string) => void
  updateColorOrder: (order: string[]) => void
  resetAll: () => void
  getTokensForExport: () => object
}

const defaultColors: ColorToken[] = [
  { id: 'primary', name: '主色', value: '#6366f1' },
  { id: 'secondary', name: '辅色', value: '#8b5cf6' },
  { id: 'success', name: '成功色', value: '#22c55e' },
  { id: 'warning', name: '警告色', value: '#f59e0b' },
  { id: 'error', name: '错误色', value: '#ef4444' },
  { id: 'background', name: '背景色', value: '#ffffff' },
  { id: 'text', name: '文本色', value: '#1f2937' },
]

const defaultSpacing: SpacingToken[] = [
  { id: 'xs', name: 'xs', value: 4 },
  { id: 'sm', name: 'sm', value: 8 },
  { id: 'md', name: 'md', value: 16 },
  { id: 'lg', name: 'lg', value: 24 },
  { id: 'xl', name: 'xl', value: 32 },
]

const defaultFonts: FontTokens = {
  fontFamily: 'Inter, sans-serif',
  baseSize: 14,
  lineHeight: 1.5,
  h1: 36,
  h2: 30,
  h3: 24,
  h4: 20,
  h5: 16,
  h6: 14,
}

const defaultShadows: ShadowToken[] = [
  { id: 'small', name: 'small', depth: 1 },
  { id: 'medium', name: 'medium', depth: 4 },
  { id: 'large', name: 'large', depth: 8 },
]

const defaultRadii: RadiusToken[] = [
  { id: 'none', name: 'none', label: '无圆角', value: 0 },
  { id: 'sm', name: 'sm', label: '小圆角', value: 4 },
  { id: 'md', name: 'md', label: '中圆角', value: 8 },
  { id: 'lg', name: 'lg', label: '大圆角', value: 12 },
  { id: 'xl', name: 'xl', label: '超大圆角', value: 16 },
  { id: 'full', name: 'full', label: '圆形', value: 'full' },
]

const defaultBorders: BorderToken[] = [
  { id: 'thin', name: '细边框', width: 1, color: '#e5e7eb' },
  { id: 'medium', name: '中边框', width: 2, color: '#d1d5db' },
  { id: 'thick', name: '粗边框', width: 4, color: '#9ca3af' },
]

const getDefaultColorOrder = () => defaultColors.map(c => c.id)

export const generateShadowString = (depth: number): string => {
  const blur = depth * 4
  const spread = Math.max(0, Math.floor(depth / 3))
  const offsetY = depth
  const opacity = Math.min(0.3, 0.05 + depth * 0.025)
  return `0 ${offsetY}px ${blur}px ${spread}px rgba(0, 0, 0, ${opacity.toFixed(2)})`
}

const darkenColor = (hex: string, amount: number = 0.15): string => {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.max(0, (num >> 16) - Math.round(255 * amount))
  const g = Math.max(0, ((num >> 8) & 0x00ff) - Math.round(255 * amount))
  const b = Math.max(0, (num & 0x0000ff) - Math.round(255 * amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

export { darkenColor }

export const getColorById = (colors: ColorToken[], id: string): string => {
  return colors.find(c => c.id === id)?.value || '#000000'
}

export const getSpacingById = (spacing: SpacingToken[], id: string): number => {
  return spacing.find(s => s.id === id)?.value || 0
}

export const getShadowById = (shadows: ShadowToken[], id: string): string => {
  const token = shadows.find(s => s.id === id)
  return token ? generateShadowString(token.depth) : 'none'
}

export const getRadiusById = (radii: RadiusToken[], id: string): string => {
  const token = radii.find(r => r.id === id)
  if (!token) return '0px'
  return token.value === 'full' ? '9999px' : `${token.value}px`
}

export const getBorderById = (borders: BorderToken[], id: string): string => {
  const token = borders.find(b => b.id === id)
  if (!token) return 'none'
  return `${token.width}px solid ${token.color}`
}

export const getBorderWidthById = (borders: BorderToken[], id: string): number => {
  return borders.find(b => b.id === id)?.width ?? 0
}

export const getBorderColorById = (borders: BorderToken[], id: string): string => {
  return borders.find(b => b.id === id)?.color ?? '#000000'
}

export const useTokenStore = create<TokenState>()(
  persist(
    (set, get) => ({
      colors: defaultColors,
      spacing: defaultSpacing,
      fonts: defaultFonts,
      shadows: defaultShadows,
      radii: [...defaultRadii],
      borders: [...defaultBorders],
      colorOrder: getDefaultColorOrder(),
      isResetting: false,

      updateColor: (id, value) =>
        set(state => ({
          colors: state.colors.map(c => (c.id === id ? { ...c, value } : c)),
        })),

      updateSpacing: (id, value) =>
        set(state => ({
          spacing: state.spacing.map(s => (s.id === id ? { ...s, value } : s)),
        })),

      updateFont: (key, value) =>
        set(state => ({
          fonts: { ...state.fonts, [key]: value },
        })),

      updateShadow: (id, depth) =>
        set(state => ({
          shadows: state.shadows.map(s => (s.id === id ? { ...s, depth } : s)),
        })),

      updateRadius: (id, value) =>
        set(state => ({
          radii: state.radii.map(r => (r.id === id ? { ...r, value } : r)),
        })),

      updateBorderWidth: (id, width) =>
        set(state => ({
          borders: state.borders.map(b => (b.id === id ? { ...b, width } : b)),
        })),

      updateBorderColor: (id, color) =>
        set(state => ({
          borders: state.borders.map(b => (b.id === id ? { ...b, color } : b)),
        })),

      updateColorOrder: (order) => set({ colorOrder: order }),

      resetAll: () => {
        set({
          isResetting: true,
          colors: [...defaultColors],
          spacing: [...defaultSpacing],
          fonts: { ...defaultFonts },
          shadows: [...defaultShadows],
          radii: [...defaultRadii],
          borders: [...defaultBorders],
          colorOrder: getDefaultColorOrder(),
        })
        setTimeout(() => {
          set({ isResetting: false })
        }, 600)
      },

      getTokensForExport: () => {
        const state = get()
        const orderedColors = [...state.colors].sort(
          (a, b) => state.colorOrder.indexOf(a.id) - state.colorOrder.indexOf(b.id)
        )
        return {
          colors: orderedColors.reduce(
            (acc, c) => ({ ...acc, [c.id]: { name: c.name, value: c.value } }),
            {}
          ),
          spacing: state.spacing.reduce(
            (acc, s) => ({ ...acc, [s.id]: { name: s.name, value: `${s.value}px` } }),
            {}
          ),
          typography: {
            fontFamily: state.fonts.fontFamily,
            baseSize: `${state.fonts.baseSize}px`,
            lineHeight: state.fonts.lineHeight,
            headings: {
              h1: `${state.fonts.h1}px`,
              h2: `${state.fonts.h2}px`,
              h3: `${state.fonts.h3}px`,
              h4: `${state.fonts.h4}px`,
              h5: `${state.fonts.h5}px`,
              h6: `${state.fonts.h6}px`,
            },
          },
          shadows: state.shadows.reduce(
            (acc, s) => ({
              ...acc,
              [s.id]: { name: s.name, value: generateShadowString(s.depth) },
            }),
            {}
          ),
          radii: state.radii.reduce(
            (acc, r) => ({
              ...acc,
              [r.id]: {
                name: r.label,
                value: r.value === 'full' ? '9999px' : `${r.value}px`,
              },
            }),
            {}
          ),
          borders: state.borders.reduce(
            (acc, b) => ({
              ...acc,
              [b.id]: {
                name: b.name,
                width: `${b.width}px`,
                color: b.color,
                value: `${b.width}px solid ${b.color}`,
              },
            }),
            {}
          ),
        }
      },
    }),
    {
      name: 'design-token-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
