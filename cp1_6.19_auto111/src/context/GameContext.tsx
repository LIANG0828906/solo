import { create } from 'zustand'
import React, { createContext, useContext, useMemo, type ReactNode } from 'react'
import {
  Fish,
  FishSpecies,
  FishSize,
  FISH_CONFIG,
} from '../domain/Fish'
import { FishPond } from '../domain/FishPond'
import { WeatherSystem } from '../events/WeatherSystem'
import { EventScheduler } from '../events/EventScheduler'
import { EventBus } from '../eventBus'

export type OpenPanel = 'none' | 'fish-detail' | 'market'

export interface PendingAcquisition {
  species: FishSpecies
  unitPrice: number
  sizeRange: [number, number]
}

export interface AcquisitionRecord {
  id: string
  species: FishSpecies
  unitPrice: number
  totalSold: number
  time: number
}

export interface Cooldowns {
  feed: number
  aerate: number
  waterChange: number
}

export interface Inventory {
  feed: number
  medicine: number
}

export interface GameState {
  coins: number
  crystals: number
  inventory: Inventory
  selectedFishId: string | null
  openPanel: OpenPanel
  pendingAcquisition: PendingAcquisition | null
  acquisitionHistory: AcquisitionRecord[]
  cooldowns: Cooldowns
  pondRef: FishPond | null
  weatherRef: WeatherSystem | null
  schedulerRef: EventScheduler | null
  eventBusRef: EventBus | null
  addCoins: (n: number) => void
  spendCrystals: (n: number) => boolean
  buyFry: (species: FishSpecies, cost: number) => boolean
  sellFishes: (fishIds: string[]) => number
  setSelectedFish: (id: string | null) => void
  setOpenPanel: (panel: OpenPanel) => void
  setPendingAcquisition: (obj: PendingAcquisition | null) => void
  addAcquisitionRecord: (
    rec: Omit<AcquisitionRecord, 'id' | 'time'> & { id?: string; time?: number }
  ) => void
  startCooldown: (key: keyof Cooldowns) => void
  tickCooldowns: (dtMs: number) => void
  setPondRef: (pond: FishPond | null) => void
  setWeatherRef: (weather: WeatherSystem | null) => void
  setSchedulerRef: (scheduler: EventScheduler | null) => void
}

const COOLDOWN_DURATION = 2000
const POND_WIDTH = 640
const POND_HEIGHT = 480

const randomBetween = (min: number, max: number): number =>
  min + Math.random() * (max - min)

const randomSpeed = (): number => randomBetween(15, 25) / 1000

const sizeToEnum = (size: 'small' | 'medium' | 'large'): FishSize => {
  switch (size) {
    case 'small':
      return FishSize.Small
    case 'medium':
      return FishSize.Medium
    case 'large':
      return FishSize.Large
  }
}

const createInitialFish = (
  species: FishSpecies,
  size: 'small' | 'medium' | 'large' = 'small'
): Fish => {
  const angle = Math.random() * Math.PI * 2
  const speed = randomSpeed()
  return {
    id: `fish_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    species,
    size: sizeToEnum(size),
    health: 100,
    growthProgress: size === 'small' ? 0 : size === 'medium' ? 50 : 100,
    x: randomBetween(30, POND_WIDTH - 30),
    y: randomBetween(30, POND_HEIGHT - 30),
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    isDead: false,
    directionChangeTimer: randomBetween(2000, 3000),
  }
}

const createInitialFishes = (): Fish[] => {
  const species: FishSpecies[] = ['草鱼', '鲤鱼', '鲈鱼', '小龙虾']
  const fishes: Fish[] = []
  for (let i = 0; i < 10; i++) {
    const s = species[Math.floor(Math.random() * species.length)]
    fishes.push(createInitialFish(s))
  }
  return fishes
}

const initializeGameRefs = (): {
  pond: FishPond
  weather: WeatherSystem
  scheduler: EventScheduler
  eventBus: EventBus
} => {
  const eventBus = new EventBus()
  const pond = new FishPond()
  const initialFishes = createInitialFishes()
  for (const fish of initialFishes) {
    pond.addFish(fish)
  }
  const weather = new WeatherSystem(eventBus)
  const scheduler = new EventScheduler(eventBus, weather)
  return { pond, weather, scheduler, eventBus }
}

export const useGameStore = create<GameState>((set, get) => {
  const { pond, weather, scheduler, eventBus } = initializeGameRefs()

  return {
    coins: 100,
    crystals: 50,
    inventory: { feed: 10, medicine: 2 },
    selectedFishId: null,
    openPanel: 'none',
    pendingAcquisition: null,
    acquisitionHistory: [],
    cooldowns: { feed: 0, aerate: 0, waterChange: 0 },
    pondRef: pond,
    weatherRef: weather,
    schedulerRef: scheduler,
    eventBusRef: eventBus,

    addCoins: (n: number) => {
      set((state) => ({ coins: state.coins + n }))
    },

    spendCrystals: (n: number): boolean => {
      const { crystals } = get()
      if (crystals < n) return false
      set((state) => ({ crystals: state.crystals - n }))
      return true
    },

    buyFry: (species: FishSpecies, cost: number): boolean => {
      const { spendCrystals, pondRef } = get()
      if (!pondRef) return false
      if (!spendCrystals(cost)) return false
      const newFish = createInitialFish(species)
      const added = pondRef.addFish(newFish)
      if (!added) {
        set((state) => ({ crystals: state.crystals + cost }))
        return false
      }
      return true
    },

    sellFishes: (fishIds: string[]): number => {
      const { pondRef, addCoins, pendingAcquisition } = get()
      if (!pondRef) return 0

      const priceMap: Record<FishSpecies, Record<FishSize, number>> = {
        草鱼: { [FishSize.Small]: 2, [FishSize.Medium]: 5, [FishSize.Large]: 10 },
        鲤鱼: { [FishSize.Small]: 2, [FishSize.Medium]: 5, [FishSize.Large]: 10 },
        鲈鱼: { [FishSize.Small]: 2, [FishSize.Medium]: 5, [FishSize.Large]: 10 },
        小龙虾: { [FishSize.Small]: 2, [FishSize.Medium]: 5, [FishSize.Large]: 10 },
      }

      let total = 0
      const soldBySpecies: Partial<
        Record<FishSpecies, { count: number; unitPrice: number }>
      > = {}

      for (const id of fishIds) {
        const fish = pondRef.fishes.find((f) => f.id === id)
        if (!fish || fish.isDead) continue

        let unitPrice = priceMap[fish.species][fish.size]
        if (pendingAcquisition && pendingAcquisition.species === fish.species) {
          unitPrice = pendingAcquisition.unitPrice
        }

        total += unitPrice
        pondRef.removeFish(id)

        if (!soldBySpecies[fish.species]) {
          soldBySpecies[fish.species] = { count: 0, unitPrice }
        }
        soldBySpecies[fish.species]!.count++
        soldBySpecies[fish.species]!.unitPrice = unitPrice
      }

      if (total > 0) {
        addCoins(total)
        for (const species of Object.keys(soldBySpecies) as FishSpecies[]) {
          const entry = soldBySpecies[species]!
          get().addAcquisitionRecord({
            species,
            unitPrice: entry.unitPrice,
            totalSold: entry.count,
          })
        }
      }

      return total
    },

    setSelectedFish: (id: string | null) => {
      set({ selectedFishId: id })
    },

    setOpenPanel: (panel: OpenPanel) => {
      set({ openPanel: panel })
    },

    setPendingAcquisition: (obj: PendingAcquisition | null) => {
      set({ pendingAcquisition: obj })
    },

    addAcquisitionRecord: (rec) => {
      const record: AcquisitionRecord = {
        id: rec.id ?? `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        species: rec.species,
        unitPrice: rec.unitPrice,
        totalSold: rec.totalSold,
        time: rec.time ?? Date.now(),
      }
      set((state) => ({
        acquisitionHistory: [record, ...state.acquisitionHistory].slice(0, 5),
      }))
    },

    startCooldown: (key: keyof Cooldowns) => {
      set((state) => ({
        cooldowns: { ...state.cooldowns, [key]: COOLDOWN_DURATION },
      }))
    },

    tickCooldowns: (dtMs: number) => {
      set((state) => ({
        cooldowns: {
          feed: Math.max(0, state.cooldowns.feed - dtMs),
          aerate: Math.max(0, state.cooldowns.aerate - dtMs),
          waterChange: Math.max(0, state.cooldowns.waterChange - dtMs),
        },
      }))
    },

    setPondRef: (p: FishPond | null) => {
      set({ pondRef: p })
    },

    setWeatherRef: (w: WeatherSystem | null) => {
      set({ weatherRef: w })
    },

    setSchedulerRef: (s: EventScheduler | null) => {
      set({ schedulerRef: s })
    },
  }
})

export { FISH_CONFIG }

interface GameContextValue {
  useStore: typeof useGameStore
}

const GameContext = createContext<GameContextValue | null>(null)

export interface GameContextProviderProps {
  children: ReactNode
}

export const GameContextProvider: React.FC<GameContextProviderProps> = ({
  children,
}) => {
  const value = useMemo<GameContextValue>(
    () => ({ useStore: useGameStore }),
    []
  )
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export const useGameContext = (): GameContextValue => {
  const ctx = useContext(GameContext)
  if (!ctx) {
    throw new Error('useGameContext must be used within GameContextProvider')
  }
  return ctx
}
