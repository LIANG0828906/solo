import { create } from 'zustand'
import { get as idbGet, set as idbSet } from 'idb-keyval'
import type { PlayerData, LapRecord, StickerType } from '../types'
import { v4 as uuidv4 } from 'uuid'

interface PlayerState {
  player: PlayerData | null
  lapRecords: LapRecord[]
  isLoaded: boolean
  loadPlayer: () => Promise<void>
  addCoins: (amount: number) => Promise<void>
  addLapRecord: (record: Omit<LapRecord, 'id' | 'date'>) => Promise<void>
  setCustomizationColor: (color: string) => Promise<void>
  setCustomizationSticker: (sticker: StickerType) => Promise<void>
  getBestLapTime: () => number | null
}

function createDefaultPlayer(): PlayerData {
  return {
    id: uuidv4(),
    totalCoins: 0,
    currentCustomization: {
      id: uuidv4(),
      color: '#ffffff',
      sticker: 'none',
      unlocked: true,
    },
    unlockedColors: ['#ffffff'],
    unlockedStickers: ['none'],
  }
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  player: null,
  lapRecords: [],
  isLoaded: false,

  loadPlayer: async () => {
    try {
      let player = await idbGet<PlayerData>('player')
      if (!player) {
        player = createDefaultPlayer()
        await idbSet('player', player)
      }

      let records = await idbGet<LapRecord[]>('lapRecords')
      if (!records) {
        records = []
        await idbSet('lapRecords', records)
      }

      set({ player, lapRecords: records, isLoaded: true })
    } catch (error) {
      console.error('Failed to load player data:', error)
      const player = createDefaultPlayer()
      set({ player, lapRecords: [], isLoaded: true })
    }
  },

  addCoins: async (amount: number) => {
    const { player } = get()
    if (!player) return

    const updated = { ...player, totalCoins: player.totalCoins + amount }
    await idbSet('player', updated)
    set({ player: updated })
  },

  addLapRecord: async (record) => {
    const { lapRecords } = get()
    const newRecord: LapRecord = {
      ...record,
      id: uuidv4(),
      date: new Date().toISOString(),
    }

    const updated = [...lapRecords, newRecord]
      .sort((a, b) => a.time - b.time)
      .slice(0, 20)

    await idbSet('lapRecords', updated)
    set({ lapRecords: updated })
  },

  setCustomizationColor: async (color: string) => {
    const { player } = get()
    if (!player) return

    const updated: PlayerData = {
      ...player,
      currentCustomization: {
        ...player.currentCustomization,
        color,
      },
    }

    if (!player.unlockedColors.includes(color)) {
      updated.unlockedColors = [...player.unlockedColors, color]
    }

    await idbSet('player', updated)
    set({ player: updated })
  },

  setCustomizationSticker: async (sticker: StickerType) => {
    const { player } = get()
    if (!player) return

    const updated: PlayerData = {
      ...player,
      currentCustomization: {
        ...player.currentCustomization,
        sticker,
      },
    }

    if (!player.unlockedStickers.includes(sticker)) {
      updated.unlockedStickers = [...player.unlockedStickers, sticker]
    }

    await idbSet('player', updated)
    set({ player: updated })
  },

  getBestLapTime: () => {
    const { lapRecords } = get()
    if (lapRecords.length === 0) return null
    return lapRecords[0].time
  },
}))
