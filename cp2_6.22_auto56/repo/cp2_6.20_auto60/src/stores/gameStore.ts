import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { Fragment, Rune, EquippedRunes, BattleRecord, SlotType } from '../types'

interface GameState {
  fragments: Fragment[]
  runeCollection: Rune[]
  equippedRunes: EquippedRunes
  battleRecords: BattleRecord[]
  selectedFragment: Fragment | null
  forgeSlots: Array<Fragment | null>

  addFragment: (fragment: Fragment, count?: number) => void
  removeFragment: (fragmentId: string, count?: number) => void
  addRune: (rune: Rune) => void
  removeRune: (runeId: string) => void
  equipRune: (slot: SlotType, rune: Rune | null) => void
  unequipRune: (slot: SlotType) => void
  addBattleRecord: (record: Omit<BattleRecord, 'id' | 'timestamp'>) => void
  setSelectedFragment: (fragment: Fragment | null) => void
  setForgeSlot: (index: number, fragment: Fragment | null) => void
  clearForgeSlots: () => void
  consumeForgeFragments: () => void
}

const initialEquipped: EquippedRunes = {
  weapon: null,
  offhand: null,
  helmet: null,
  chest: null,
  bracers: null,
  ring: null,
}

export const useGameStore = create<GameState>((set, get) => ({
  fragments: [],
  runeCollection: [],
  equippedRunes: { ...initialEquipped },
  battleRecords: [],
  selectedFragment: null,
  forgeSlots: [null, null, null, null, null, null],

  addFragment: (fragment, count = 1) => {
    set((state) => {
      const existing = state.fragments.find((f) => f.id === fragment.id)
      if (existing) {
        return {
          fragments: state.fragments.map((f) =>
            f.id === fragment.id ? { ...f, count: f.count + count } : f
          ),
        }
      }
      return {
        fragments: [...state.fragments, { ...fragment, count }],
      }
    })
  },

  removeFragment: (fragmentId, count = 1) => {
    set((state) => ({
      fragments: state.fragments
        .map((f) =>
          f.id === fragmentId ? { ...f, count: Math.max(0, f.count - count) } : f
        )
        .filter((f) => f.count > 0),
    }))
  },

  addRune: (rune) => {
    set((state) => ({
      runeCollection: [...state.runeCollection, rune],
    }))
  },

  removeRune: (runeId) => {
    set((state) => ({
      runeCollection: state.runeCollection.filter((r) => r.id !== runeId),
    }))
  },

  equipRune: (slot, rune) => {
    set((state) => {
      const currentEquipped = state.equippedRunes[slot]
      let newCollection = [...state.runeCollection]
      
      if (rune) {
        newCollection = newCollection.filter((r) => r.id !== rune.id)
      }
      if (currentEquipped) {
        newCollection = [...newCollection, currentEquipped]
      }
      
      return {
        equippedRunes: { ...state.equippedRunes, [slot]: rune },
        runeCollection: newCollection,
      }
    })
  },

  unequipRune: (slot) => {
    set((state) => {
      const rune = state.equippedRunes[slot]
      if (!rune) return state
      return {
        equippedRunes: { ...state.equippedRunes, [slot]: null },
        runeCollection: [...state.runeCollection, rune],
      }
    })
  },

  addBattleRecord: (record) => {
    set((state) => ({
      battleRecords: [
        { ...record, id: uuidv4(), timestamp: Date.now() },
        ...state.battleRecords,
      ].slice(0, 50),
    }))
  },

  setSelectedFragment: (fragment) => {
    set({ selectedFragment: fragment })
  },

  setForgeSlot: (index, fragment) => {
    set((state) => {
      const newSlots = [...state.forgeSlots]
      newSlots[index] = fragment
      return { forgeSlots: newSlots }
    })
  },

  clearForgeSlots: () => {
    set({ forgeSlots: [null, null, null, null, null, null] })
  },

  consumeForgeFragments: () => {
    const { forgeSlots } = get()
    forgeSlots.forEach((f) => {
      if (f) {
        get().removeFragment(f.id, 1)
      }
    })
    set({ forgeSlots: [null, null, null, null, null, null] })
  },
}))
