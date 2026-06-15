import { create } from 'zustand'
import type { Teacher, Room, Game, WSMessage } from '../../shared/types'

interface Notification {
  id: string
  message: string
  type: 'info' | 'success' | 'error'
}

interface GameState {
  currentUser: Teacher | null
  currentRoom: Room | null
  games: Game[]
  notifications: Notification[]
  wsConnection: WebSocket | null
  login: (user: Teacher) => void
  logout: () => void
  setRoom: (room: Room | null) => void
  addNotification: (message: string, type: Notification['type']) => void
  setGames: (games: Game[]) => void
  setWs: (ws: WebSocket | null) => void
  sendWsMessage: (msg: WSMessage) => void
}

export const useGameStore = create<GameState>((set, get) => ({
  currentUser: null,
  currentRoom: null,
  games: [],
  notifications: [],
  wsConnection: null,

  login: (user) => set({ currentUser: user }),

  logout: () => {
    const ws = get().wsConnection
    if (ws) ws.close()
    set({ currentUser: null, currentRoom: null, wsConnection: null })
  },

  setRoom: (room) => set({ currentRoom: room }),

  addNotification: (message, type) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2)
    set((state) => ({
      notifications: [...state.notifications, { id, message, type }],
    }))
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }))
    }, 3000)
  },

  setGames: (games) => set({ games }),

  setWs: (ws) => set({ wsConnection: ws }),

  sendWsMessage: (msg) => {
    const ws = get().wsConnection
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg))
    }
  },
}))
