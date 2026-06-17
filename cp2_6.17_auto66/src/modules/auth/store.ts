import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  name: string
}

interface AuthState {
  user: User
  setUser: (user: User) => void
  isCurrentUser: (userId: string) => boolean
}

const DEFAULT_USER: User = {
  id: 'current_user',
  name: '我',
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: DEFAULT_USER,
      setUser: (user) => set({ user }),
      isCurrentUser: (userId) => get().user.id === userId,
    }),
    {
      name: 'commspace-auth',
    }
  )
)
