import { ref, watch, onMounted } from 'vue'

export interface SwatchData {
  id: string
  color: string
  comment: string
  mood: string
}

const DEFAULT_COLORS = ['#5865F2', '#44BBA4', '#E74C3C', '#F1C40F', '#99AAB5']

const MOOD_OPTIONS = ['积极', '冷静', '热情', '中性'] as const
export type MoodType = typeof MOOD_OPTIONS[number] | ''

function generateId(): string {
  return Math.random().toString(36).substring(2, 10)
}

function createDefaultSwatches(): SwatchData[] {
  return DEFAULT_COLORS.map(color => ({
    id: generateId(),
    color,
    comment: '',
    mood: ''
  }))
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('').toUpperCase()
}

export function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return rgbToHex(f(0) * 255, f(8) * 255, f(4) * 255)
}

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const rgb = hexToRgb(hex)
  if (!rgb) return { h: 0, s: 0, l: 50 }
  let { r, g, b } = rgb
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  }
}

export function useColorHash() {
  const swatches = ref<SwatchData[]>(createDefaultSwatches())
  const isRestoring = ref(false)

  function parseHash(): string[] | null {
    const hash = window.location.hash
    if (!hash || !hash.includes('colors=')) return null
    try {
      const match = hash.match(/colors=([^&]+)/)
      if (!match) return null
      const colorsStr = decodeURIComponent(match[1])
      const colors = colorsStr
        .split(',')
        .map(c => {
          const trimmed = c.trim()
          return trimmed.startsWith('#') ? trimmed.toUpperCase() : '#' + trimmed.toUpperCase()
        })
        .filter(c => /^#[0-9A-Fa-f]{6}$/.test(c))
      return colors.length > 0 ? colors : null
    } catch {
      return null
    }
  }

  function restoreFromHash(): boolean {
    const colors = parseHash()
    if (!colors) return false
    isRestoring.value = true
    swatches.value = colors.map(color => ({
      id: generateId(),
      color: color.toUpperCase(),
      comment: '',
      mood: ''
    }))
    setTimeout(() => {
      isRestoring.value = false
    }, 100)
    return true
  }

  function generateShareUrl(): string {
    const colors = swatches.value.map(s => s.color.replace('#', '')).join(',')
    const base = window.location.origin + window.location.pathname
    return `${base}#colors=${colors}`
  }

  function resetSwatches() {
    swatches.value.forEach((_, index) => {
      setTimeout(() => {
        if (index === swatches.value.length - 1) {
          swatches.value = createDefaultSwatches()
        }
      }, index * 50)
    })
    if (swatches.value.length === 0) {
      swatches.value = createDefaultSwatches()
    }
  }

  function clearAll() {
    swatches.value = []
  }

  function updateColor(id: string, color: string) {
    const swatch = swatches.value.find(s => s.id === id)
    if (swatch) {
      swatch.color = color.toUpperCase()
    }
  }

  function updateComment(id: string, comment: string) {
    const swatch = swatches.value.find(s => s.id === id)
    if (swatch) {
      swatch.comment = comment.substring(0, 50)
    }
  }

  function updateMood(id: string, mood: string) {
    const swatch = swatches.value.find(s => s.id === id)
    if (swatch) {
      swatch.mood = swatch.mood === mood ? '' : mood
    }
  }

  function reorderSwatches(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return
    const item = swatches.value.splice(fromIndex, 1)[0]
    swatches.value.splice(toIndex, 0, item)
  }

  onMounted(() => {
    restoreFromHash()
    window.addEventListener('hashchange', restoreFromHash)
  })

  watch(swatches, () => {
    // 内部监听，不做自动更新hash，避免频繁跳转
  }, { deep: true })

  return {
    swatches,
    isRestoring,
    generateShareUrl,
    restoreFromHash,
    resetSwatches,
    clearAll,
    updateColor,
    updateComment,
    updateMood,
    reorderSwatches,
    MOOD_OPTIONS
  }
}
