import { create } from 'zustand'
import { User, authAPI } from '../api'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  restoreAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: async (username: string, password: string) => {
    const res = await authAPI.login(username, password)
    localStorage.setItem('token', res.access_token)
    set({ user: res.user, token: res.access_token, isAuthenticated: true })
  },

  register: async (username: string, email: string, password: string) => {
    const res = await authAPI.register({ username, email, password })
    localStorage.setItem('token', res.access_token)
    set({ user: res.user, token: res.access_token, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null, isAuthenticated: false })
  },

  restoreAuth: async () => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const user = await authAPI.me()
        set({ user, token, isAuthenticated: true })
      } catch {
        localStorage.removeItem('token')
        set({ user: null, token: null, isAuthenticated: false })
      }
    }
  },
}))
