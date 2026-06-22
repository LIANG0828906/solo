import { create } from 'zustand'

export type SoilType = 'sand' | 'clay' | 'humus'

export interface PlantParams {
  id: number
  x: number
  z: number
  baseHeight: number
  seed: number
}

interface GardenState {
  lightIntensity: number
  humidity: number
  soilType: SoilType
  growthTime: number
  plants: PlantParams[]

  setLightIntensity: (value: number) => void
  setHumidity: (value: number) => void
  setSoilType: (type: SoilType) => void
  setGrowthTime: (time: number) => void
  setPlants: (plants: PlantParams[]) => void
}

const generateInitialPlants = (): PlantParams[] => {
  const plants: PlantParams[] = []
  for (let i = 0; i < 5; i++) {
    const angle = Math.random() * Math.PI * 2
    const radius = Math.random() * 12
    plants.push({
      id: i,
      x: Math.cos(angle) * radius,
      z: Math.sin(angle) * radius,
      baseHeight: 3 + Math.random() * 2,
      seed: Math.random() * 1000,
    })
  }
  return plants
}

export const useStore = create<GardenState>((set) => ({
  lightIntensity: 70,
  humidity: 50,
  soilType: 'humus',
  growthTime: 50,
  plants: generateInitialPlants(),

  setLightIntensity: (value) => set({ lightIntensity: value }),
  setHumidity: (value) => set({ humidity: value }),
  setSoilType: (type) => set({ soilType: type }),
  setGrowthTime: (time) => set({ growthTime: time }),
  setPlants: (plants) => set({ plants }),
}))
