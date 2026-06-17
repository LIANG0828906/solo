import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

export type CellType = 'green' | 'purple' | 'orange'

export interface Cell {
  id: string
  type: CellType
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  energy: number
  health: number
  isDormant: boolean
  rotation: number
  flashTimer: number
  expandTimer: number
}

export interface FoodParticle {
  id: string
  x: number
  y: number
  radius: number
  lifetime: number
  maxLifetime: number
}

export interface ToxinParticle {
  id: string
  x: number
  y: number
  radius: number
  lifetime: number
  maxLifetime: number
}

export interface ExplosionParticle {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  lifetime: number
  maxLifetime: number
  color: string
}

export interface PopulationRecord {
  time: number
  green: number
  purple: number
  orange: number
}

export interface PredationEvent {
  id: string
  time: number
}

interface SimState {
  cells: Cell[]
  foodParticles: FoodParticle[]
  toxinParticles: ToxinParticle[]
  explosionParticles: ExplosionParticle[]
  temperature: number
  populationHistory: PopulationRecord[]
  predationEvents: PredationEvent[]

  addCell: (cell: Cell) => void
  removeCell: (id: string) => void
  updateCells: (cells: Cell[]) => void

  addFood: (x: number, y: number) => void
  addToxin: (x: number, y: number) => void
  addExplosion: (x: number, y: number, color: string) => void

  setTemperature: (temp: number) => void

  recordPopulation: () => void
  recordPredation: () => void

  initializeCells: () => void
}

const DISH_RADIUS = 350
const DISH_CENTER = 350

const CELL_COLORS: Record<CellType, string> = {
  green: '#00FF88',
  purple: '#9B59B6',
  orange: '#FF8C00'
}

export const getCellColor = (type: CellType): string => CELL_COLORS[type]

const randomPositionInDish = (): { x: number; y: number } => {
  const angle = Math.random() * Math.PI * 2
  const r = Math.random() * (DISH_RADIUS - 20)
  return {
    x: DISH_CENTER + Math.cos(angle) * r,
    y: DISH_CENTER + Math.sin(angle) * r
  }
}

const createInitialCell = (type: CellType): Cell => {
  const pos = randomPositionInDish()
  return {
    id: uuidv4(),
    type,
    x: pos.x,
    y: pos.y,
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
    radius: 6 + Math.random() * 6,
    energy: 0,
    health: 100,
    isDormant: false,
    rotation: Math.random() * Math.PI * 2,
    flashTimer: 0,
    expandTimer: 0
  }
}

export const useSimStore = create<SimState>((set, get) => ({
  cells: [],
  foodParticles: [],
  toxinParticles: [],
  explosionParticles: [],
  temperature: 50,
  populationHistory: [],
  predationEvents: [],

  addCell: (cell) => set((s) => ({ cells: [...s.cells, cell] })),
  removeCell: (id) => set((s) => ({ cells: s.cells.filter((c) => c.id !== id) })),
  updateCells: (cells) => set({ cells }),

  addFood: (x, y) =>
    set((s) => ({
      foodParticles: [
        ...s.foodParticles,
        {
          id: uuidv4(),
          x,
          y,
          radius: 20,
          lifetime: 300,
          maxLifetime: 300
        }
      ]
    })),

  addToxin: (x, y) =>
    set((s) => ({
      toxinParticles: [
        ...s.toxinParticles,
        {
          id: uuidv4(),
          x,
          y,
          radius: 20,
          lifetime: 480,
          maxLifetime: 480
        }
      ]
    })),

  addExplosion: (x, y, color) => {
    const particles: ExplosionParticle[] = []
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 1 + Math.random() * 2
      particles.push({
        id: uuidv4(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        lifetime: 18,
        maxLifetime: 18,
        color
      })
    }
    set((s) => ({ explosionParticles: [...s.explosionParticles, ...particles] }))
  },

  setTemperature: (temp) => set({ temperature: temp }),

  recordPopulation: () =>
    set((s) => {
      const counts = { green: 0, purple: 0, orange: 0 }
      for (const c of s.cells) {
        if (c.health > 0) counts[c.type]++
      }
      const newRecord: PopulationRecord = {
        time: Date.now(),
        green: counts.green,
        purple: counts.purple,
        orange: counts.orange
      }
      const history = [...s.populationHistory, newRecord]
      const cutoff = Date.now() - 60000
      return { populationHistory: history.filter((r) => r.time > cutoff) }
    }),

  recordPredation: () =>
    set((s) => {
      const events = [
        ...s.predationEvents,
        { id: uuidv4(), time: Date.now() }
      ]
      const cutoff = Date.now() - 30000
      return { predationEvents: events.filter((e) => e.time > cutoff) }
    }),

  initializeCells: () => {
    const types: CellType[] = ['green', 'purple', 'orange']
    const cells: Cell[] = []
    for (const type of types) {
      for (let i = 0; i < 5; i++) {
        cells.push(createInitialCell(type))
      }
    }
    set({ cells, populationHistory: [], predationEvents: [] })
  }
}))
