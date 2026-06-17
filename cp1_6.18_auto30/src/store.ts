import { create } from 'zustand'
import * as api from './api'
import type { Bottle, Message } from './api'

interface DriftBottleState {
  bottles: Bottle[]
  currentMessage: Message | null
  loading: boolean
  toastMessage: string
  fetchBottles: () => Promise<void>
  pickBottle: (id: string) => Promise<void>
  throwBottle: (id: string) => Promise<void>
  throwNewBottle: (data: Omit<Bottle, 'id' | 'passCount' | 'height'>) => Promise<void>
  readMessage: (id: string) => Promise<void>
  closeMessage: () => void
  clearToast: () => void
}

export const useStore = create<DriftBottleState>((set, get) => ({
  bottles: [],
  currentMessage: null,
  loading: false,
  toastMessage: '',

  fetchBottles: async () => {
    set({ loading: true })
    try {
      const bottles = await api.fetchBottles()
      set({ bottles, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  pickBottle: async (id: string) => {
    set({ loading: true })
    try {
      const message = await api.pickBottle(id)
      const bottles = get().bottles.filter((b) => b.id !== id)
      set({ bottles, currentMessage: message, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  throwBottle: async (id: string) => {
    set({ loading: true })
    try {
      await api.throwBottle(id)
      const bottles = get().bottles.filter((b) => b.id !== id)
      set({ bottles, toastMessage: '瓶子已漂走', loading: false })
      setTimeout(() => {
        get().clearToast()
      }, 2000)
    } catch {
      set({ loading: false })
    }
  },

  throwNewBottle: async (data: Omit<Bottle, 'id' | 'passCount' | 'height'>) => {
    set({ loading: true })
    try {
      await api.throwNewBottle(data)
      await get().fetchBottles()
    } catch {
      set({ loading: false })
    }
  },

  readMessage: async (id: string) => {
    set({ loading: true })
    try {
      const message = await api.getMessage(id)
      set({ currentMessage: message, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  closeMessage: () => {
    set({ currentMessage: null })
  },

  clearToast: () => {
    set({ toastMessage: '' })
  },
}))
