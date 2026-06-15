<template>
  <div class="plant-selector">
    <h3 class="selector-title">选择植物种类</h3>

    <div class="plant-cards">
      <div
        v-for="plant in plantTypes"
        :key="plant.type"
        class="plant-card"
        :class="{ active: selectedType === plant.type }"
        @click="selectPlant(plant.type)"
      >
        <div class="plant-icon" :style="{ backgroundColor: plant.color + '20', color: plant.color }">
          <span class="icon-emoji">{{ plant.icon }}</span>
        </div>
        <div class="plant-info">
          <span class="plant-name">{{ plant.name }}</span>
          <span class="plant-desc">{{ plant.shortDesc }}</span>
        </div>
        <div class="check-mark" v-if="selectedType === plant.type">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
      </div>
    </div>

    <div class="selected-info" v-if="selectedType">
      <p class="info-text">{{ getSelectedConfig().description }}</p>

      <div class="optimal-stats">
        <div class="stat-item">
          <span class="stat-label">最适光照</span>
          <span class="stat-value">{{ getSelectedConfig().optimalLight[0] }}-{{ getSelectedConfig().optimalLight[1] }}%</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">最适水分</span>
          <span class="stat-value">{{ getSelectedConfig().optimalWater[0] }}-{{ getSelectedConfig().optimalWater[1] }}%</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">最适温度</span>
          <span class="stat-value">{{ getSelectedConfig().optimalTemperature[0] }}-{{ getSelectedConfig().optimalTemperature[1] }}%</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">最适养分</span>
          <span class="stat-value">{{ getSelectedConfig().optimalNutrients[0] }}-{{ getSelectedConfig().optimalNutrients[1] }}%</span>
        </div>
      </div>
    </div>

    <button
      class="plant-btn"
      :class="{ active: isPlantingMode }"
      @click="togglePlantingMode"
    >
      <span class="btn-icon">
        <svg v-if="!isPlantingMode" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14"></path>
        </svg>
        <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </span>
      {{ isPlantingMode ? '取消种植' : '开始种植' }}
    </button>

    <p class="hint" v-if="isPlantingMode">
      点击场景中的地面放置植物
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PlantType } from '@/types'
import { PLANT_CONFIGS } from '@/types'

interface Props {
  modelValue?: PlantType
  plantingMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 'flower',
  plantingMode: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: PlantType): void
  (e: 'update:plantingMode', value: boolean): void
}>()

const selectedType = ref<PlantType>(props.modelValue)
const isPlantingMode = ref(props.plantingMode)

const plantTypes = [
  { type: 'fruit' as PlantType, name: '果树', shortDesc: '多年生木本', icon: '🌳', color: '#4ade80' },
  { type: 'flower' as PlantType, name: '花卉', shortDesc: '美丽观赏', icon: '🌸', color: '#f472b6' },
  { type: 'succulent' as PlantType, name: '多肉', shortDesc: '耐旱植物', icon: '🌵', color: '#22d3ee' }
]

function selectPlant(type: PlantType) {
  selectedType.value = type
  emit('update:modelValue', type)
}

function getSelectedConfig() {
  return PLANT_CONFIGS[selectedType.value]
}

function togglePlantingMode() {
  isPlantingMode.value = !isPlantingMode.value
  emit('update:plantingMode', isPlantingMode.value)
}
</script>

<style scoped>
.plant-selector {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.selector-title {
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
  margin: 0;
}

.plant-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.plant-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.plant-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
  transform: translateX(2px);
}

.plant-card.active {
  background: rgba(74, 222, 128, 0.1);
  border-color: rgba(74, 222, 128, 0.4);
}

.plant-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-emoji {
  font-size: 20px;
}

.plant-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.plant-name {
  font-size: 13px;
  font-weight: 600;
  color: #f1f5f9;
}

.plant-desc {
  font-size: 11px;
  color: #94a3b8;
}

.check-mark {
  color: #4ade80;
  font-size: 14px;
}

.selected-info {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
  padding: 12px;
}

.info-text {
  font-size: 12px;
  color: #94a3b8;
  margin: 0 0 12px 0;
  line-height: 1.5;
}

.optimal-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-label {
  font-size: 10px;
  color: #64748b;
}

.stat-value {
  font-size: 12px;
  font-weight: 600;
  color: #cbd5e1;
}

.plant-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px 16px;
  background: rgba(74, 222, 128, 0.15);
  border: 1px solid rgba(74, 222, 128, 0.3);
  border-radius: 12px;
  color: #4ade80;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.plant-btn:hover {
  background: rgba(74, 222, 128, 0.25);
  transform: translateY(-1px);
}

.plant-btn.active {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
  color: #f87171;
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.hint {
  text-align: center;
  font-size: 11px;
  color: #64748b;
  margin: 0;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
</style>
