import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../api'

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface Notification {
  id: string
  type: NotificationType
  message: string
  duration?: number
}

export interface AuthState {
  user: Omit<User, 'password'> | null
  token: string | null
  login: (user: Omit<User, 'password'>, token: string) => void
  logout: () => void
}

export interface NotificationState {
  notifications: Notification[]
  addNotification: (type: NotificationType, message: string, duration?: number) => void
  removeNotification: (id: string) => void
}

export type AppState = AuthState & NotificationState

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      notifications: [],

      login: (user, token) => set({ user, token }),

      logout: () => set({ user: null, token: null }),

      addNotification: (type, message, duration = 3000) => {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
        set((state) => ({
          notifications: [...state.notifications, { id, type, message, duration }],
        }))
        if (duration > 0) {
          setTimeout(() => {
            set((state) => ({
              notifications: state.notifications.filter((n) => n.id !== id),
            }))
          }, duration)
        }
      },

      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
)
