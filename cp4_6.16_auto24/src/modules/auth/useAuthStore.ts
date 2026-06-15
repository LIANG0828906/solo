import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../../types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (username: string, email: string, password: string) => Promise<boolean>
  logout: () => void
}

const USERS_KEY = 'artvault_users'
const getStoredUsers = (): User[] => {
  try {
    const stored = localStorage.getItem(USERS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}
const saveUsers = (users: User[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      login: async (email: string, password: string) => {
        const users = getStoredUsers()
        const user = users.find(u => u.email === email && u.password === password)
        if (user) {
          set({ user, isAuthenticated: true })
          return true
        }
        return false
      },
      register: async (username: string, email: string, password: string) => {
        const users = getStoredUsers()
        if (users.some(u => u.email === email)) {
          return false
        }
        const newUser: User = {
          id: crypto.randomUUID(),
          username,
          email,
          password,
          createdAt: new Date().toISOString(),
        }
        users.push(newUser)
        saveUsers(users)
        set({ user: newUser, isAuthenticated: true })
        return true
      },
      logout: () => {
        set({ user: null, isAuthenticated: false })
      },
    }),
    {
      name: 'artvault_auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)
