import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { generatePalette, type GeneratedPalette, generateTailwindShades, type TailwindShades } from '@/palette/paletteController'

export interface ColorItem {
  id: string
  hex: string
  name: string
}

export type CopyMode = 'css' | 'tailwind'

const DEFAULT_COLORS: ColorItem[] = [
  { id: '1', hex: '#3B82F6', name: '主色' },
  { id: '2', hex: '#10B981', name: '辅色' },
  { id: '3', hex: '#F59E0B', name: '强调色' },
]

export const useThemeStore = defineStore('theme', () => {
  const inputColors = ref<ColorItem[]>([...DEFAULT_COLORS])
  const palette = ref<GeneratedPalette | null>(null)
  const copyMode = ref<CopyMode>('css')
  const toastMessage = ref<string>('')
  const showToast = ref(false)

  const paletteArray = computed(() => {
    if (!palette.value) return []
    return [
      { key: 'primaryLight', name: '主色-浅', hex: palette.value.primaryLight },
      { key: 'primary', name: '主色', hex: palette.value.primary },
      { key: 'primaryDark', name: '主色-深', hex: palette.value.primaryDark },
      { key: 'primarySoft', name: '主色-柔和', hex: palette.value.primarySoft },
      { key: 'secondaryLight', name: '辅色-浅', hex: palette.value.secondaryLight },
      { key: 'secondary', name: '辅色', hex: palette.value.secondary },
      { key: 'secondaryDark', name: '辅色-深', hex: palette.value.secondaryDark },
      { key: 'secondarySoft', name: '辅色-柔和', hex: palette.value.secondarySoft },
      { key: 'accentLight', name: '强调色-浅', hex: palette.value.accentLight },
      { key: 'accent', name: '强调色', hex: palette.value.accent },
      { key: 'accentDark', name: '强调色-深', hex: palette.value.accentDark },
      { key: 'contrast', name: '对比色', hex: palette.value.contrast },
    ]
  })

  function regeneratePalette() {
    if (inputColors.value.length > 0) {
      palette.value = generatePalette(inputColors.value.map((c) => c.hex))
    }
  }

  function addColor() {
    if (inputColors.value.length >= 5) return
    const names = ['主色', '辅色', '强调色', '第四色', '第五色']
    const presets = ['#6366F1', '#EC4899', '#8B5CF6', '#EF4444', '#14B8A6']
    inputColors.value.push({
      id: Date.now().toString(),
      hex: presets[inputColors.value.length] || '#888888',
      name: names[inputColors.value.length] || `颜色${inputColors.value.length + 1}`,
    })
  }

  function removeColor(id: string) {
    if (inputColors.value.length <= 1) return
    const idx = inputColors.value.findIndex((c) => c.id === id)
    if (idx !== -1) {
      inputColors.value.splice(idx, 1)
    }
  }

  function updateColor(id: string, hex: string) {
    const color = inputColors.value.find((c) => c.id === id)
    if (color) {
      color.hex = hex
    }
  }

  function reorderColors(fromIndex: number, toIndex: number) {
    const item = inputColors.value.splice(fromIndex, 1)[0]
    inputColors.value.splice(toIndex, 0, item)
  }

  function triggerToast(message: string) {
    toastMessage.value = message
    showToast.value = true
    setTimeout(() => {
      showToast.value = false
    }, 3000)
  }

  function getTailwindShades(): Record<string, TailwindShades> {
    if (!palette.value) return {}
    return {
      primary: generateTailwindShades(palette.value.primary),
      secondary: generateTailwindShades(palette.value.secondary),
      accent: generateTailwindShades(palette.value.accent),
    }
  }

  watch(
    inputColors,
    () => {
      regeneratePalette()
    },
    { deep: true, immediate: true },
  )

  return {
    inputColors,
    palette,
    paletteArray,
    copyMode,
    toastMessage,
    showToast,
    addColor,
    removeColor,
    updateColor,
    reorderColors,
    triggerToast,
    regeneratePalette,
    getTailwindShades,
  }
})
