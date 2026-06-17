import { create } from 'zustand'

export interface SemanticColor {
  id: string
  name: string
  hex: string
  r: number
  g: number
  b: number
}

interface ColorStore {
  colors: SemanticColor[]
  history: SemanticColor[][]
  historyIndex: number
  updateColor: (id: string, updates: Partial<SemanticColor>) => void
  undo: () => void
  pushHistory: () => void
  exportScheme: () => string
}

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 }
}

const rgbToHex = (r: number, g: number, b: number) => {
  return '#' + [r, g, b].map(x => {
    return Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')
  }).join('').toUpperCase()
}

const initialColors: SemanticColor[] = [
  { id: 'primary', name: '主色', hex: '#3B82F6', ...hexToRgb('#3B82F6') },
  { id: 'secondary', name: '辅色', hex: '#10B981', ...hexToRgb('#10B981') },
  { id: 'accent', name: '强调色', hex: '#F59E0B', ...hexToRgb('#F59E0B') },
  { id: 'background', name: '背景色', hex: '#F8FAFC', ...hexToRgb('#F8FAFC') },
  { id: 'text', name: '文字色', hex: '#1E293B', ...hexToRgb('#1E293B') },
]

export { hexToRgb, rgbToHex }

export const useColorStore = create<ColorStore>((set, get) => ({
  colors: initialColors,
  history: [JSON.parse(JSON.stringify(initialColors))],
  historyIndex: 0,

  pushHistory: () => {
    const { colors, history, historyIndex } = get()
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(JSON.parse(JSON.stringify(colors)))
    if (newHistory.length > 20) {
      newHistory.shift()
    }
    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    })
  },

  updateColor: (id: string, updates: Partial<SemanticColor>) => {
    const { colors } = get()
    const newColors = colors.map(c =>
      c.id === id ? { ...c, ...updates } : c
    )
    set({ colors: newColors })
    get().pushHistory()
  },

  undo: () => {
    const { history, historyIndex } = get()
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      set({
        historyIndex: newIndex,
        colors: JSON.parse(JSON.stringify(history[newIndex]))
      })
    }
  },

  exportScheme: () => {
    const { colors } = get()
    const lines = colors.map(c => {
      return `  /* ${c.name} */\n  --color-${c.id}: ${c.hex};\n  --color-${c.id}-rgb: ${c.r}, ${c.g}, ${c.b};`
    })
    return `:root {\n${lines.join('\n')}\n}`
  }
}))
