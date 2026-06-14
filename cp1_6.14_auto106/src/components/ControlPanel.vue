<template>
  <div class="control-panel">
    <h3 class="panel-title">环境参数控制</h3>

    <div class="sliders-container">
      <div class="slider-group">
        <div class="slider-header">
          <span class="slider-label">
            <span class="slider-icon light">☀</span>
            光照强度
          </span>
          <span
            class="slider-value"
            :style="{ color: getValueColor(params.light, [60, 85]) }"
          >
            {{ Math.round(params.light) }}%
          </span>
        </div>
        <div class="slider-track-wrapper">
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            :value="params.light"
            @input="onLightInput"
            class="custom-slider light-slider"
          />
        </div>
        <div class="slider-status">
          <span class="status-tag" :class="getStatusClass(params.light, [60, 85])">
            {{ getStatusText(params.light, [60, 85]) }}
          </span>
        </div>
      </div>

      <div class="slider-group">
        <div class="slider-header">
          <span class="slider-label">
            <span class="slider-icon water">💧</span>
            水分供应
          </span>
          <span
            class="slider-value"
            :style="{ color: getValueColor(params.water, [40, 65]) }"
          >
            {{ Math.round(params.water) }}%
          </span>
        </div>
        <div class="slider-track-wrapper">
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            :value="params.water"
            @input="onWaterInput"
            class="custom-slider water-slider"
          />
        </div>
        <div class="slider-status">
          <span class="status-tag" :class="getStatusClass(params.water, [40, 65])">
            {{ getStatusText(params.water, [40, 65]) }}
          </span>
        </div>
      </div>

      <div class="slider-group">
        <div class="slider-header">
          <span class="slider-label">
            <span class="slider-icon temp">🌡</span>
            环境温度
          </span>
          <span
            class="slider-value"
            :style="{ color: getValueColor(params.temperature, [50, 75]) }"
          >
            {{ Math.round(params.temperature) }}%
          </span>
        </div>
        <div class="slider-track-wrapper">
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            :value="params.temperature"
            @input="onTempInput"
            class="custom-slider temp-slider"
          />
        </div>
        <div class="slider-status">
          <span class="status-tag" :class="getStatusClass(params.temperature, [50, 75])">
            {{ getStatusText(params.temperature, [50, 75]) }}
          </span>
        </div>
      </div>

      <div class="slider-group">
        <div class="slider-header">
          <span class="slider-label">
            <span class="slider-icon nutrient">🌱</span>
            土壤养分
          </span>
          <span
            class="slider-value"
            :style="{ color: getValueColor(params.nutrients, [40, 70]) }"
          >
            {{ Math.round(params.nutrients) }}%
          </span>
        </div>
        <div class="slider-track-wrapper">
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            :value="params.nutrients"
            @input="onNutrientInput"
            class="custom-slider nutrient-slider"
          />
        </div>
        <div class="slider-status">
          <span class="status-tag" :class="getStatusClass(params.nutrients, [40, 70])">
            {{ getStatusText(params.nutrients, [40, 70]) }}
          </span>
        </div>
      </div>
    </div>

    <div class="quick-presets">
      <span class="presets-label">快速预设</span>
      <div class="preset-buttons">
        <button class="preset-btn" @click="applyPreset('rainforest')">雨林</button>
        <button class="preset-btn" @click="applyPreset('desert')">沙漠</button>
        <button class="preset-btn" @click="applyPreset('temperate')">温带</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { EnvironmentParams } from '@/types'
import { throttle } from '@/utils/helpers'

interface Props {
  params: EnvironmentParams
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:params', params: EnvironmentParams): void
  (e: 'change', params: Partial<EnvironmentParams>): void
}>()

const localParams = ref<EnvironmentParams>({ ...props.params })

watch(
  () => props.params,
  (newParams) => {
    localParams.value = { ...newParams }
  },
  { deep: true }
)

const throttledChange = throttle((params: Partial<EnvironmentParams>) => {
  emit('change', params)
}, 100)

function onLightInput(event: Event) {
  const target = event.target as HTMLInputElement
  const value = Number(target.value)
  localParams.value.light = value
  throttledChange({ light: value })
}

function onWaterInput(event: Event) {
  const target = event.target as HTMLInputElement
  const value = Number(target.value)
  localParams.value.water = value
  throttledChange({ water: value })
}

function onTempInput(event: Event) {
  const target = event.target as HTMLInputElement
  const value = Number(target.value)
  localParams.value.temperature = value
  throttledChange({ temperature: value })
}

function onNutrientInput(event: Event) {
  const target = event.target as HTMLInputElement
  const value = Number(target.value)
  localParams.value.nutrients = value
  throttledChange({ nutrients: value })
}

function getValueColor(value: number, optimal: [number, number]): string {
  const [min, max] = optimal
  if (value < min * 0.7) return '#ef4444'
  if (value < min) return '#f97316'
  if (value <= max) return '#22c55e'
  if (value <= max * 1.2) return '#f97316'
  return '#ef4444'
}

function getStatusClass(value: number, optimal: [number, number]): string {
  const [min, max] = optimal
  if (value < min * 0.7 || value > max * 1.3) return 'danger'
  if (value < min || value > max) return 'warning'
  return 'good'
}

function getStatusText(value: number, optimal: [number, number]): string {
  const [min, max] = optimal
  if (value < min * 0.7) return '严重不足'
  if (value < min) return '偏低'
  if (value > max * 1.3) return '严重过量'
  if (value > max) return '偏高'
  return '适宜'
}

function applyPreset(preset: string) {
  let newParams: Partial<EnvironmentParams> = {}

  switch (preset) {
    case 'rainforest':
      newParams = { light: 70, water: 85, temperature: 75, nutrients: 80 }
      break
    case 'desert':
      newParams = { light: 95, water: 15, temperature: 85, nutrients: 30 }
      break
    case 'temperate':
      newParams = { light: 65, water: 50, temperature: 55, nutrients: 55 }
      break
  }

  localParams.value = { ...localParams.value, ...newParams }
  emit('change', newParams)
}
</script>

<style scoped>
.control-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
  margin: 0;
}

.sliders-container {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.slider-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.slider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.slider-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #cbd5e1;
  font-weight: 500;
}

.slider-icon {
  font-size: 14px;
}

.slider-value {
  font-size: 14px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  transition: color 0.3s ease;
}

.slider-track-wrapper {
  position: relative;
  height: 8px;
}

.custom-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 8px;
  border-radius: 4px;
  outline: none;
  cursor: pointer;
  background: transparent;
}

.custom-slider::-webkit-slider-runnable-track {
  height: 8px;
  border-radius: 4px;
  background: linear-gradient(to right, #3b82f6, #22c55e, #ef4444);
}

.custom-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #ffffff;
  border: 2px solid #60a5fa;
  cursor: pointer;
  margin-top: -5px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
}

.custom-slider::-webkit-slider-thumb:hover {
  transform: scale(1.15);
  box-shadow: 0 2px 12px rgba(96, 165, 250, 0.5);
}

.custom-slider::-moz-range-track {
  height: 8px;
  border-radius: 4px;
  background: linear-gradient(to right, #3b82f6, #22c55e, #ef4444);
}

.custom-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #ffffff;
  border: 2px solid #60a5fa;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
}

.custom-slider::-moz-range-thumb:hover {
  transform: scale(1.15);
}

.slider-status {
  display: flex;
  justify-content: flex-end;
}

.status-tag {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-tag.good {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
}

.status-tag.warning {
  background: rgba(249, 115, 22, 0.15);
  color: #fb923c;
}

.status-tag.danger {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
}

.quick-presets {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.presets-label {
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
}

.preset-buttons {
  display: flex;
  gap: 8px;
}

.preset-btn {
  flex: 1;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.preset-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
  border-color: rgba(255, 255, 255, 0.2);
}
</style>
