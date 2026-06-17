import { create } from 'zustand'

export interface Gift {
  id: string
  name: string
  iconUrl: string
  price: number
  sales: number
}

export interface Danmaku {
  id: string
  nickname: string
  avatar: string
  content: string
  timestamp: number
}

export interface GiftRecord {
  id: string
  nickname: string
  avatar: string
  giftId: string
  giftName: string
  giftIcon: string
  count: number
  timestamp: number
}

export interface RankingItem {
  rank: number
  userId: string
  nickname: string
  avatar: string
  coins: number
}

export type RankingType = 'today' | 'week' | 'all'

interface DashboardState {
  gifts: Gift[]
  danmakus: Danmaku[]
  giftRecords: GiftRecord[]
  ranking: RankingItem[]
  rankingType: RankingType
  loading: boolean
  fetchGifts: () => Promise<void>
  addGift: (gift: Omit<Gift, 'id' | 'sales'>) => Promise<void>
  updateGift: (id: string, gift: Partial<Gift>) => Promise<void>
  deleteGift: (id: string) => Promise<void>
  fetchDanmakus: () => Promise<void>
  fetchGiftRecords: () => Promise<void>
  fetchRanking: () => Promise<void>
  setRankingType: (type: RankingType) => void
  sendDanmaku: (data: { nickname: string; content: string }) => Promise<Danmaku | null>
  sendGift: (data: { nickname: string; giftId: string; count: number }) => Promise<GiftRecord | null>
}

const API_BASE = '/api'

const generateAvatar = (seed: string) => {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  gifts: [],
  danmakus: [],
  giftRecords: [],
  ranking: [],
  rankingType: 'today',
  loading: false,

  fetchGifts: async () => {
    try {
      set({ loading: true })
      const res = await fetch(`${API_BASE}/gifts`)
      const result = await res.json()
      if (result.code === 0) {
        set({ gifts: result.data })
      }
    } catch (e) {
      console.error('Failed to fetch gifts:', e)
    } finally {
      set({ loading: false })
    }
  },

  addGift: async (gift) => {
    try {
      const res = await fetch(`${API_BASE}/gifts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gift),
      })
      const result = await res.json()
      if (result.code === 0) {
        set((state) => ({ gifts: [...state.gifts, result.data] }))
      }
    } catch (e) {
      console.error('Failed to add gift:', e)
    }
  },

  updateGift: async (id, gift) => {
    try {
      const res = await fetch(`${API_BASE}/gifts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gift),
      })
      const result = await res.json()
      if (result.code === 0) {
        set((state) => ({
          gifts: state.gifts.map((g) => (g.id === id ? result.data : g)),
        }))
      }
    } catch (e) {
      console.error('Failed to update gift:', e)
    }
  },

  deleteGift: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/gifts/${id}`, {
        method: 'DELETE',
      })
      const result = await res.json()
      if (result.code === 0) {
        set((state) => ({
          gifts: state.gifts.filter((g) => g.id !== id),
        }))
      }
    } catch (e) {
      console.error('Failed to delete gift:', e)
    }
  },

  fetchDanmakus: async () => {
    try {
      const res = await fetch(`${API_BASE}/danmakus`)
      const result = await res.json()
      if (result.code === 0) {
        set({ danmakus: result.data })
      }
    } catch (e) {
      console.error('Failed to fetch danmakus:', e)
    }
  },

  fetchGiftRecords: async () => {
    try {
      const res = await fetch(`${API_BASE}/gift-records`)
      const result = await res.json()
      if (result.code === 0) {
        set({ giftRecords: result.data })
      }
    } catch (e) {
      console.error('Failed to fetch gift records:', e)
    }
  },

  fetchRanking: async () => {
    try {
      const { rankingType } = get()
      const res = await fetch(`${API_BASE}/ranking?type=${rankingType}`)
      const result = await res.json()
      if (result.code === 0) {
        set({ ranking: result.data })
      }
    } catch (e) {
      console.error('Failed to fetch ranking:', e)
    }
  },

  setRankingType: (type) => {
    set({ rankingType: type })
    get().fetchRanking()
  },

  sendDanmaku: async (data) => {
    try {
      const res = await fetch(`${API_BASE}/simulate/danmaku`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          avatar: generateAvatar(data.nickname),
        }),
      })
      const result = await res.json()
      if (result.code === 0) {
        const newDanmaku = result.data
        set((state) => ({
          danmakus: [...state.danmakus, newDanmaku],
        }))
        return newDanmaku
      }
    } catch (e) {
      console.error('Failed to send danmaku:', e)
    }
    return null
  },

  sendGift: async (data) => {
    try {
      const res = await fetch(`${API_BASE}/simulate/gift`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          avatar: generateAvatar(data.nickname),
        }),
      })
      const result = await res.json()
      if (result.code === 0) {
        const newRecord = result.data
        set((state) => ({
          giftRecords: [newRecord, ...state.giftRecords],
        }))
        get().fetchRanking()
        get().fetchGifts()
        return newRecord
      }
    } catch (e) {
      console.error('Failed to send gift:', e)
    }
    return null
  },
}))
