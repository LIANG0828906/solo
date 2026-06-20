import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { TimeOfDay, Weather, FurnitureType, FurnitureItem } from './types'
import { FURNITURE_DIMS, ROOM_WIDTH, ROOM_DEPTH } from './types'

interface AppState {
  furniture: FurnitureItem[]
  timeOfDay: TimeOfDay
  weather: Weather
  isRoaming: boolean
  placingType: FurnitureType | null
  ghostPosition: [number, number, number] | null
  isColliding: boolean
  isMobileDrawerOpen: boolean
  fps: number
  shadowDegraded: boolean

  addFurniture: (type: FurnitureType, position: [number, number, number]) => void
  removeFurniture: (id: string) => void
  setTimeOfDay: (time: TimeOfDay) => void
  setWeather: (weather: Weather) => void
  setIsRoaming: (roaming: boolean) => void
  setPlacingType: (type: FurnitureType | null) => void
  setGhostPosition: (pos: [number, number, number] | null) => void
  setIsColliding: (colliding: boolean) => void
  toggleMobileDrawer: () => void
  setFps: (fps: number) => void
  setShadowDegraded: (degraded: boolean) => void
  loadScheme: (scheme: { furniture: FurnitureItem[]; timeOfDay: TimeOfDay; weather: Weather }) => void
  clearFurniture: () => void
  checkCollision: (type: FurnitureType, position: [number, number, number], excludeId?: string) => boolean
  isWithinRoom: (type: FurnitureType, position: [number, number, number]) => boolean
}

function checkAABBCollision(
  pos1: [number, number, number],
  dims1: { width: number; depth: number },
  pos2: [number, number, number],
  dims2: { width: number; depth: number }
): boolean {
  const halfW1 = dims1.width / 2
  const halfD1 = dims1.depth / 2
  const halfW2 = dims2.width / 2
  const halfD2 = dims2.depth / 2
  return (
    Math.abs(pos1[0] - pos2[0]) < halfW1 + halfW2 &&
    Math.abs(pos1[2] - pos2[2]) < halfD1 + halfD2
  )
}

export const useStore = create<AppState>((set, get) => ({
  furniture: [],
  timeOfDay: 'noon',
  weather: 'sunny',
  isRoaming: false,
  placingType: null,
  ghostPosition: null,
  isColliding: false,
  isMobileDrawerOpen: false,
  fps: 60,
  shadowDegraded: false,

  addFurniture: (type, position) => {
    const state = get()
    if (state.checkCollision(type, position)) return
    if (!state.isWithinRoom(type, position)) return
    const item: FurnitureItem = {
      id: uuidv4(),
      type,
      position,
      rotation: 0,
    }
    set({ furniture: [...state.furniture, item], placingType: null, ghostPosition: null })
  },

  removeFurniture: (id) => {
    set((state) => ({ furniture: state.furniture.filter((f) => f.id !== id) }))
  },

  setTimeOfDay: (time) => set({ timeOfDay: time }),
  setWeather: (weather) => set({ weather }),
  setIsRoaming: (roaming) => set({ isRoaming: roaming }),
  setPlacingType: (type) => set({ placingType: type, ghostPosition: null, isColliding: false }),
  setGhostPosition: (pos) => set({ ghostPosition: pos }),
  setIsColliding: (colliding) => set({ isColliding: colliding }),
  toggleMobileDrawer: () => set((state) => ({ isMobileDrawerOpen: !state.isMobileDrawerOpen })),
  setFps: (fps) => set({ fps }),
  setShadowDegraded: (degraded) => set({ shadowDegraded: degraded }),

  loadScheme: (scheme) => {
    set({
      furniture: scheme.furniture,
      timeOfDay: scheme.timeOfDay,
      weather: scheme.weather,
    })
  },

  clearFurniture: () => set({ furniture: [] }),

  checkCollision: (type, position, excludeId) => {
    const dims = FURNITURE_DIMS[type]
    const items = get().furniture.filter((f) => f.id !== excludeId)
    for (const item of items) {
      const itemDims = FURNITURE_DIMS[item.type]
      if (checkAABBCollision(position, dims, item.position, itemDims)) {
        return true
      }
    }
    return false
  },

  isWithinRoom: (type, position) => {
    const dims = FURNITURE_DIMS[type]
    const halfW = dims.width / 2
    const halfD = dims.depth / 2
    return (
      position[0] - halfW >= -ROOM_WIDTH / 2 + 0.05 &&
      position[0] + halfW <= ROOM_WIDTH / 2 - 0.05 &&
      position[2] - halfD >= -ROOM_DEPTH / 2 + 0.05 &&
      position[2] + halfD <= ROOM_DEPTH / 2 - 0.05
    )
  },
}))
