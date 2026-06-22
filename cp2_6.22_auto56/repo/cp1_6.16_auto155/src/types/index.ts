export enum TerrainType {
  GRASSLAND = 'grassland',
  FOREST = 'forest',
  MOUNTAIN = 'mountain',
  WATER = 'water',
}

export enum EncounterType {
  COMBAT = 'combat',
  TRADE = 'trade',
  DISCOVERY = 'discovery',
}

export interface TerrainCell {
  x: number
  y: number
  type: TerrainType
  elevation: number
  isRiver: boolean
}

export interface MapData {
  width: number
  height: number
  cells: TerrainCell[][]
  seed: number
}

export interface PathPoint {
  x: number
  y: number
}

export interface EncounterEvent {
  id: string
  x: number
  y: number
  type: EncounterType
  title: string
  description: string
  actions: string[]
  note: string
  timestamp: number
}

export interface RippleEffect {
  x: number
  y: number
  startTime: number
}

export interface TooltipData {
  x: number
  y: number
  text: string
  visible: boolean
  fadeStart: number
}

export interface GameState {
  seed: number
  mapSize: number
  mapData: MapData | null
  anchorPoint: PathPoint | null
  route: PathPoint[]
  encounters: EncounterEvent[]
  selectedEncounterId: string | null
  scale: number
  offsetX: number
  offsetY: number
  ripples: RippleEffect[]
  tooltip: TooltipData
  lastFrame: number
  generateMap: (seed: number, size: number) => void
  setMapData: (data: MapData) => void
  setAnchorPoint: (point: PathPoint | null) => void
  setRoute: (route: PathPoint[]) => void
  addEncounters: (encounters: EncounterEvent[]) => void
  setSelectedEncounter: (id: string | null) => void
  updateEncounterNote: (id: string, note: string) => void
  setScale: (scale: number) => void
  setOffset: (x: number, y: number) => void
  addRipple: (x: number, y: number) => void
  removeOldRipples: () => void
  setTooltip: (tooltip: Partial<TooltipData>) => void
  setLastFrame: (frame: number) => void
  exportEncountersJSON: () => void
}
