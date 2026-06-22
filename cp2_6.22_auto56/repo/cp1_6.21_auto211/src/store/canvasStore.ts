import { create } from 'zustand'

export type Point = {
  x: number
  y: number
}

export type Stroke = {
  id: string
  points: Point[]
  color: string
  width: number
  playerId: string
  playerName: string
}

export type Player = {
  id: string
  name: string
  x: number
  y: number
  color: string
}

export type SavedCanvas = {
  id: string
  name: string
  thumbnail: string
  data: string
  updatedAt: string
}

interface CanvasState {
  socket: WebSocket | null
  setSocket: (socket: WebSocket | null) => void
  roomId: string
  setRoomId: (roomId: string) => void
  players: Player[]
  setPlayers: (players: Player[]) => void
  addPlayer: (player: Player) => void
  removePlayer: (playerId: string) => void
  updatePlayerPosition: (playerId: string, x: number, y: number) => void
  strokes: Stroke[]
  addStroke: (stroke: Stroke) => void
  remoteStrokes: Stroke[]
  addRemoteStroke: (stroke: Stroke) => void
  savedCanvases: SavedCanvas[]
  setSavedCanvases: (canvases: SavedCanvas[]) => void
  addSavedCanvas: (canvas: SavedCanvas) => void
  notifications: { id: string; message: string; type: 'success' | 'error' | 'info' }[]
  addNotification: (message: string, type?: 'success' | 'error' | 'info') => void
  removeNotification: (id: string) => void
}

export const useCanvasStore = create<CanvasState>((set) => ({
  socket: null,
  setSocket: (socket) => set({ socket }),
  roomId: '',
  setRoomId: (roomId) => set({ roomId }),
  players: [],
  setPlayers: (players) => set({ players }),
  addPlayer: (player) =>
    set((state) => ({
      players: state.players.find((p) => p.id === player.id)
        ? state.players
        : [...state.players, player],
    })),
  removePlayer: (playerId) =>
    set((state) => ({
      players: state.players.filter((p) => p.id !== playerId),
    })),
  updatePlayerPosition: (playerId, x, y) =>
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, x, y } : p
      ),
    })),
  strokes: [],
  addStroke: (stroke) =>
    set((state) => ({ strokes: [...state.strokes, stroke] })),
  remoteStrokes: [],
  addRemoteStroke: (stroke) =>
    set((state) => {
      const newStrokes = [...state.remoteStrokes, stroke]
      if (newStrokes.length > 10) {
        newStrokes.shift()
      }
      return { remoteStrokes: newStrokes }
    }),
  savedCanvases: [],
  setSavedCanvases: (canvases) => set({ savedCanvases: canvases }),
  addSavedCanvas: (canvas) =>
    set((state) => ({
      savedCanvases: [canvas, ...state.savedCanvases.filter((c) => c.id !== canvas.id)],
    })),
  notifications: [],
  addNotification: (message, type = 'info') => {
    const id = Math.random().toString(36).slice(2)
    set((state) => ({
      notifications: [...state.notifications, { id, message, type }],
    }))
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }))
    }, 2000)
  },
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}))
