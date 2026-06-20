import { create } from 'zustand'
import starCatalogData from '../data/starCatalog.json'
import constellationData from '../data/constellation.json'
import planetOrbitData from '../data/planetOrbit.json'

export interface Star {
  id: number
  name: string
  nameEn: string
  constellationId: string
  ra: number
  dec: number
  magnitude: number
  spectralType: string
  distance: number
}

export interface Constellation {
  id: string
  name: string
  nameEn: string
  season: string
  areaRank: number
  mainStars: string[]
  lines: number[][]
}

export interface Planet {
  id: string
  name: string
  nameEn: string
  color: string
  semiMajorAxis: number
  eccentricity: number
  orbitalPeriod: number
  distanceFromSun: string
  moons: number
  isInnerPlanet: boolean
}

export interface FilterState {
  spectralTypes: string[]
  minMagnitude: number
  maxMagnitude: number
  minDistance: number
  maxDistance: number
}

interface StarStore {
  stars: Star[]
  constellations: Constellation[]
  planets: Planet[]
  selectedStarId: number | null
  selectedConstellationId: string | null
  selectedPlanetId: string | null
  timeSpeed: number
  showOrbits: boolean
  filters: FilterState
  searchQuery: string
  setSelectedStar: (id: number | null) => void
  setSelectedConstellation: (id: string | null) => void
  setSelectedPlanet: (id: string | null) => void
  setTimeSpeed: (speed: number) => void
  setShowOrbits: (show: boolean) => void
  setFilters: (filters: Partial<FilterState>) => void
  setSearchQuery: (query: string) => void
  searchStar: (query: string) => Star | null
  searchConstellation: (query: string) => Constellation | null
  getFilteredStars: () => Star[]
  isStarFiltered: (star: Star) => boolean
}

const SPECTRAL_COLORS: Record<string, string> = {
  O: '#9bb0ff',
  B: '#aabfff',
  A: '#cad7ff',
  F: '#f8f7ff',
  G: '#fff4ea',
  K: '#ffd2a1',
  M: '#ffcc6f',
}

export const getSpectralColor = (type: string): string => {
  return SPECTRAL_COLORS[type.charAt(0)] || '#ffffff'
}

export const useStarStore = create<StarStore>((set, get) => ({
  stars: starCatalogData as Star[],
  constellations: constellationData as Constellation[],
  planets: planetOrbitData as Planet[],
  selectedStarId: null,
  selectedConstellationId: null,
  selectedPlanetId: null,
  timeSpeed: 1,
  showOrbits: true,
  searchQuery: '',
  filters: {
    spectralTypes: [],
    minMagnitude: -2,
    maxMagnitude: 6,
    minDistance: 0,
    maxDistance: 10000,
  },

  setSelectedStar: (id) => set({ selectedStarId: id }),
  setSelectedConstellation: (id) => set({ selectedConstellationId: id }),
  setSelectedPlanet: (id) => set({ selectedPlanetId: id }),
  setTimeSpeed: (speed) => set({ timeSpeed: speed }),
  setShowOrbits: (show) => set({ showOrbits: show }),
  setFilters: (newFilters) =>
    set((state) => ({ filters: { ...state.filters, ...newFilters } })),
  setSearchQuery: (query) => set({ searchQuery: query }),

  searchStar: (query) => {
    if (!query.trim()) return null
    const lowerQuery = query.toLowerCase()
    const star = get().stars.find(
      (s) =>
        s.name.toLowerCase().includes(lowerQuery) ||
        s.nameEn.toLowerCase().includes(lowerQuery)
    )
    return star || null
  },

  searchConstellation: (query) => {
    if (!query.trim()) return null
    const lowerQuery = query.toLowerCase()
    const constellation = get().constellations.find(
      (c) =>
        c.name.toLowerCase().includes(lowerQuery) ||
        c.nameEn.toLowerCase().includes(lowerQuery) ||
        c.id.toLowerCase().includes(lowerQuery)
    )
    return constellation || null
  },

  getFilteredStars: () => {
    const { stars, filters } = get()
    return stars.filter((star) => {
      if (filters.spectralTypes.length > 0 && !filters.spectralTypes.includes(star.spectralType.charAt(0))) {
        return false
      }
      if (star.magnitude < filters.minMagnitude || star.magnitude > filters.maxMagnitude) {
        return false
      }
      if (star.distance < filters.minDistance || star.distance > filters.maxDistance) {
        return false
      }
      return true
    })
  },

  isStarFiltered: (star) => {
    const { filters } = get()
    if (filters.spectralTypes.length > 0 && !filters.spectralTypes.includes(star.spectralType.charAt(0))) {
      return true
    }
    if (star.magnitude < filters.minMagnitude || star.magnitude > filters.maxMagnitude) {
      return true
    }
    if (star.distance < filters.minDistance || star.distance > filters.maxDistance) {
      return true
    }
    return false
  },
}))
