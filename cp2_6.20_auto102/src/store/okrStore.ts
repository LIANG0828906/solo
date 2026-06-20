import { create } from 'zustand'
import { io, Socket } from 'socket.io-client'
import * as okrAPI from '../api/okrAPI'

export interface KeyResult {
  id: string
  name: string
  targetValue: number
  currentValue: number
  weight: number
  objectiveId: string
}

export interface Objective {
  id: string
  name: string
  level: 'company' | 'department' | 'individual'
  parentId: string | null
  progress: number
  keyResults: KeyResult[]
}

export interface Milestone {
  id: string
  name: string
  startMonth: number
  endMonth: number
  progress: number
}

export interface Toast {
  id: string
  message: string
  timestamp: number
}

interface OKRStore {
  objectives: Objective[]
  milestones: Milestone[]
  selectedObjective: Objective | null
  toasts: Toast[]
  socket: Socket | null
  setObjectives: (objectives: Objective[]) => void
  setSelectedObjective: (objective: Objective | null) => void
  fetchObjectives: () => Promise<void>
  createObjective: (data: Partial<Objective>) => Promise<void>
  updateObjective: (id: string, data: Partial<Objective>) => Promise<void>
  deleteObjective: (id: string) => Promise<void>
  moveObjective: (id: string, parentId: string | null) => Promise<void>
  fetchMilestones: () => Promise<void>
  updateMilestone: (id: string, progress: number) => Promise<void>
  addToast: (message: string) => void
  removeToast: (id: string) => void
  initSocket: () => void
  disconnectSocket: () => void
  broadcastUpdate: (event: string, data: any) => void
}

let toastIdCounter = 0

export const useOKRStore = create<OKRStore>((set, get) => ({
  objectives: [],
  milestones: [],
  selectedObjective: null,
  toasts: [],
  socket: null,

  setObjectives: (objectives) => set({ objectives }),
  setSelectedObjective: (objective) => set({ selectedObjective: objective }),

  fetchObjectives: async () => {
    const data = await okrAPI.getObjectives()
    set({ objectives: data })
  },

  createObjective: async (data) => {
    await okrAPI.createObjective(data)
  },

  updateObjective: async (id, data) => {
    await okrAPI.updateObjective(id, data)
  },

  deleteObjective: async (id) => {
    await okrAPI.deleteObjective(id)
  },

  moveObjective: async (id, parentId) => {
    await okrAPI.updateObjective(id, { parentId })
  },

  broadcastUpdate: (event: string, data: any) => {
    const { socket } = get()
    if (socket) {
      socket.emit('message', JSON.stringify({
        event,
        data,
        user: '当前用户'
      }))
    }
  },

  fetchMilestones: async () => {
    const data = await okrAPI.getMilestones()
    set({ milestones: data })
  },

  updateMilestone: async (id, progress) => {
    await okrAPI.updateMilestone(id, progress)
  },

  addToast: (message) => {
    const id = `toast-${++toastIdCounter}`
    const toast: Toast = { id, message, timestamp: Date.now() }
    set((state) => ({ toasts: [...state.toasts, toast] }))
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, 3000)
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
  },

  initSocket: () => {
    const socket = io({ transports: ['websocket'] })
    socket.on('connect', () => {
      console.log('WebSocket connected')
    })
    socket.on('message', (data: any) => {
      try {
        const parsed = typeof data === 'string' ? JSON.parse(data) : data
        const store = get()
        if (parsed.event === 'objective_updated' || parsed.event === 'objective_created' || parsed.event === 'objective_deleted') {
          store.fetchObjectives()
          const userName = parsed.user || '某用户'
          const objName = parsed.data?.name || '目标'
          const actionMap: Record<string, string> = {
            objective_updated: '更新了',
            objective_created: '创建了',
            objective_deleted: '删除了',
          }
          store.addToast(`${userName}刚刚${actionMap[parsed.event] || '修改了'}目标：${objName}`)
        }
        if (parsed.event === 'milestone_updated') {
          store.fetchMilestones()
        }
      } catch (e) {}
    })
    socket.on('disconnect', () => {
      console.log('WebSocket disconnected')
    })
    set({ socket })
  },

  disconnectSocket: () => {
    const { socket } = get()
    if (socket) {
      socket.disconnect()
      set({ socket: null })
    }
  },
}))
