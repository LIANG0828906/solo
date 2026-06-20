<template>
  <div class="plant-detail">
    <div class="detail-header">
      <button class="back-btn" @click="goBack">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        返回总览
      </button>

      <div class="plant-title-section">
        <h1 class="plant-name">{{ plantData?.name || '植物详情' }}</h1>
        <span class="plant-stage" :style="{ color: stageColor }">
          {{ stageName }}
        </span>
      </div>

      <div class="plant-health-badge">
        <span class="health-score" :style="{ color: healthColor }">
          {{ overallHealth }}
        </span>
        <span class="health-label">健康分</span>
      </div>
    </div>

    <div class="detail-content">
      <div class="scene-section">
        <div class="scene-wrapper" ref="sceneContainerRef">
          <div v-if="!hasPlant" class="no-plant-message">
            <span class="no-plant-icon">🌱</span>
            <p>未找到该植物</p>
            <button class="back-btn-secondary" @click="goBack">返回总览</button>
          </div>
        </div>
      </div>

      <div class="info-section">
        <div class="info-card">
          <HealthRadar :metrics="healthData" :animate="true" />
        </div>

        <div class="info-card progress-card">
          <h3 class="card-title">生长进度</h3>
          <div class="progress-bar-container">
            <div
              class="progress-bar"
              :style="{ width: growthProgress + '%' }"
            ></div>
            <span class="progress-text">{{ Math.round(growthProgress) }}%</span>
          </div>
          <div class="stage-indicators">
            <div
              v-for="(stage, index) in stages"
              :key="stage.key"
              class="stage-dot"
              :class="{ active: currentStageIndex >= index, current: currentStageIndex === index }"
            >
              <span class="dot"></span>
              <span class="stage-label">{{ stage.name }}</span>
            </div>
          </div>
        </div>

        <div class="info-card">
          <h3 class="card-title">
            <span class="card-icon">🕒</span>
            生长日志
          </h3>
          <GrowthLog :logs="plantLogs" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ThreeScene } from '@/components/ThreeScene'
import HealthRadar from '@/components/HealthRadar.vue'
import GrowthLog from '@/components/GrowthLog.vue'
import { usePlantStore } from '@/stores/plant'
import { storeToRefs } from 'pinia'
import { PLANT_CONFIGS, GROWTH_STAGES, GROWTH_STAGE_NAMES } from '@/types'
import type { HealthMetrics } from '@/types'

const route = useRoute()
const router = useRouter()
const plantStore = usePlantStore()

const { plants } = storeToRefs(plantStore)

const sceneContainerRef = ref<HTMLElement | null>(null)
let threeScene: ThreeScene | null = null

const plantId = route.params.id as string

const hasPlant = computed(() => {
  return plantStore.plants.some(p => p.id === plantId)
})

const plantData = computed(() => {
  return plantStore.plants.find(p => p.id === plantId) || null
})

const healthData = reactive<HealthMetrics>({
  light: 70,
  water: 70,
  temperature: 70,
  nutrients: 70,
  pests: 85
})

const growthProgress = computed(() => plantData.value?.growthProgress || 0)

const overallHealth = computed(() => plantData.value?.overallHealth || 0)

const currentStageIndex = computed(() => {
  if (!plantData.value) return 0
  return GROWTH_STAGES.indexOf(plantData.value.stage)
})

const stageName = computed(() => {
  if (!plantData.value) return ''
  return GROWTH_STAGE_NAMES[plantData.value.stage]
})

const stages = [
  { key: 'seed', name: '种子' },
  { key: 'sprout', name: '发芽' },
  { key: 'growing', name: '生长' },
  { key: 'mature', name: '成熟' },
  { key: 'flowering', name: '开花结果' }
]

const stageColor = computed(() => {
  if (!plantData.value) return '#94a3b8'
  const config = PLANT_CONFIGS[plantData.value.type]
  return config?.color || '#94a3b8'
})

const healthColor = computed(() => {
  if (overallHealth.value >= 80) return '#4ade80'
  if (overallHealth.value >= 60) return '#fbbf24'
  if (overallHealth.value >= 40) return '#f97316'
  return '#ef4444'
})

const plantLogs = computed(() => plantStore.getPlantLogs(plantId))

function goBack() {
  router.push('/')
}

function onPlantUpdate(id: string, data: { health: HealthMetrics; stage: string; progress: number }) {
  if (id === plantId) {
    Object.assign(healthData, data.health)
  }
}

watch(
  () => plantData.value,
  (newPlantData) => {
    if (newPlantData) {
      Object.assign(healthData, newPlantData.health)
    }
  },
  { immediate: true, deep: true }
)

const lastStageRef = ref<string | null>(null)

watch(
  () => {
    const p = plantStore.plants.find(p => p.id === plantId)
    return p?.stage
  },
  (newStage, oldStage) => {
    if (newStage && oldStage && newStage !== oldStage) {
      const stageNames: Record<string, string> = {
        sprout: '发芽',
        growing: '进入生长期',
        mature: '达到成熟',
        flowering: '开花结果'
      }
      if (stageNames[newStage]) {
        plantStore.addLogEntry(plantId, `植物${stageNames[newStage]}了`, 'success')
      }
    }
    lastStageRef.value = newStage || null
  }
)

onMounted(() => {
  if (plantData.value) {
    plantStore.addLogEntry(plantId, '进入植物详情页，开始特写观察', 'info')
  }

  if (sceneContainerRef.value && hasPlant.value) {
    threeScene = new ThreeScene({
      container: sceneContainerRef.value,
      onPlantUpdate
    })

    if (plantData.value) {
      const id = threeScene.addPlant(plantData.value.type, plantData.value.position)
      if (id) {
        setTimeout(() => {
          threeScene?.focusOnPlant(id)
        }, 300)
      }
    }
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
.plant-detail {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 16px 24px;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #cbd5e1;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
}

.plant-title-section {
  flex: 1;
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.plant-name {
  font-size: 20px;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0;
}

.plant-stage {
  font-size: 13px;
  font-weight: 600;
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
}

.plant-health-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.health-score {
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
}

.health-label {
  font-size: 10px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-content {
  flex: 1;
  display: flex;
  gap: 20px;
  padding: 20px;
  overflow: hidden;
  min-height: 0;
}

.scene-section {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.scene-wrapper {
  flex: 1;
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.08);
  min-height: 300px;
}

.no-plant-message {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #64748b;
}

.no-plant-icon {
  font-size: 48px;
  opacity: 0.5;
}

.no-plant-message p {
  font-size: 14px;
  margin: 0;
}

.back-btn-secondary {
  padding: 8px 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
}

.info-section {
  width: 340px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  min-height: 0;
}

.info-section::-webkit-scrollbar {
  width: 6px;
}

.info-section::-webkit-scrollbar-track {
  background: transparent;
}

.info-section::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
}

.info-card {
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 20px;
  flex-shrink: 0;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
  margin: 0 0 12px 0;
}

.card-icon {
  font-size: 16px;
}

.progress-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.progress-bar-container {
  position: relative;
  height: 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 5px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #22c55e, #4ade80, #86efac);
  border-radius: 5px;
  transition: width 0.5s ease-out;
  box-shadow: 0 0 10px rgba(74, 222, 128, 0.5);
}

.progress-text {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.stage-indicators {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0 4px;
}

.stage-dot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex: 1;
  position: relative;
}

.stage-dot .dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.stage-dot.active .dot {
  background: #4ade80;
  box-shadow: 0 0 8px #4ade80;
}

.stage-dot.current .dot {
  transform: scale(1.3);
}

.stage-label {
  font-size: 9px;
  color: #64748b;
  text-align: center;
  white-space: nowrap;
}

.stage-dot.active .stage-label {
  color: #94a3b8;
}

.stage-dot.current .stage-label {
  color: #4ade80;
  font-weight: 600;
}

@media (max-width: 1024px) {
  .info-section {
    width: 300px;
  }
}

@media (max-width: 768px) {
  .detail-content {
    flex-direction: column;
    padding: 16px;
    overflow-y: auto;
  }

  .scene-section {
    min-height: 300px;
  }

  .info-section {
    width: 100%;
    flex-shrink: 0;
    overflow-y: visible;
  }

  .detail-header {
    flex-wrap: wrap;
    gap: 12px;
    padding: 12px 16px;
  }

  .plant-title-section {
    order: -1;
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>
