import { create } from 'zustand'

export interface StarInfo {
  name: string
  commonName?: string
  position: [number, number, number]
  spectralType: 'O' | 'B' | 'A' | 'F' | 'G' | 'K' | 'M'
  brightness: number
  distance: string
}

export interface Constellation {
  id: string
  name: string
  latinName: string
  symbol: string
  stars: StarInfo[]
  myth: string
}

export type Vec3 = [number, number, number]

interface StarStore {
  constellations: Constellation[]
  constellationsLoaded: boolean

  selectedStarGlobalIndex: number | null
  selectedConstellationId: string | null
  selectedStarWorldPos: Vec3 | null

  isPanelVisible: boolean
  isSidebarOpen: boolean
  scrollSpeed: number

  searchTerm: string

  flyToTarget: Vec3 | null
  flyToLookAt: Vec3 | null
  isFlying: boolean

  pulseTrigger: number
  blinkStarIndex: number | null
  blinkTrigger: number

  rayFrom: Vec3 | null
  rayTrigger: number

  loadConstellations: () => Promise<void>

  setSelectedStar: (globalIndex: number, worldPos: Vec3) => void
  clearSelectedStar: () => void

  setPanelVisible: (visible: boolean) => void
  toggleSidebar: () => void
  setScrollSpeed: (speed: number) => void
  setSearchTerm: (term: string) => void

  findStarByName: (name: string) => { globalIndex: number; constellation: Constellation; starIdx: number } | null
  searchAndFly: (starName: string) => boolean
  flyToConstellation: (constellationId: string) => void

  setFlyComplete: () => void

  triggerBlink: (globalIndex: number) => void
  clearBlink: () => void
  triggerPulse: () => void
  triggerRay: (from: Vec3) => void

  closePanel: () => void
}

let globalStarIndexCounter = 0

export const useStarStore = create<StarStore>((set, get) => ({
  constellations: [],
  constellationsLoaded: false,

  selectedStarGlobalIndex: null,
  selectedConstellationId: null,
  selectedStarWorldPos: null,

  isPanelVisible: false,
  isSidebarOpen: true,
  scrollSpeed: 1.5,

  searchTerm: '',

  flyToTarget: null,
  flyToLookAt: null,
  isFlying: false,

  pulseTrigger: 0,
  blinkStarIndex: null,
  blinkTrigger: 0,

  rayFrom: null,
  rayTrigger: 0,

  loadConstellations: async () => {
    try {
      const res = await fetch('/data/constellations.json')
      const data = (await res.json()) as Constellation[]
      globalStarIndexCounter = 0
      set({ constellations: data, constellationsLoaded: true })
    } catch (err) {
      console.error('Failed to load constellations:', err)
    }
  },

  setSelectedStar: (globalIndex, worldPos) => {
    const { constellations } = get()
    let idx = 0
    let foundConstellationId: string | null = null
    for (const c of constellations) {
      for (let i = 0; i < c.stars.length; i++) {
        if (idx === globalIndex) {
          foundConstellationId = c.id
          break
        }
        idx++
      }
      if (foundConstellationId) break
    }
    set({
      selectedStarGlobalIndex: globalIndex,
      selectedConstellationId: foundConstellationId,
      selectedStarWorldPos: worldPos,
      isPanelVisible: true,
      pulseTrigger: get().pulseTrigger + 1,
      rayFrom: worldPos,
      rayTrigger: get().rayTrigger + 1,
    })
  },

  clearSelectedStar: () => {
    set({
      selectedStarGlobalIndex: null,
      selectedConstellationId: null,
      selectedStarWorldPos: null,
    })
  },

  setPanelVisible: (visible) => set({ isPanelVisible: visible }),
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  setScrollSpeed: (speed) => set({ scrollSpeed: speed }),
  setSearchTerm: (term) => set({ searchTerm: term }),

  findStarByName: (name) => {
    const { constellations } = get()
    const lower = name.trim().toLowerCase()
    if (!lower) return null
    let globalIdx = 0
    for (const c of constellations) {
      for (let i = 0; i < c.stars.length; i++) {
        const s = c.stars[i]
        if (
          s.name.toLowerCase() === lower ||
          (s.commonName && s.commonName === name.trim())
        ) {
          return { globalIndex: globalIdx, constellation: c, starIdx: i }
        }
        globalIdx++
      }
    }
    return null
  },

  searchAndFly: (starName) => {
    const result = get().findStarByName(starName)
    if (!result) return false
    const { globalIndex, constellation, starIdx } = result
    const star = constellation.stars[starIdx]
    const [theta, phi, radius] = star.position
    const wx = radius * Math.sin(phi) * Math.cos(theta)
    const wy = radius * Math.cos(phi)
    const wz = radius * Math.sin(phi) * Math.sin(theta)
    const worldPos: Vec3 = [wx, wy, wz]
    const camDist = 4.5
    const nx = wx / radius
    const ny = wy / radius
    const nz = wz / radius
    const cameraPos: Vec3 = [
      wx - nx * camDist,
      Math.max(wy - ny * camDist, 0.8),
      wz - nz * camDist,
    ]
    set({
      flyToTarget: cameraPos,
      flyToLookAt: worldPos,
      isFlying: true,
      blinkStarIndex: globalIndex,
      blinkTrigger: get().blinkTrigger + 1,
    })
    return true
  },

  flyToConstellation: (constellationId) => {
    const { constellations } = get()
    const c = constellations.find((x) => x.id === constellationId)
    if (!c || c.stars.length === 0) return
    const star = c.stars[0]
    get().searchAndFly(star.name)
  },

  setFlyComplete: () => {
    const state = get()
    const { blinkStarIndex, flyToLookAt } = state
    if (blinkStarIndex !== null && flyToLookAt) {
      state.setSelectedStar(blinkStarIndex, flyToLookAt)
    }
    set({ isFlying: false, flyToTarget: null, flyToLookAt: null })
  },

  triggerBlink: (globalIndex) => {
    set({ blinkStarIndex: globalIndex, blinkTrigger: get().blinkTrigger + 1 })
  },

  clearBlink: () => set({ blinkStarIndex: null }),

  triggerPulse: () => set((s) => ({ pulseTrigger: s.pulseTrigger + 1 })),

  triggerRay: (from) =>
    set((s) => ({ rayFrom: from, rayTrigger: s.rayTrigger + 1 })),

  closePanel: () => {
    set({
      isPanelVisible: false,
      selectedStarGlobalIndex: null,
      selectedConstellationId: null,
      selectedStarWorldPos: null,
      rayFrom: null,
    })
  },
}))
