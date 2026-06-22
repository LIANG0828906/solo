export interface PlanetData {
  id: string
  name: string
  nameEn: string
  color: string
  secondaryColor?: string
  hasContinents?: boolean
  diameter: number
  mass: number
  orbitalPeriod: number
  moonCount: number
  relativeRadius: number
  relativeDistance: number
}

export type ViewMode = 'size' | 'distance'

export interface StoreState {
  planets: PlanetData[]
  selectedPlanetId: string | null
  viewMode: ViewMode
  showOrbits: boolean
  cameraTarget: [number, number, number]
  selectPlanet: (id: string | null) => void
  setViewMode: (mode: ViewMode) => void
  toggleOrbits: () => void
  setCameraTarget: (target: [number, number, number]) => void
}
