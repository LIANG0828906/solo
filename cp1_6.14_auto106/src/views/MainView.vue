<template>
  <div class="main-view">
    <div class="scene-container" ref="sceneContainerRef">
      <div class="plant-stats">
        <div class="stat-badge">
          <span class="stat-icon">🌱</span>
          <span class="stat-text">{{ plantCount }} 棵植物</span>
        </div>
      </div>
    </div>

    <aside class="side-panel">
      <div class="panel-content">
        <div class="panel-section">
          <PlantSelector
            v-model:modelValue="selectedPlantType"
            v-model:plantingMode="isPlantingMode"
            @update:modelValue="onPlantTypeChange"
            @update:plantingMode="onPlantingModeChange"
          />
        </div>

        <div class="panel-divider"></div>

        <div class="panel-section">
          <ControlPanel
            :params="envParams"
            @change="onEnvParamsChange"
          />
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ThreeScene } from '@/components/ThreeScene'
import PlantSelector from '@/components/PlantSelector.vue'
import ControlPanel from '@/components/ControlPanel.vue'
import { useEnvironmentStore } from '@/stores/environment'
import { usePlantStore } from '@/stores/plant'
import type { PlantType, EnvironmentParams } from '@/types'
import { PLANT_CONFIGS, GROWTH_STAGE_NAMES } from '@/types'
import { storeToRefs } from 'pinia'
import { formatTime } from '@/utils/helpers'

const router = useRouter()
const envStore = useEnvironmentStore()
const plantStore = usePlantStore()

const { params: envStoreParams } = storeToRefs(envStore)

const sceneContainerRef = ref<HTMLElement | null>(null)
let threeScene: ThreeScene | null = null

const selectedPlantType = ref<PlantType>('flower')
const isPlantingMode = ref(false)

const plantCount = computed(() => plantStore.plantCount)

const envParams = reactive<EnvironmentParams>({ ...envStoreParams.value })

function onPlantTypeChange(type: PlantType) {
  selectedPlantType.value = type
  plantStore.setSelectedPlantType(type)
}

function onPlantingModeChange(enabled: boolean) {
  isPlantingMode.value = enabled
  if (threeScene) {
    threeScene.setPlantingMode(enabled, selectedPlantType.value)
  }
}

function onEnvParamsChange(params: Partial<EnvironmentParams>) {
  Object.assign(envParams, params)
  envStore.updateParams(params)
  if (threeScene) {
    threeScene.updateEnvironment(params)
  }

  if (params.light !== undefined) {
    const lightValue = params.light
    const config = PLANT_CONFIGS[selectedPlantType.value]
    if (lightValue < config.optimalLight[0] * 0.7) {
      plantStore.plants.forEach(plant => {
        if (plant.type === selectedPlantType.value) {
          plantStore.addLogEntry(plant.id, `光照降至 ${Math.round(lightValue)}%，植物生长减缓`, 'warning')
        }
      })
    }
  }
}

function onPlantClick(plantId: string) {
  router.push(`/plant/${plantId}`)
}

function onPlantAdd(plantId: string, plantData: { type: PlantType; health: unknown; stage: string; progress: number }) {
  const position = threeScene?.getPlantData(plantId)?.position || { x: 0, z: 0 }
  const config = PLANT_CONFIGS[plantData.type]

  plantStore.addPlant(plantData.type, position)

  const plant = plantStore.plants.find(p => p.id === plantId)
  if (plant) {
    plant.stage = plantData.stage as never
    plant.growthProgress = plantData.progress
  }

  isPlantingMode.value = false
  if (threeScene) {
    threeScene.setPlantingMode(false)
  }
}

function onPlantUpdate(plantId: string, data: { health: unknown; stage: string; progress: number }) {
  const plant = plantStore.plants.find(p => p.id === plantId)
  if (plant) {
    plant.health = data.health as never
    plant.stage = data.stage as never
    plant.growthProgress = data.progress

    const oldStageIndex = GROWTH_STAGE_NAMES[plant.stage]
      ? Object.keys(GROWTH_STAGE_NAMES).indexOf(plant.stage)
      : 0
    const newStageIndex = Object.keys(GROWTH_STAGE_NAMES).indexOf(data.stage)

    if (newStageIndex > oldStageIndex) {
      plantStore.addLogEntry(
        plantId,
        `${formatTime(new Date())} 植物进入${GROWTH_STAGE_NAMES[data.stage as keyof typeof GROWTH_STAGE_NAMES]}`,
        'success'
      )
    }
  }
}

onMounted(() => {
  if (sceneContainerRef.value) {
    threeScene = new ThreeScene({
      container: sceneContainerRef.value,
      onPlantClick,
      onPlantAdd,
      onPlantUpdate
    })

    threeScene.updateEnvironment(envStoreParams.value)
  }
})

onBeforeUnmount(() => {
  if (threeScene) {
    threeScene.dispose()
    threeScene = null
  }
})
</script>

<style scoped>
.main-view {
  display: flex;
  width: 100%;
  height: 100%;
  position: relative;
}

.scene-container {
  flex: 1;
  position: relative;
  min-width: 0;
  overflow: hidden;
}

.plant-stats {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 10;
}

.stat-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  color: #e2e8f0;
  font-size: 13px;
  font-weight: 500;
}

.stat-icon {
  font-size: 16px;
}

.side-panel {
  width: 320px;
  flex-shrink: 0;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  position: relative;
  z-index: 5;
}

.panel-content {
  height: 100%;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.panel-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-track {
  background: transparent;
}

.panel-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}

.panel-section {
  padding: 4px 0;
}

.panel-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 20px 0;
}

@media (max-width: 1024px) {
  .side-panel {
    width: 280px;
  }
}

@media (max-width: 768px) {
  .main-view {
    flex-direction: column;
  }

  .scene-container {
    flex: 1;
    min-height: 0;
  }

  .side-panel {
    width: 100%;
    height: auto;
    max-height: 45vh;
    border-left: none;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  .panel-content {
    padding: 16px;
  }
}
</style>
