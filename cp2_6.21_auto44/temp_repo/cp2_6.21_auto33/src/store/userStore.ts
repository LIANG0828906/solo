import { create } from 'zustand'
import { login as loginApi, register as registerApi, User, LoginData, RegisterData } from '../api/auth'

interface UserState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (data: LoginData) => Promise<void>
  logout: () => void
  register: (data: RegisterData) => Promise<void>
  loadFromStorage: () => void
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: async (data: LoginData) => {
    const response = await loginApi(data)
    localStorage.setItem('token', response.token)
    localStorage.setItem('user', JSON.stringify(response.user))
    set({ user: response.user, token: response.token, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ user: null, token: null, isAuthenticated: false })
  },

  register: async (data: RegisterData) => {
    const response = await registerApi(data)
    localStorage.setItem('token', response.token)
    localStorage.setItem('user', JSON.stringify(response.user))
    set({ user: response.user, token: response.token, isAuthenticated: true })
  },

  loadFromStorage: () => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User
        if (typeof user.id === 'number' && Number.isInteger(user.id)) {
          set({ user, token, isAuthenticated: true })
        } else {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        }
      } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
  }
}))
