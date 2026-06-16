import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import type { Plant, PlantStore, GrowthEvent } from '@/types'
import { getCurrentISOString } from '@/utils/dateUtils'

const samplePlants: Plant[] = [
  {
    id: uuidv4(),
    name: '小番茄',
    variety: '圣女果',
    plantDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    expectedMaturityDays: 90,
    mainImage: '',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    events: [
      {
        id: uuidv4(),
        plantId: '',
        type: 'sowing',
        description: '将种子播撒在营养土中，覆盖薄土，浇透水。',
        photos: [],
        timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: uuidv4(),
        plantId: '',
        type: 'germination',
        description: '种子发芽了！长出了两片嫩绿的子叶。',
        photos: [],
        timestamp: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: uuidv4(),
        plantId: '',
        type: 'watering',
        description: '今天天气晴朗，土壤有点干，浇了500ml水。',
        photos: [],
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: uuidv4(),
        plantId: '',
        type: 'fertilizing',
        description: '施用了稀释后的有机液肥，促进生长。',
        photos: [],
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ].map(e => ({ ...e, plantId: '' }))
  },
  {
    id: uuidv4(),
    name: '罗勒',
    variety: '甜罗勒',
    plantDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    expectedMaturityDays: 60,
    mainImage: '',
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    events: [
      {
        id: uuidv4(),
        plantId: '',
        type: 'sowing',
        description: '罗勒种子直播，保持土壤湿润。',
        photos: [],
        timestamp: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: uuidv4(),
        plantId: '',
        type: 'pests',
        description: '发现有蚜虫，用苦参碱溶液喷洒处理。',
        photos: [],
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: uuidv4(),
        plantId: '',
        type: 'pruning',
        description: '修剪顶芽，促进侧枝生长，让植株更茂盛。',
        photos: [],
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ].map(e => ({ ...e, plantId: '' }))
  },
  {
    id: uuidv4(),
    name: '薄荷',
    variety: '留兰香薄荷',
    plantDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    expectedMaturityDays: 45,
    mainImage: '',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    events: [
      {
        id: uuidv4(),
        plantId: '',
        type: 'harvest',
        description: '收获了一把新鲜薄荷，用来泡柠檬水喝，香气扑鼻！',
        photos: [],
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: uuidv4(),
        plantId: '',
        type: 'watering',
        description: '薄荷喜水，今天充分浇水。',
        photos: [],
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ].map(e => ({ ...e, plantId: '' }))
  }
].map(p => ({
  ...p,
  events: p.events.map(e => ({ ...e, plantId: p.id }))
}))

export const usePlantStore = create<PlantStore>()(
  persist(
    (set) => ({
      plants: samplePlants,
      selectedPlantId: null,

      addPlant: (plantData) => {
        const newPlant: Plant = {
          ...plantData,
          id: uuidv4(),
          createdAt: getCurrentISOString(),
          events: []
        }
        set((state) => ({
          plants: [...state.plants, newPlant]
        }))
      },

      updatePlant: (id, updates) => {
        set((state) => ({
          plants: state.plants.map((plant) =>
            plant.id === id ? { ...plant, ...updates } : plant
          )
        }))
      },

      deletePlant: (id) => {
        set((state) => ({
          plants: state.plants.filter((plant) => plant.id !== id),
          selectedPlantId: state.selectedPlantId === id ? null : state.selectedPlantId
        }))
      },

      selectPlant: (id) => {
        set({ selectedPlantId: id })
      },

      addEvent: (plantId, eventData) => {
        const newEvent: GrowthEvent = {
          ...eventData,
          id: uuidv4(),
          plantId,
          timestamp: getCurrentISOString()
        }
        set((state) => ({
          plants: state.plants.map((plant) =>
            plant.id === plantId
              ? { ...plant, events: [...plant.events, newEvent] }
              : plant
          )
        }))
      }
    }),
    {
      name: 'growlog-storage'
    }
  )
)
