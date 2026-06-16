import { create } from 'zustand'

export type Region = 'pacific' | 'atlantic' | 'indian' | 'arctic' | 'antarctic'
export type PlasticType = 'fiber' | 'fragment' | 'film'
export type DepthLayer = 'surface' | 'middle' | 'deep' | 'abyssal' | 'trench'

export interface Microplastic {
  id: string
  type: PlasticType
  size: number
  depth: number
  position: { x: number; y: number; z: number }
  originDepth: number
  velocity: { x: number; y: number; z: number }
}

export interface CoralReelState {
  currentDepth: number
  targetDepth: number
  selectedRegion: Region
  currentYear: number
  currentMonth: number
  timeStep: number
  selectedParticle: Microplastic | null
  trackingParticle: Microplastic | null
  trackingActive: boolean
  filterTypes: PlasticType[]
  filteredParticleCount: number
  densityHistory: number[]
  trackHistory: number[]
  currentTrajectory: { x: number; y: number; z: number }[]
  menuCollapsed: boolean
  guideVisible: boolean
  cameraTarget: { x: number; y: number; z: number }
  particles: Microplastic[]
  setCurrentDepth: (depth: number) => void
  setTargetDepth: (depth: number) => void
  setSelectedRegion: (region: Region) => void
  setTimeStep: (year: number, month: number) => void
  setSelectedParticle: (particle: Microplastic | null) => void
  setTrackingParticle: (particle: Microplastic | null) => void
  setTrackingActive: (active: boolean) => void
  toggleFilterType: (type: PlasticType) => void
  setFilteredParticleCount: (count: number) => void
  updateDensityHistory: (density: number) => void
  updateTrackHistory: (count: number) => void
  clearTrajectory: () => void
  addTrajectoryPoint: (point: { x: number; y: number; z: number }) => void
  setMenuCollapsed: (collapsed: boolean) => void
  setGuideVisible: (visible: boolean) => void
  setCameraTarget: (pos: { x: number; y: number; z: number }) => void
  setParticles: (particles: Microplastic[]) => void
  getDepthLayer: () => DepthLayer
}

const DEPTH_LAYERS: Record<DepthLayer, { min: number; max: number; name: string }> = {
  surface: { min: 0, max: 200, name: '表层' },
  middle: { min: 200, max: 1000, name: '中层' },
  deep: { min: 1000, max: 3000, name: '深层' },
  abyssal: { min: 3000, max: 5000, name: '深海' },
  trench: { min: 5000, max: 10000, name: '海沟' }
}

export const REGIONS: Record<Region, { name: string; center: { lat: number; lon: number } }> = {
  pacific: { name: '北太平洋', center: { lat: 35, lon: -160 } },
  atlantic: { name: '南大西洋', center: { lat: -15, lon: -15 } },
  indian: { name: '印度洋', center: { lat: -10, lon: 75 } },
  arctic: { name: '北极', center: { lat: 75, lon: 0 } },
  antarctic: { name: '南极', center: { lat: -75, lon: 0 } }
}

export const PLASTIC_COLORS: Record<PlasticType, string> = {
  fiber: '#E74C3C',
  fragment: '#F1C40F',
  film: '#ECF0F1'
}

export const PLASTIC_NAMES: Record<PlasticType, string> = {
  fiber: '纤维',
  fragment: '碎片',
  film: '薄膜'
}

function getDepthLayerFromDepth(depth: number): DepthLayer {
  if (depth <= 200) return 'surface'
  if (depth <= 1000) return 'middle'
  if (depth <= 3000) return 'deep'
  if (depth <= 5000) return 'abyssal'
  return 'trench'
}

export const useCoralReelStore = create<CoralReelState>((set, get) => ({
  currentDepth: 0,
  targetDepth: 0,
  selectedRegion: 'pacific',
  currentYear: 2024,
  currentMonth: 6,
  timeStep: 0,
  selectedParticle: null,
  trackingParticle: null,
  trackingActive: false,
  filterTypes: ['fiber', 'fragment', 'film'],
  filteredParticleCount: 0,
  densityHistory: [],
  trackHistory: [],
  currentTrajectory: [],
  menuCollapsed: false,
  guideVisible: true,
  cameraTarget: { x: 0, y: 0, z: 20 },
  particles: [],

  setCurrentDepth: (depth) => set({ currentDepth: depth }),
  setTargetDepth: (depth) => set({ targetDepth: depth }),
  setSelectedRegion: (region) => set({ selectedRegion: region }),
  setTimeStep: (year, month) => {
    const timeStep = (year - 2010) * 12 + month
    set({ currentYear: year, currentMonth: month, timeStep })
  },
  setSelectedParticle: (particle) => set({ selectedParticle: particle }),
  setTrackingParticle: (particle) => set({ trackingParticle: particle }),
  setTrackingActive: (active) => set({ trackingActive: active }),
  toggleFilterType: (type) => {
    const current = get().filterTypes
    if (current.includes(type)) {
      set({ filterTypes: current.filter(t => t !== type) })
    } else {
      set({ filterTypes: [...current, type] })
    }
  },
  setFilteredParticleCount: (count) => set({ filteredParticleCount: count }),
  updateDensityHistory: (density) => {
    const history = [...get().densityHistory.slice(-59)]
    history.push(density)
    set({ densityHistory: history })
  },
  updateTrackHistory: (count) => {
    const history = [...get().trackHistory.slice(-59)]
    history.push(count)
    set({ trackHistory: history })
  },
  clearTrajectory: () => set({ currentTrajectory: [] }),
  addTrajectoryPoint: (point) => {
    const traj = [...get().currentTrajectory.slice(-499)]
    traj.push(point)
    set({ currentTrajectory: traj })
  },
  setMenuCollapsed: (collapsed) => set({ menuCollapsed: collapsed }),
  setGuideVisible: (visible) => set({ guideVisible: visible }),
  setCameraTarget: (pos) => set({ cameraTarget: pos }),
  setParticles: (particles) => set({ particles: particles }),

  getDepthLayer: () => getDepthLayerFromDepth(get().currentDepth)
}))

export { DEPTH_LAYERS }
