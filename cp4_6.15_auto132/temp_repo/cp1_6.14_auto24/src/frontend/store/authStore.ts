import { create } from 'zustand'
import axios from 'axios'

axios.defaults.withCredentials = true

interface User {
  id: string
  username: string
}

interface AuthState {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  login: async (username: string, password: string) => {
    const res = await axios.post('/api/auth/login', { username, password })
    set({ user: res.data })
  },

  register: async (username: string, password: string) => {
    const res = await axios.post('/api/auth/register', { username, password })
    set({ user: res.data })
  },

  logout: async () => {
    await axios.post('/api/auth/logout')
    set({ user: null })
  },

  checkAuth: async () => {
    try {
      const res = await axios.get('/api/auth/me')
      set({ user: res.data, loading: false })
    } catch {
      set({ user: null, loading: false })
    }
  },
}))
