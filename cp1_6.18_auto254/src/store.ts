import { create } from 'zustand'
import { RuneType, CraftedItem, ForgeState } from './types'
import { craftItem, getCraftingHint } from './Crafting'

interface ForgeStore extends ForgeState {
  addRune: (rune: RuneType) => void
  removeRune: (index: number) => void
  clearRunes: () => void
  setTemperature: (temp: number) => void
  startForging: () => void
  finishForging: () => void
  addCraftedItem: (item: CraftedItem) => void
  setHint: (hint: string) => void
  updateHint: () => void
}

export const useForgeStore = create<ForgeStore>((set, get) => ({
  runeSequence: [],
  temperature: 800,
  isForging: false,
  forgeStartTime: 0,
  forgeDuration: 0,
  craftedItems: [],
  currentHint: '将符文拖入熔炉开始锻造',

  addRune: (rune: RuneType) => {
    set((state) => {
      if (state.runeSequence.length >= 5 || state.isForging) return state
      const newSequence = [...state.runeSequence, rune]
      const hint = getCraftingHint(newSequence)
      return { runeSequence: newSequence, currentHint: hint }
    })
  },

  removeRune: (index: number) => {
    set((state) => {
      if (state.isForging) return state
      const newSequence = state.runeSequence.filter((_, i) => i !== index)
      const hint = getCraftingHint(newSequence)
      return { runeSequence: newSequence, currentHint: hint }
    })
  },

  clearRunes: () => {
    set({ runeSequence: [], currentHint: '将符文拖入熔炉开始锻造' })
  },

  setTemperature: (temp: number) => {
    set({ temperature: Math.max(500, Math.min(1500, temp)) })
  },

  startForging: () => {
    const state = get()
    if (state.runeSequence.length < 2 || state.isForging) return
    set({ isForging: true, forgeStartTime: Date.now() })
  },

  finishForging: () => {
    const state = get()
    if (!state.isForging) return

    const duration = Date.now() - state.forgeStartTime
    const result = craftItem(state.runeSequence, state.temperature, duration)

    if (result) {
      set((s) => ({
        isForging: false,
        forgeDuration: duration,
        craftedItems: [...s.craftedItems, result],
        runeSequence: [],
        currentHint: '锻造完成！' + result.name
      }))
    } else {
      set({
        isForging: false,
        forgeDuration: duration,
        runeSequence: [],
        currentHint: '锻造失败，请尝试其他符文组合'
      })
    }
  },

  addCraftedItem: (item: CraftedItem) => {
    set((state) => ({
      craftedItems: [...state.craftedItems, item]
    }))
  },

  setHint: (hint: string) => {
    set({ currentHint: hint })
  },

  updateHint: () => {
    const state = get()
    const hint = getCraftingHint(state.runeSequence)
    set({ currentHint: hint })
  }
}))
