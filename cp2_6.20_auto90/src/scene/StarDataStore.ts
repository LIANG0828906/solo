import { create } from 'zustand'
import starCatalogData from '../data/starCatalog.json'
import constellationData from '../data/constellation.json'
import planetOrbitData from '../data/planetOrbit.json'

export interface MainStar {
  name: string
  nameEn: string
}

export interface Star {
  id: number
  name: string
  nameEn: string
  constellationId: string
  constellation?: string
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
  bestSeason: string
  areaRank: number
  mainStars: MainStar[]
  lines: number[][]
  lineVertices: number[][][]
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
  initialAngle: number
  inclination: number
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

const processStarData = (raw: any[]): Star[] => {
  return raw
    .filter(item => item && typeof item.id === 'number')
    .map(item => ({
      id: item.id,
      name: item.name || '',
      nameEn: item.nameEn || '',
      constellationId: item.constellationId || '',
      constellation: item.constellation,
      ra: item.ra || 0,
      dec: item.dec || 0,
      magnitude: item.magnitude || 0,
      spectralType: item.spectralType || 'G',
      distance: item.distance || 0,
    }))
}

const processConstellationData = (raw: any[]): Constellation[] => {
  return raw
    .filter(item => item && typeof item.id === 'string')
    .map(item => ({
      id: item.id,
      name: item.name || '',
      nameEn: item.nameEn || '',
      season: item.season || '',
      bestSeason: item.bestSeason || item.season || '',
      areaRank: item.areaRank || 0,
      mainStars: Array.isArray(item.mainStars) && typeof item.mainStars[0] === 'object'
        ? item.mainStars.map((s: any) => ({ name: s.name || '', nameEn: s.nameEn || '' }))
        : (item.mainStars || []).map((s: string) => ({ name: s, nameEn: s })),
      lines: item.lines || [],
      lineVertices: item.lineVertices || [],
    }))
}

const processPlanetData = (raw: any[]): Planet[] => {
  return raw
    .filter(item => item && typeof item.id === 'string')
    .map(item => ({
      id: item.id,
      name: item.name || '',
      nameEn: item.nameEn || '',
      color: item.color || '#ffffff',
      semiMajorAxis: item.semiMajorAxis || 1,
      eccentricity: item.eccentricity || 0,
      orbitalPeriod: item.orbitalPeriod || 365,
      distanceFromSun: item.distanceFromSun || '',
      moons: item.moons || 0,
      isInnerPlanet: item.isInnerPlanet || false,
      initialAngle: item.initialAngle || 0,
      inclination: item.inclination || 0,
    }))
}

export const useStarStore = create<StarStore>((set, get) => ({
  stars: processStarData(starCatalogData as any[]),
  constellations: processConstellationData(constellationData as any[]),
  planets: processPlanetData(planetOrbitData as any[]),
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
        (s.name && s.name.toLowerCase().includes(lowerQuery)) ||
        (s.nameEn && s.nameEn.toLowerCase().includes(lowerQuery))
    )
    return star || null
  },

  searchConstellation: (query) => {
    if (!query.trim()) return null
    const lowerQuery = query.toLowerCase()
    const constellation = get().constellations.find(
      (c) =>
        (c.name && c.name.toLowerCase().includes(lowerQuery)) ||
        (c.nameEn && c.nameEn.toLowerCase().includes(lowerQuery)) ||
        (c.id && c.id.toLowerCase().includes(lowerQuery))
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
