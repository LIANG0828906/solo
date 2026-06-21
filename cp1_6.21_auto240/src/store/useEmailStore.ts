import { create } from 'zustand'
import axios from 'axios'
import type { Email, EmailStatus, StatsResponse } from '@/types'

interface EmailStore {
  emails: Email[]
  loading: boolean
  stats: StatsResponse | null
  fetchEmails: () => Promise<void>
  updateEmailStatus: (id: string, status: EmailStatus) => Promise<void>
  fetchStats: () => Promise<void>
  setLocalStatus: (id: string, status: EmailStatus) => void
}

export const useEmailStore = create<EmailStore>((set, get) => ({
  emails: [],
  loading: false,
  stats: null,

  fetchEmails: async () => {
    set({ loading: true })
    try {
      const res = await axios.get<Email[]>('/api/emails')
      set({ emails: res.data, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  updateEmailStatus: async (id: string, status: EmailStatus) => {
    const prev = get().emails
    set({ emails: prev.map(e => e.id === id ? { ...e, status } : e) })
    try {
      await axios.put(`/api/emails/${id}`, { status })
    } catch {
      set({ emails: prev })
    }
  },

  fetchStats: async () => {
    try {
      const res = await axios.get<StatsResponse>('/api/stats')
      set({ stats: res.data })
    } catch {
      void 0
    }
  },

  setLocalStatus: (id: string, status: EmailStatus) => {
    set(state => ({
      emails: state.emails.map(e => e.id === id ? { ...e, status } : e),
    }))
  },
}))
