import { create } from 'zustand'
import { User, Pet, GardenEvent, LeaderboardEntry, Gift, WSMessage } from '../../types'
import apiClient from '../api/apiClient'
import { io, Socket } from 'socket.io-client'

interface UserState {
  user: User | null
  gardenPets: Pet[]
  gardenEvents: GardenEvent[]
  leaderboard: LeaderboardEntry[]
  gifts: Gift[]
  socket: Socket | null
  isLoading: boolean
  error: string | null

  initSocket: () => void
  disconnectSocket: () => void
  fetchUser: () => Promise<void>
  adoptPet: (type: Pet['type'], color: Pet['color'], name: string) => Promise<void>
  feedPet: () => Promise<number>
  playPet: () => Promise<number>
  cleanPet: () => Promise<number>
  movePet: (x: number, y: number) => void
  sendGardenEvent: (event: Omit<GardenEvent, 'id' | 'timestamp'>) => void
  fetchLeaderboard: () => Promise<void>
  fetchGifts: () => Promise<void>
  buyGift: (giftId: string) => Promise<boolean>
  sendGift: (toPetId: string, giftId: string) => void
  claimDailyReward: () => Promise<void>
  updatePetStats: (pet: Partial<Pet>) => void
}

const useUserStore = create<UserState>((set, get) => ({
  user: null,
  gardenPets: [],
  gardenEvents: [],
  leaderboard: [],
  gifts: [],
  socket: null,
  isLoading: false,
  error: null,

  initSocket: () => {
    if (get().socket) return

    const userId = localStorage.getItem('userId') || 'user_' + Math.random().toString(36).substr(2, 9)
    localStorage.setItem('userId', userId)

    const socket = io({
      path: '/ws/socket.io',
      transports: ['websocket', 'polling'],
      query: { userId },
    })

    socket.on('connect', () => {
      console.log('WebSocket connected')
    })

    socket.on('message', (msg: WSMessage) => {
      switch (msg.type) {
        case 'pet_update':
          get().updatePetStats(msg.payload)
          break
        case 'pet_moved': {
          const movedPet = msg.payload as Pet
          set((state) => ({
            gardenPets: state.gardenPets.map((p) =>
              p.id === movedPet.id ? { ...p, position: movedPet.position } : p
            ),
          }))
          break
        }
        case 'garden_event': {
          const event = msg.payload as GardenEvent
          set((state) => ({
            gardenEvents: [...state.gardenEvents.slice(-20), event],
          }))
          setTimeout(() => {
            set((state) => ({
              gardenEvents: state.gardenEvents.filter((e) => e.id !== event.id),
            }))
          }, 3000)
          break
        }
        case 'gift_received':
          console.log('Gift received:', msg.payload)
          break
        case 'user_joined': {
          const newPet = msg.payload as Pet
          set((state) => ({
            gardenPets: [...state.gardenPets, newPet],
          }))
          break
        }
        case 'user_left': {
          const leftPetId = msg.payload as string
          set((state) => ({
            gardenPets: state.gardenPets.filter((p) => p.id !== leftPetId),
          }))
          break
        }
      }
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

  fetchUser: async () => {
    set({ isLoading: true })
    try {
      const userId = localStorage.getItem('userId') || 'user_' + Math.random().toString(36).substr(2, 9)
      localStorage.setItem('userId', userId)
      const data = await apiClient.get(`/users/${userId}`)
      set({ user: data as unknown as User, isLoading: false })
    } catch (error) {
      set({ error: 'Failed to fetch user', isLoading: false })
    }
  },

  adoptPet: async (type, color, name) => {
    set({ isLoading: true })
    try {
      const userId = localStorage.getItem('userId')!
      const data = await apiClient.post(`/users/${userId}/pet`, { type, color, name })
      set({ user: data as unknown as User, isLoading: false })
    } catch (error) {
      set({ error: 'Failed to adopt pet', isLoading: false })
    }
  },

  feedPet: async () => {
    const userId = localStorage.getItem('userId')!
    const data = await apiClient.post(`/users/${userId}/pet/feed`)
    return (data as unknown as { gained: number }).gained
  },

  playPet: async () => {
    const userId = localStorage.getItem('userId')!
    const data = await apiClient.post(`/users/${userId}/pet/play`)
    return (data as unknown as { gained: number }).gained
  },

  cleanPet: async () => {
    const userId = localStorage.getItem('userId')!
    const data = await apiClient.post(`/users/${userId}/pet/clean`)
    return (data as unknown as { gained: number }).gained
  },

  movePet: (x, y) => {
    const { socket, user } = get()
    if (socket && user?.pet) {
      const updatedPet = { ...user.pet, position: { x, y } }
      set({ user: { ...user, pet: updatedPet } })
      socket.emit('move', { petId: user.pet.id, position: { x, y } })
    }
  },

  sendGardenEvent: (event) => {
    const { socket } = get()
    if (socket) {
      socket.emit('garden_event', event)
    }
  },

  fetchLeaderboard: async () => {
    try {
      const data = await apiClient.get('/leaderboard')
      set({ leaderboard: data as unknown as LeaderboardEntry[] })
    } catch (error) {
      set({ error: 'Failed to fetch leaderboard' })
    }
  },

  fetchGifts: async () => {
    try {
      const data = await apiClient.get('/gifts')
      set({ gifts: data as unknown as Gift[] })
    } catch (error) {
      set({ error: 'Failed to fetch gifts' })
    }
  },

  buyGift: async (giftId) => {
    try {
      const userId = localStorage.getItem('userId')!
      const data = await apiClient.post(`/users/${userId}/inventory`, { giftId })
      set({ user: data as unknown as User })
      return true
    } catch (error) {
      set({ error: 'Failed to buy gift' })
      return false
    }
  },

  sendGift: (toPetId, giftId) => {
    const { socket, user } = get()
    if (socket && user?.pet) {
      socket.emit('send_gift', { fromPetId: user.pet.id, toPetId, giftId })
    }
  },

  claimDailyReward: async () => {
    try {
      const userId = localStorage.getItem('userId')!
      const data = await apiClient.post(`/users/${userId}/daily`)
      set({ user: data as unknown as User })
    } catch (error) {
      set({ error: 'Failed to claim daily reward' })
    }
  },

  updatePetStats: (petUpdates) => {
    set((state) => {
      if (!state.user?.pet) return state
      const updatedPet = { ...state.user.pet, ...petUpdates }
      if (state.user.pet.id === petUpdates.id) {
        return { user: { ...state.user, pet: updatedPet } }
      }
      return {
        gardenPets: state.gardenPets.map((p) =>
          p.id === petUpdates.id ? { ...p, ...petUpdates } : p
        ),
      }
    })
  },
}))

export default useUserStore
