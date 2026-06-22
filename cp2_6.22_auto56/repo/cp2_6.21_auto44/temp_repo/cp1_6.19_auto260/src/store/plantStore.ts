import { create } from 'zustand'

export interface GlowColor {
  h: number
  s: number
  l: number
}

export interface Plant {
  id: string
  name: string
  type: 'moss' | 'fern'
  glowColor: GlowColor
  growth: number
  resilience: number
  x: number
  y: number
}

export interface HybridResult {
  id: string
  name: string
  type: 'moss' | 'fern'
  glowColor: GlowColor
  resilience: number
}

interface PlantState {
  plants: Plant[]
  hybridCount: number
  lastHybridResult: HybridResult | null
  addPlant: (plant: Plant) => void
  addPlants: (newPlants: Plant[]) => void
  hybridize: (parent1: Plant, parent2: Plant) => HybridResult
  updateGrowth: (temperature: number, humidity: number, light: number, alertActive: boolean, isSimDay: boolean) => void
  applyAlertDamage: () => void
}

const PREFIXES = ['荧光', '幽蓝', '霜白', '琥珀', '墨绿']
const SUFFIXES = ['1号', '2号', '3号']

const randomPrefix = () => PREFIXES[Math.floor(Math.random() * PREFIXES.length)]
const randomSuffix = () => SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)]
const clamp = (min: number, max: number, val: number) => Math.max(min, Math.min(max, val))

const INITIAL_PLANTS: Plant[] = [
  { id: 'init-1', name: '荧光苔藓1号', type: 'moss', glowColor: { h: 120, s: 80, l: 50 }, growth: 30, resilience: 0.5, x: 0.35, y: 0.4 },
  { id: 'init-2', name: '幽蓝苔藓2号', type: 'moss', glowColor: { h: 200, s: 80, l: 50 }, growth: 25, resilience: 0.4, x: 0.6, y: 0.35 },
  { id: 'init-3', name: '霜白蕨类1号', type: 'fern', glowColor: { h: 180, s: 60, l: 70 }, growth: 20, resilience: 0.6, x: 0.45, y: 0.65 },
  { id: 'init-4', name: '墨绿蕨类2号', type: 'fern', glowColor: { h: 140, s: 70, l: 40 }, growth: 35, resilience: 0.45, x: 0.55, y: 0.6 },
]

export const usePlantStore = create<PlantState>((set, get) => ({
  plants: INITIAL_PLANTS,
  hybridCount: 0,
  lastHybridResult: null,

  addPlant: (plant: Plant) => {
    set(state => ({ plants: [...state.plants, plant] }))
  },

  addPlants: (newPlants: Plant[]) => {
    set(state => ({ plants: [...state.plants, ...newPlants] }))
  },

  hybridize: (parent1: Plant, parent2: Plant): HybridResult => {
    const newH = (parent1.glowColor.h + parent2.glowColor.h) / 2
    const newS = (parent1.glowColor.s + parent2.glowColor.s) / 2
    const newL = (parent1.glowColor.l + parent2.glowColor.l) / 2
    const w = Math.random() < 0.5 ? 0.3 : 0.7
    const resilience = parent1.resilience * w + parent2.resilience * (1 - w)
    const type = parent1.type === parent2.type
      ? parent1.type
      : (Math.random() < 0.5 ? parent1.type : parent2.type)
    const name = randomPrefix() + randomSuffix()
    const id = 'hybrid-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6)

    const result: HybridResult = {
      id,
      name,
      type,
      glowColor: { h: newH, s: newS, l: newL },
      resilience,
    }

    set(state => ({
      hybridCount: state.hybridCount + 1,
      lastHybridResult: result,
    }))

    return result
  },

  updateGrowth: (temperature: number, humidity: number, light: number, _alertActive: boolean, isSimDay: boolean) => {
    if (!isSimDay) return

    const { plants } = get()
    const updatedPlants = [...plants]
    const offspring: Plant[] = []

    for (let i = 0; i < updatedPlants.length; i++) {
      const plant = { ...updatedPlants[i] }

      if (plant.type === 'moss') {
        if (temperature >= 20 && temperature <= 30 && humidity >= 40 && humidity <= 80) {
          plant.growth += 5
        } else if ((temperature < 15 || temperature > 35) || (humidity < 25 || humidity > 90)) {
          plant.growth -= 3
        }
      } else if (plant.type === 'fern') {
        if (light >= 1000 && light <= 5000) {
          plant.growth += 5
        } else if (light < 800 || light > 6000) {
          plant.growth -= 3
        }
      }

      plant.growth = clamp(0, 100, plant.growth)

      if (plant.growth >= 100) {
        plant.growth = 60
        const count = Math.floor(Math.random() * 2) + 2
        for (let j = 0; j < count; j++) {
          offspring.push({
            id: 'spawn-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
            name: randomPrefix() + randomSuffix(),
            type: plant.type,
            glowColor: {
              h: clamp(0, 360, plant.glowColor.h + (Math.random() * 20 - 10)),
              s: clamp(0, 100, plant.glowColor.s + (Math.random() * 10 - 5)),
              l: clamp(10, 90, plant.glowColor.l + (Math.random() * 10 - 5)),
            },
            growth: 5,
            resilience: clamp(0, 1, plant.resilience * (0.9 + Math.random() * 0.2)),
            x: clamp(0.05, 0.95, plant.x + (Math.random() * 0.2 - 0.1)),
            y: clamp(0.05, 0.95, plant.y + (Math.random() * 0.2 - 0.1)),
          })
        }
      }

      updatedPlants[i] = plant
    }

    set({ plants: [...updatedPlants, ...offspring] })
  },

  applyAlertDamage: () => {
    set(state => ({
      plants: state.plants.map(plant => ({
        ...plant,
        growth: Math.max(0, plant.growth - 2 * (1 - plant.resilience * 0.5)),
      })),
    }))
  },
}))
