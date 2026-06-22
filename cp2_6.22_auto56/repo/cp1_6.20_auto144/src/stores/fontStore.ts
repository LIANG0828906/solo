import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

export interface FontConfig {
  family: string
  size: number
  weight: number
  lineHeight: number
  color: string
}

export interface SavedScheme {
  id: string
  fontA: FontConfig
  fontB: FontConfig
  sampleText: string
  mode: 'side-by-side' | 'single'
  createdAt: number
}

export const AVAILABLE_FONTS = [
  { value: "'Noto Serif SC', serif", label: 'Noto Serif SC' },
  { value: "'Noto Sans SC', sans-serif", label: 'Noto Sans SC' },
  { value: "'Lora', serif", label: 'Lora' },
  { value: "'Playfair Display', serif", label: 'Playfair Display' },
  { value: "'Fira Code', monospace", label: 'Fira Code' },
  { value: "'Merriweather', serif", label: 'Merriweather' },
  { value: "'Roboto', sans-serif", label: 'Roboto' },
  { value: "'Open Sans', sans-serif", label: 'Open Sans' },
  { value: "'Montserrat', sans-serif", label: 'Montserrat' },
  { value: "'Raleway', sans-serif", label: 'Raleway' }
]

const defaultFontA: FontConfig = {
  family: "'Noto Serif SC', serif",
  size: 24,
  weight: 400,
  lineHeight: 1.6,
  color: '#e0e0f0'
}

const defaultFontB: FontConfig = {
  family: "'Noto Sans SC', sans-serif",
  size: 24,
  weight: 400,
  lineHeight: 1.6,
  color: '#e0e0f0'
}

export const useFontStore = defineStore('font', () => {
  const fontA = reactive<FontConfig>({ ...defaultFontA })
  const fontB = reactive<FontConfig>({ ...defaultFontB })
  const sampleText = ref('字体对比预览 Font Compare Preview 在设计中选择合适的字体至关重要。The quick brown fox jumps over the lazy dog. 0123456789')
  const mode = ref<'side-by-side' | 'single'>('side-by-side')
  const schemes = ref<SavedScheme[]>([])
  const toastMessage = ref('')
  const toastVisible = ref(false)

  function updateFontA(patch: Partial<FontConfig>) {
    Object.assign(fontA, patch)
  }

  function updateFontB(patch: Partial<FontConfig>) {
    Object.assign(fontB, patch)
  }

  function setSampleText(text: string) {
    sampleText.value = text
  }

  function toggleMode() {
    mode.value = mode.value === 'side-by-side' ? 'single' : 'side-by-side'
  }

  function saveScheme() {
    const scheme: SavedScheme = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      fontA: { ...fontA },
      fontB: { ...fontB },
      sampleText: sampleText.value,
      mode: mode.value,
      createdAt: Date.now()
    }
    schemes.value.unshift(scheme)
    showToast('方案已保存')
  }

  function restoreScheme(scheme: SavedScheme) {
    Object.assign(fontA, scheme.fontA)
    Object.assign(fontB, scheme.fontB)
    sampleText.value = scheme.sampleText
    mode.value = scheme.mode
    showToast('方案已恢复')
  }

  function deleteScheme(id: string) {
    schemes.value = schemes.value.filter(s => s.id !== id)
    showToast('方案已删除')
  }

  function showToast(message: string) {
    toastMessage.value = message
    toastVisible.value = true
    setTimeout(() => {
      toastVisible.value = false
    }, 2000)
  }

  function exportCSS(scheme: SavedScheme): string {
    const a = scheme.fontA
    const b = scheme.fontB
    return `/* Font A */
.font-a {
  font-family: ${a.family};
  font-size: ${a.size}px;
  font-weight: ${a.weight};
  line-height: ${a.lineHeight};
  color: ${a.color};
}

/* Font B */
.font-b {
  font-family: ${b.family};
  font-size: ${b.size}px;
  font-weight: ${b.weight};
  line-height: ${b.lineHeight};
  color: ${b.color};
}`
  }

  return {
    fontA,
    fontB,
    sampleText,
    mode,
    schemes,
    toastMessage,
    toastVisible,
    updateFontA,
    updateFontB,
    setSampleText,
    toggleMode,
    saveScheme,
    restoreScheme,
    deleteScheme,
    showToast,
    exportCSS
  }
})
