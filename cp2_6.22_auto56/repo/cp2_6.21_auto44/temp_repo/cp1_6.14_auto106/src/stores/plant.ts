import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PlantData, PlantType, GrowthLogEntry } from '@/types'
import { PLANT_CONFIGS, GROWTH_STAGES } from '@/types'
import { generateId } from '@/utils/helpers'

export const usePlantStore = defineStore('plant', () => {
  const plants = ref<PlantData[]>([])
  const selectedPlantId = ref<string | null>(null)
  const growthLogs = ref<Map<string, GrowthLogEntry[]>>(new Map())
  const selectedPlantType = ref<PlantType>('flower')

  const selectedPlant = computed(() => {
    if (!selectedPlantId.value) return null
    return plants.value.find(p => p.id === selectedPlantId.value) || null
  })

  const plantCount = computed(() => plants.value.length)

  function setSelectedPlantType(type: PlantType) {
    selectedPlantType.value = type
  }

  function addPlant(type: PlantType, position: { x: number; z: number }): PlantData {
    const config = PLANT_CONFIGS[type]
    const newPlant: PlantData = {
      id: generateId(),
      type,
      name: `${config.name} #${plants.value.length + 1}`,
      position,
      stage: 'seed',
      growthProgress: 0,
      health: {
        light: 80,
        water: 80,
        temperature: 80,
        nutrients: 80,
        pests: 90
      },
      overallHealth: 82,
      accumulatedParams: {
        light: 0,
        water: 0,
        temperature: 0,
        nutrients: 0
      },
      createdAt: new Date()
    }

    plants.value.push(newPlant)
    growthLogs.value.set(newPlant.id, [])
    addLogEntry(newPlant.id, `${config.name}已种植`, 'success')

    return newPlant
  }

  function removePlant(id: string) {
    const index = plants.value.findIndex(p => p.id === id)
    if (index > -1) {
      plants.value.splice(index, 1)
      growthLogs.value.delete(id)
      if (selectedPlantId.value === id) {
        selectedPlantId.value = null
      }
    }
  }

  function selectPlant(id: string | null) {
    selectedPlantId.value = id
  }

  function updatePlant(id: string, updates: Partial<PlantData>) {
    const plant = plants.value.find(p => p.id === id)
    if (plant) {
      Object.assign(plant, updates)
    }
  }

  function updatePlantHealth(id: string, health: PlantData['health']) {
    const plant = plants.value.find(p => p.id === id)
    if (plant) {
      plant.health = health
      plant.overallHealth = Math.round(
        (health.light + health.water + health.temperature + health.nutrients + health.pests) / 5
      )
    }
  }

  function updateGrowthStage(id: string, stage: PlantData['stage'], progress: number) {
    const plant = plants.value.find(p => p.id === id)
    if (plant) {
      const oldStageIndex = GROWTH_STAGES.indexOf(plant.stage)
      const newStageIndex = GROWTH_STAGES.indexOf(stage)

      plant.stage = stage
      plant.growthProgress = progress

      if (newStageIndex > oldStageIndex) {
        const stageNames: Record<string, string> = {
          sprout: '发芽',
          growing: '进入生长期',
          mature: '成熟',
          flowering: '开花结果'
        }
        if (stageNames[stage]) {
          addLogEntry(id, `植物${stageNames[stage]}了！`, 'success')
        }
      }
    }
  }

  function addLogEntry(plantId: string, message: string, type: GrowthLogEntry['type'] = 'info') {
    const logs = growthLogs.value.get(plantId)
    if (logs) {
      logs.unshift({
        id: generateId(),
        timestamp: new Date(),
        message,
        type
      })
      if (logs.length > 50) {
        logs.pop()
      }
    }
  }

  function getPlantLogs(id: string): GrowthLogEntry[] {
    return growthLogs.value.get(id) || []
  }

  return {
    plants,
    selectedPlantId,
    selectedPlantType,
    selectedPlant,
    plantCount,
    setSelectedPlantType,
    addPlant,
    removePlant,
    selectPlant,
    updatePlant,
    updatePlantHealth,
    updateGrowthStage,
    addLogEntry,
    getPlantLogs
  }
})
