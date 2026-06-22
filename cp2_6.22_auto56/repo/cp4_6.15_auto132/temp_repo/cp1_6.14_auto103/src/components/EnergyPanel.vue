<template>
  <div class="energy-panel">
    <div class="panel-header">
      <div class="logo-box">
        <span class="logo-icon">⚡</span>
        <div>
          <h1 class="panel-title">能耗监测</h1>
          <p class="panel-subtitle">3D Heatmap System</p>
        </div>
      </div>
      <div class="live-indicator">
        <span class="live-dot"></span>
        <span class="live-text">实时</span>
      </div>
    </div>

    <div class="panel-section">
      <label class="field-label">统计日期</label>
      <div class="date-display">
        <span class="date-main">{{ currentDateDisplay }}</span>
        <span class="date-week">{{ weekDayDisplay }}</span>
      </div>
      <div class="slider-wrapper">
        <input
          ref="sliderRef"
          type="range"
          :min="0"
          :max="6"
          :step="1"
          v-model.number="sliderValue"
          class="date-slider"
        />
        <div class="slider-labels">
          <span v-for="(d, i) in store.dates" :key="i" :class="{ active: i === store.currentDateIndex }">
            {{ d.slice(5) }}
          </span>
        </div>
      </div>
    </div>

    <div class="panel-section">
      <label class="field-label">楼层选择</label>
      <div class="select-wrapper">
        <select v-model.number="selectedFloor" class="floor-select">
          <option :value="0">全部楼层</option>
          <option v-for="n in 8" :key="n" :value="n">{{ n }}层</option>
        </select>
        <span class="select-arrow">▾</span>
      </div>
    </div>

    <div class="panel-section">
      <div class="section-header">
        <label class="field-label mb-0">能耗趋势</label>
        <span class="trend-unit">kWh / 日</span>
      </div>
      <div class="chart-wrapper">
        <svg ref="chartRef" :viewBox="`0 0 400 200`" preserveAspectRatio="none" class="trend-chart">
          <defs>
            <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stop-color="#6c5ce7" stop-opacity="0.5" />
              <stop offset="100%" stop-color="#4a9eff" stop-opacity="0.02" />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stop-color="#4a9eff" />
              <stop offset="100%" stop-color="#b197fc" />
            </linearGradient>
            <filter id="glowFilter">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g class="grid-lines">
            <line v-for="i in 4" :key="`h${i}`"
              :x1="40" :x2="390"
              :y1="20 + i * 40" :y2="20 + i * 40"
              stroke="rgba(120, 160, 255, 0.08)"
              stroke-dasharray="3,4" />
            <line v-for="i in 7" :key="`v${i}`"
              :x1="40 + i * 50" :x2="40 + i * 50"
              :y1="20" :y2="180"
              stroke="rgba(120, 160, 255, 0.05)" />
          </g>

          <g class="y-axis">
            <text v-for="(v, i) in yAxisLabels" :key="`y${i}`"
              :x="36" :y="180 - i * 40 + 4"
              fill="rgba(160, 190, 255, 0.45)"
              font-size="10" text-anchor="end"
              font-family="Inter, sans-serif">{{ v }}</text>
          </g>

          <path :d="areaPath" fill="url(#chartGradient)" />
          <path :d="linePath" fill="none" stroke="url(#lineGradient)" stroke-width="2.5"
            stroke-linecap="round" stroke-linejoin="round" filter="url(#glowFilter)" />

          <g v-for="(p, i) in chartPoints" :key="`p${i}`">
            <circle
              :cx="40 + i * 50" :cy="p.y"
              :r="i === store.currentDateIndex ? 6 : 3.5"
              :fill="i === store.currentDateIndex ? '#ffffff' : '#b197fc'"
              :stroke="i === store.currentDateIndex ? '#4a9eff' : 'transparent'"
              :stroke-width="i === store.currentDateIndex ? 2.5 : 0"
              filter="url(#glowFilter)"
              class="chart-dot"
            />
            <text v-if="i === store.currentDateIndex"
              :x="40 + i * 50" :y="p.y - 12"
              fill="#7ac4ff" font-size="11"
              font-weight="600" text-anchor="middle"
              font-family="Inter, sans-serif">{{ p.label }}</text>
          </g>
        </svg>
      </div>
    </div>

    <div class="panel-section stats-section">
      <label class="field-label">今日概览</label>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon total">Σ</div>
          <div class="stat-content">
            <span class="stat-value">{{ todayTotal.toLocaleString() }}</span>
            <span class="stat-label">总能耗 (kWh)</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon peak">▲</div>
          <div class="stat-content">
            <span class="stat-value">{{ peakValue.toLocaleString() }}</span>
            <span class="stat-label">峰值能耗 (kWh)</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon avg">≋</div>
          <div class="stat-content">
            <span class="stat-value">{{ avgValue.toLocaleString() }}</span>
            <span class="stat-label">均值 (kWh)</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon change" :class="changeClass">{{ changeIcon }}</div>
          <div class="stat-content">
            <span class="stat-value" :style="{ color: changeColor }">{{ changeDisplay }}</span>
            <span class="stat-label">环比上周</span>
          </div>
        </div>
      </div>
    </div>

    <div class="panel-section">
      <label class="field-label">热力图例</label>
      <div class="legend-bar">
        <div class="legend-gradient"></div>
        <div class="legend-labels">
          <span>低</span>
          <span>中</span>
          <span>高</span>
        </div>
      </div>
    </div>

    <div v-if="clickedBarInfo" class="panel-section selected-section">
      <label class="field-label">选中详情</label>
      <div class="selected-card">
        <div class="selected-row">
          <span class="selected-key">楼层</span>
          <span class="selected-val">{{ clickedBarInfo.floor }}层</span>
        </div>
        <div class="selected-row">
          <span class="selected-key">朝向</span>
          <span class="selected-val">{{ clickedBarInfo.direction }}</span>
        </div>
        <div class="selected-row">
          <span class="selected-key">能耗值</span>
          <span class="selected-val highlight">{{ clickedBarInfo.value.toLocaleString() }} kWh</span>
        </div>
        <div class="selected-row">
          <span class="selected-key">同比变化</span>
          <span class="selected-val" :style="{ color: clickedBarInfo.changePercent >= 0 ? '#ff6b6b' : '#51cf66' }">
            {{ clickedBarInfo.changePercent >= 0 ? '+' : '' }}{{ clickedBarInfo.changePercent.toFixed(1) }}%
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useEnergyStore } from '@/stores/energyStore'
import { storeToRefs } from 'pinia'

const store = useEnergyStore()
const { clickedBar } = storeToRefs(store)
const sliderRef = ref<HTMLInputElement | null>(null)
const chartRef = ref<SVGSVGElement | null>(null)

const sliderValue = computed({
  get: () => store.currentDateIndex,
  set: (v: number) => store.setCurrentDateIndex(v)
})

const selectedFloor = computed({
  get: () => store.selectedFloor,
  set: (v: number) => store.setSelectedFloor(v)
})

const currentDateDisplay = computed(() => {
  const d = store.dates[store.currentDateIndex]
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${y}年${parseInt(m)}月${parseInt(day)}日`
})

const weekDayDisplay = computed(() => {
  const d = store.dates[store.currentDateIndex]
  if (!d) return ''
  const date = new Date(d)
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return weekdays[date.getDay()]
})

const trendData = computed(() => store.getSelectedFloorTrend?.data || [])

const chartRange = computed(() => {
  const values = trendData.value.map((p) => p.value)
  const min = Math.min(...values, 0)
  const max = Math.max(...values, 1)
  const padding = (max - min) * 0.15
  return { min: Math.max(0, min - padding), max: max + padding }
})

const yAxisLabels = computed(() => {
  const { min, max } = chartRange.value
  const step = (max - min) / 4
  return Array.from({ length: 5 }, (_, i) => Math.round(max - i * step))
})

const chartPoints = computed(() => {
  const { min, max } = chartRange.value
  const range = Math.max(max - min, 1)
  return trendData.value.map((p) => ({
    y: 180 - ((p.value - min) / range) * 160,
    label: p.value.toLocaleString()
  }))
})

const linePath = computed(() => {
  const pts = chartPoints.value
  if (!pts.length) return ''
  return pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${40 + i * 50} ${p.y}`)
    .join(' ')
})

const areaPath = computed(() => {
  const pts = chartPoints.value
  if (!pts.length) return ''
  const line = pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${40 + i * 50} ${p.y}`)
    .join(' ')
  const lastIdx = pts.length - 1
  return `${line} L ${40 + lastIdx * 50} 180 L 40 180 Z`
})

const todayData = computed(() => {
  const floors = store.getCurrentFloorData
  if (store.selectedFloor === 0) {
    const allDirs = floors.flatMap((f) => f.directions)
    return {
      total: allDirs.reduce((s, d) => s + d.value, 0),
      peak: Math.max(...allDirs.map((d) => d.value)),
      avg: Math.round(allDirs.reduce((s, d) => s + d.value, 0) / Math.max(allDirs.length, 1)),
      change: allDirs.reduce((s, d) => s + d.changePercent, 0) / Math.max(allDirs.length, 1)
    }
  }
  const floor = floors.find((f) => f.floor === store.selectedFloor)
  const dirs = floor?.directions || []
  return {
    total: dirs.reduce((s, d) => s + d.value, 0),
    peak: Math.max(...dirs.map((d) => d.value), 0),
    avg: Math.round(dirs.reduce((s, d) => s + d.value, 0) / Math.max(dirs.length, 1)),
    change: dirs.reduce((s, d) => s + d.changePercent, 0) / Math.max(dirs.length, 1)
  }
})

const todayTotal = computed(() => todayData.value.total)
const peakValue = computed(() => todayData.value.peak)
const avgValue = computed(() => todayData.value.avg)
const changePercent = computed(() => todayData.value.change)

const changeClass = computed(() => (changePercent.value >= 0 ? 'up' : 'down'))
const changeIcon = computed(() => (changePercent.value >= 0 ? '▲' : '▼'))
const changeColor = computed(() => (changePercent.value >= 0 ? '#ff6b6b' : '#51cf66'))
const changeDisplay = computed(
  () => `${changePercent.value >= 0 ? '+' : ''}${changePercent.value.toFixed(1)}%`
)

const clickedBarInfo = computed(() => clickedBar.value)
</script>

<style scoped>
.energy-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 280px;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(120, 170, 255, 0.18);
  border-radius: 20px;
  padding: 20px;
  font-family: 'Inter', sans-serif;
  color: #e0e8ff;
  z-index: 100;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.06);
  transition: all 0.2s ease;
}

.energy-panel::-webkit-scrollbar {
  width: 5px;
}
.energy-panel::-webkit-scrollbar-track {
  background: transparent;
}
.energy-panel::-webkit-scrollbar-thumb {
  background: rgba(120, 170, 255, 0.25);
  border-radius: 4px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 22px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(120, 170, 255, 0.12);
}

.logo-box {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  font-size: 28px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #4a9eff 0%, #6c5ce7 100%);
  border-radius: 12px;
  box-shadow: 0 4px 14px rgba(74, 158, 255, 0.35);
}

.panel-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, #ffffff, #b0c4ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 0.5px;
}

.panel-subtitle {
  font-size: 10px;
  font-weight: 500;
  color: rgba(160, 190, 255, 0.45);
  margin: 2px 0 0 0;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

.live-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(81, 207, 102, 0.1);
  border: 1px solid rgba(81, 207, 102, 0.3);
  padding: 4px 10px;
  border-radius: 20px;
}

.live-dot {
  width: 7px;
  height: 7px;
  background: #51cf66;
  border-radius: 50%;
  box-shadow: 0 0 8px #51cf66;
  animation: pulse 1.6s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.3); }
}

.live-text {
  font-size: 11px;
  font-weight: 600;
  color: #51cf66;
  letter-spacing: 0.5px;
}

.panel-section {
  margin-bottom: 20px;
  transition: all 0.2s ease;
}

.field-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: rgba(160, 190, 255, 0.65);
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 10px;
}

.mb-0 {
  margin-bottom: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.trend-unit {
  font-size: 10px;
  color: rgba(160, 190, 255, 0.4);
  font-weight: 500;
}

.date-display {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 12px 14px;
  background: rgba(74, 158, 255, 0.06);
  border: 1px solid rgba(74, 158, 255, 0.15);
  border-radius: 12px;
  margin-bottom: 14px;
  transition: all 0.2s ease;
}

.date-main {
  font-size: 15px;
  font-weight: 700;
  color: #ffffff;
}

.date-week {
  font-size: 12px;
  font-weight: 500;
  color: #7ac4ff;
}

.slider-wrapper {
  padding: 0 2px;
}

.date-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 10px;
  background: linear-gradient(90deg,
    rgba(74, 158, 255, 0.2) 0%,
    rgba(108, 92, 231, 0.3) 100%);
  outline: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.date-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4a9eff, #6c5ce7);
  border: 2px solid #ffffff;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(74, 158, 255, 0.5);
  transition: all 0.2s ease;
}

.date-slider::-webkit-slider-thumb:hover {
  transform: scale(1.15);
  box-shadow: 0 2px 16px rgba(74, 158, 255, 0.7);
}

.date-slider:focus::-webkit-slider-thumb {
  box-shadow: 0 0 0 4px rgba(74, 158, 255, 0.2), 0 2px 12px rgba(74, 158, 255, 0.5);
}

.date-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4a9eff, #6c5ce7);
  border: 2px solid #ffffff;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(74, 158, 255, 0.5);
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  padding: 0 1px;
}

.slider-labels span {
  font-size: 9px;
  font-weight: 500;
  color: rgba(160, 190, 255, 0.35);
  transition: all 0.2s ease;
  letter-spacing: 0.3px;
}

.slider-labels span.active {
  color: #7ac4ff;
  font-weight: 700;
  font-size: 10px;
}

.select-wrapper {
  position: relative;
}

.floor-select {
  width: 100%;
  padding: 12px 40px 12px 14px;
  font-size: 14px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  color: #ffffff;
  background: rgba(74, 158, 255, 0.06);
  border: 1px solid rgba(74, 158, 255, 0.2);
  border-radius: 12px;
  outline: none;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  transition: all 0.2s ease;
}

.floor-select:hover {
  border-color: rgba(74, 158, 255, 0.4);
  background: rgba(74, 158, 255, 0.1);
}

.floor-select:focus {
  border-color: rgba(74, 158, 255, 0.6);
  box-shadow: 0 0 0 3px rgba(74, 158, 255, 0.15), 0 0 20px rgba(74, 158, 255, 0.1);
}

.floor-select option {
  background: #0f1430;
  color: #ffffff;
  padding: 10px;
}

.select-arrow {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(160, 190, 255, 0.5);
  font-size: 12px;
  pointer-events: none;
  transition: all 0.2s ease;
}

.select-wrapper:hover .select-arrow {
  color: #7ac4ff;
}

.chart-wrapper {
  background: rgba(10, 15, 35, 0.4);
  border: 1px solid rgba(74, 158, 255, 0.1);
  border-radius: 14px;
  padding: 4px;
}

.trend-chart {
  width: 100%;
  height: 180px;
  display: block;
}

.chart-dot {
  transition: r 0.2s ease;
}

.stats-section {
  padding-top: 2px;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: rgba(74, 158, 255, 0.04);
  border: 1px solid rgba(74, 158, 255, 0.1);
  border-radius: 12px;
  transition: all 0.2s ease;
}

.stat-card:hover {
  background: rgba(74, 158, 255, 0.08);
  border-color: rgba(74, 158, 255, 0.2);
  transform: translateY(-1px);
}

.stat-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 700;
  flex-shrink: 0;
}

.stat-icon.total {
  background: linear-gradient(135deg, rgba(74, 158, 255, 0.25), rgba(74, 158, 255, 0.08));
  color: #7ac4ff;
}
.stat-icon.peak {
  background: linear-gradient(135deg, rgba(255, 152, 0, 0.25), rgba(255, 152, 0, 0.08));
  color: #ffb74d;
}
.stat-icon.avg {
  background: linear-gradient(135deg, rgba(108, 92, 231, 0.25), rgba(108, 92, 231, 0.08));
  color: #b197fc;
}
.stat-icon.change {
  background: linear-gradient(135deg, rgba(120, 120, 120, 0.25), rgba(120, 120, 120, 0.08));
  color: #888;
}
.stat-icon.change.up {
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.22), rgba(255, 107, 107, 0.06));
  color: #ff8a8a;
}
.stat-icon.change.down {
  background: linear-gradient(135deg, rgba(81, 207, 102, 0.22), rgba(81, 207, 102, 0.06));
  color: #69db7c;
}

.stat-content {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.stat-value {
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.2;
}

.stat-label {
  font-size: 9px;
  font-weight: 500;
  color: rgba(160, 190, 255, 0.5);
  margin-top: 3px;
  letter-spacing: 0.3px;
}

.legend-bar {
  padding: 4px 2px 0 2px;
}

.legend-gradient {
  height: 12px;
  border-radius: 8px;
  background: linear-gradient(90deg,
    #0a2463 0%,
    #1e88e5 25%,
    #43a047 50%,
    #ff9800 75%,
    #e53935 100%);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
}

.legend-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  padding: 0 4px;
}

.legend-labels span {
  font-size: 10px;
  font-weight: 600;
  color: rgba(160, 190, 255, 0.5);
}

.selected-section {
  padding-top: 4px;
}

.selected-card {
  padding: 14px;
  background: linear-gradient(135deg, rgba(74, 158, 255, 0.08), rgba(108, 92, 231, 0.06));
  border: 1px solid rgba(74, 158, 255, 0.25);
  border-radius: 14px;
}

.selected-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 7px 0;
  border-bottom: 1px dashed rgba(120, 170, 255, 0.1);
}

.selected-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.selected-row:first-child {
  padding-top: 0;
}

.selected-key {
  font-size: 11px;
  font-weight: 500;
  color: rgba(160, 190, 255, 0.55);
}

.selected-val {
  font-size: 13px;
  font-weight: 700;
  color: #ffffff;
}

.selected-val.highlight {
  background: linear-gradient(135deg, #7ac4ff, #b197fc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
</style>
