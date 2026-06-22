import { create } from 'zustand'

interface CurrentUser {
  id: string
  name: string
  avatar: string
}

interface AppState {
  currentUser: CurrentUser
  setCurrentUser: (user: CurrentUser) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentUser: {
    id: 'user1',
    name: '张明',
    avatar: '',
  },
  setCurrentUser: (user) => set({ currentUser: user }),
}))
