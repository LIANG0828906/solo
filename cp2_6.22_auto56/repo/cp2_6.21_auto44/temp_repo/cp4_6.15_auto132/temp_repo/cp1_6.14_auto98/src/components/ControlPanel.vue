<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { DataDimension } from '@/composables/useHeatmapData'
import { themes } from '@/composables/useHeatmapData'

interface Props {
  currentDimension: DataDimension
  currentHour: number
  currentTheme: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:currentDimension', value: DataDimension): void
  (e: 'update:currentHour', value: number): void
  (e: 'update:currentTheme', value: number): void
  (e: 'grid-size-change', rows: number, cols: number): void
}>()

const localHour = ref(props.currentHour)
const isPlaying = ref(false)
const playInterval = ref<number | null>(null)

const dimensions: { value: DataDimension; label: string; icon: string }[] = [
  { value: 'population', label: '人口密度', icon: '👥' },
  { value: 'traffic', label: '交通流量', icon: '🚗' },
  { value: 'airQuality', label: '空气质量', icon: '🌬️' },
]

const gridSizes = [
  { label: '8×8', rows: 8, cols: 8 },
  { label: '16×16', rows: 16, cols: 16 },
]

const selectedGridSize = ref(0)

watch(
  () => props.currentHour,
  (val) => {
    localHour.value = val
  }
)

function setDimension(dim: DataDimension) {
  emit('update:currentDimension', dim)
}

function onHourInput(event: Event) {
  const target = event.target as HTMLInputElement
  const hour = parseInt(target.value, 10)
  localHour.value = hour
  emit('update:currentHour', hour)
}

function onHourChange() {
  emit('update:currentHour', localHour.value)
}

function togglePlay() {
  isPlaying.value = !isPlaying.value
  if (isPlaying.value) {
    playInterval.value = window.setInterval(() => {
      localHour.value = (localHour.value + 1) % 24
      emit('update:currentHour', localHour.value)
    }, 500)
  } else {
    if (playInterval.value) {
      clearInterval(playInterval.value)
      playInterval.value = null
    }
  }
}

function setTheme(index: number) {
  emit('update:currentTheme', index)
}

function setGridSize(index: number) {
  selectedGridSize.value = index
  const size = gridSizes[index]
  emit('grid-size-change', size.rows, size.cols)
}

const hourLabel = computed(() => {
  const h = localHour.value.toString().padStart(2, '0')
  return `${h}:00`
})

const progressPercent = computed(() => {
  return (localHour.value / 23) * 100
})
</script>

<template>
  <div class="control-panel">
    <div class="panel-header">
      <h2 class="panel-title">
        <span class="title-icon">🌆</span>
        城市热力图控制中心
      </h2>
      <p class="panel-subtitle">实时数据可视化平台</p>
    </div>

    <div class="panel-section">
      <div class="section-label">
        <span class="label-dot"></span>
        网格规模
      </div>
      <div class="grid-size-buttons">
        <button
          v-for="(size, index) in gridSizes"
          :key="size.label"
          :class="['grid-btn', { active: selectedGridSize === index }]"
          @click="setGridSize(index)"
        >
          {{ size.label }}
        </button>
      </div>
    </div>

    <div class="panel-section">
      <div class="section-label">
        <span class="label-dot"></span>
        数据维度
      </div>
      <div class="dimension-buttons">
        <button
          v-for="dim in dimensions"
          :key="dim.value"
          :class="['dim-btn', { active: currentDimension === dim.value }]"
          @click="setDimension(dim.value)"
        >
          <span class="dim-icon">{{ dim.icon }}</span>
          <span class="dim-text">{{ dim.label }}</span>
        </button>
      </div>
    </div>

    <div class="panel-section">
      <div class="section-row">
        <div class="section-label">
          <span class="label-dot"></span>
          时间轴
        </div>
        <div class="hour-display">{{ hourLabel }}</div>
      </div>
      <div class="timeline-container">
        <div class="timeline-track">
          <div class="timeline-progress" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <input
          type="range"
          class="timeline-slider"
          min="0"
          max="23"
          step="1"
          :value="localHour"
          @input="onHourInput"
          @change="onHourChange"
        />
      </div>
      <div class="timeline-ticks">
        <span v-for="h in [0, 6, 12, 18, 23]" :key="h">{{ h.toString().padStart(2, '0') }}</span>
      </div>
      <div class="play-controls">
        <button class="play-btn" @click="togglePlay">
          <span v-if="!isPlaying">▶ 播放</span>
          <span v-else>⏸ 暂停</span>
        </button>
      </div>
    </div>

    <div class="panel-section">
      <div class="section-label">
        <span class="label-dot"></span>
        颜色主题
      </div>
      <div class="theme-buttons">
        <button
          v-for="(theme, index) in themes"
          :key="theme.name"
          :class="['theme-btn', { active: currentTheme === index }]"
          @click="setTheme(index)"
        >
          <div class="theme-preview">
            <div class="color-stop" :style="{ background: theme.low }"></div>
            <div class="color-stop" :style="{ background: theme.mid }"></div>
            <div class="color-stop" :style="{ background: theme.high }"></div>
          </div>
          <span class="theme-name">{{ theme.name }}</span>
        </button>
      </div>
    </div>

    <div class="panel-section legend-section">
      <div class="section-label">
        <span class="label-dot"></span>
        数据图例
      </div>
      <div class="legend-bar">
        <div
          class="legend-gradient"
          :style="{
            background: `linear-gradient(to right, ${themes[currentTheme].low}, ${themes[currentTheme].mid}, ${themes[currentTheme].high})`,
          }"
        ></div>
        <div class="legend-labels">
          <span>低</span>
          <span>中</span>
          <span>高</span>
        </div>
      </div>
      <div class="legend-info">
        <p><span class="legend-mark">■</span> 方块高度：人口密度（越高越密集）</p>
        <p><span class="legend-mark">■</span> 顶面颜色：交通流量（绿→红）</p>
      </div>
    </div>

    <div class="panel-footer">
      <p class="hint">💡 鼠标悬停查看详情，点击方块查看趋势</p>
    </div>
  </div>
</template>

<style scoped>
.control-panel {
  width: 300px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 20px;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  color: #ffffff;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.control-panel::-webkit-scrollbar {
  width: 4px;
}

.control-panel::-webkit-scrollbar-track {
  background: transparent;
}

.control-panel::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.panel-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.panel-title {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  font-size: 18px;
}

.panel-subtitle {
  margin: 0;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 1px;
}

.panel-section {
  margin-bottom: 20px;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.label-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00f0ff, #0088ff);
  box-shadow: 0 0 8px rgba(0, 240, 255, 0.6);
}

.section-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.section-row .section-label {
  margin-bottom: 0;
}

.hour-display {
  font-size: 20px;
  font-weight: 700;
  color: #00f0ff;
  text-shadow: 0 0 10px rgba(0, 240, 255, 0.5);
  font-variant-numeric: tabular-nums;
}

.grid-size-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.grid-btn {
  padding: 10px 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  font-family: inherit;
}

.grid-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(0, 240, 255, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
}

.grid-btn.active {
  background: linear-gradient(135deg, rgba(0, 240, 255, 0.3), rgba(0, 136, 255, 0.3));
  border-color: #00f0ff;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 240, 255, 0.25);
}

.dimension-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dim-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s ease;
  font-family: inherit;
  text-align: left;
}

.dim-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(0, 240, 255, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
}

.dim-btn.active {
  background: linear-gradient(135deg, rgba(0, 240, 255, 0.25), rgba(136, 0, 255, 0.25));
  border-color: #00f0ff;
  color: #ffffff;
  box-shadow: 0 4px 16px rgba(0, 240, 255, 0.2);
}

.dim-icon {
  font-size: 16px;
}

.dim-text {
  flex: 1;
}

.timeline-container {
  position: relative;
  padding: 8px 0;
}

.timeline-track {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 6px;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.timeline-progress {
  height: 100%;
  background: linear-gradient(90deg, #00f0ff, #8800ff);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.timeline-slider {
  position: relative;
  width: 100%;
  height: 24px;
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  cursor: pointer;
  z-index: 2;
}

.timeline-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00f0ff, #0088ff);
  border: 2px solid #ffffff;
  cursor: pointer;
  box-shadow: 0 0 12px rgba(0, 240, 255, 0.6);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.timeline-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 0 20px rgba(0, 240, 255, 0.8);
}

.timeline-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00f0ff, #0088ff);
  border: 2px solid #ffffff;
  cursor: pointer;
  box-shadow: 0 0 12px rgba(0, 240, 255, 0.6);
}

.timeline-ticks {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  padding: 0 2px;
}

.timeline-ticks span {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
  font-variant-numeric: tabular-nums;
}

.play-controls {
  display: flex;
  justify-content: center;
  margin-top: 12px;
}

.play-btn {
  padding: 10px 32px;
  border: none;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  font-family: inherit;
  background: linear-gradient(135deg, #00f0ff 0%, #0088ff 50%, #8800ff 100%);
  color: #ffffff;
  box-shadow: 0 4px 16px rgba(0, 240, 255, 0.3);
}

.play-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(0, 240, 255, 0.5);
}

.play-btn:active {
  transform: translateY(0);
}

.theme-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.theme-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s ease;
  font-family: inherit;
}

.theme-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(0, 240, 255, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
}

.theme-btn.active {
  border-color: #00f0ff;
  background: rgba(0, 240, 255, 0.1);
  box-shadow: 0 4px 16px rgba(0, 240, 255, 0.2);
}

.theme-preview {
  display: flex;
  width: 100%;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
}

.color-stop {
  flex: 1;
}

.theme-name {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.8);
}

.legend-section {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  padding: 12px;
  margin-top: 8px;
}

.legend-bar {
  margin-bottom: 12px;
}

.legend-gradient {
  height: 12px;
  border-radius: 6px;
  margin-bottom: 6px;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.3);
}

.legend-labels {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
}

.legend-info p {
  margin: 4px 0;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-mark {
  font-size: 12px;
  color: #00f0ff;
}

.panel-footer {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.hint {
  margin: 0;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
  text-align: center;
  line-height: 1.6;
}
</style>
