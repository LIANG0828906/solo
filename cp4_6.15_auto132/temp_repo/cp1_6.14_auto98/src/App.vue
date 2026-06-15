<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useHeatmapData, type DataDimension } from '@/composables/useHeatmapData'
import CityGrid from '@/components/CityGrid.vue'
import ControlPanel from '@/components/ControlPanel.vue'

const rows = ref(8)
const cols = ref(8)
const fps = ref(60)
const animationProgress = ref(1)
let animationStartTime = 0
let animationRafId: number | null = null

const {
  currentDimension,
  currentHour,
  currentTheme,
  blocks,
  animationState,
  currentThemeColors,
  initData,
  getBlockValue,
  updateAnimation,
  setDimension,
  setHour,
  setTheme,
  getRating,
  getDimensionLabel,
  getDimensionUnit,
  hexToRgb,
  interpolateColor,
  updateTargets,
} = useHeatmapData(rows.value, cols.value)

const cityGridRef = ref<InstanceType<typeof CityGrid> | null>(null)

function startTransitionAnimation() {
  if (animationRafId) {
    cancelAnimationFrame(animationRafId)
  }
  animationStartTime = performance.now()
  animationProgress.value = 0

  function animate() {
    const elapsed = performance.now() - animationStartTime
    const duration = 500
    animationProgress.value = Math.min(1, elapsed / duration)
    updateAnimation(animationProgress.value)

    if (animationProgress.value < 1) {
      animationRafId = requestAnimationFrame(animate)
    } else {
      animationRafId = null
    }
  }
  animationRafId = requestAnimationFrame(animate)
}

function handleDimensionChange(dim: DataDimension) {
  currentDimension.value = dim
  updateTargets()
  startTransitionAnimation()
}

function handleHourChange(hour: number) {
  currentHour.value = hour
  updateTargets()
  startTransitionAnimation()
}

function handleThemeChange(theme: number) {
  currentTheme.value = theme
  updateTargets()
  startTransitionAnimation()
}

function handleGridSizeChange(newRows: number, newCols: number) {
  rows.value = newRows
  cols.value = newCols
  const newData = useHeatmapData(newRows, newCols)
  Object.assign(animationState, newData.animationState)
  initData()
  startTransitionAnimation()
}

function handleFpsUpdate(newFps: number) {
  fps.value = newFps
}

watch(
  () => [currentDimension.value, currentHour.value, currentTheme.value],
  () => {
    startTransitionAnimation()
  }
)

const fpsColor = computed(() => {
  if (fps.value >= 50) return '#00ff88'
  if (fps.value >= 30) return '#ffdd00'
  return '#ff3366'
})

onMounted(() => {
  initData()
  startTransitionAnimation()
})
</script>

<template>
  <div class="app-container">
    <div class="background-layer"></div>

    <div class="fps-counter">
      <span class="fps-label">FPS</span>
      <span class="fps-value" :style="{ color: fpsColor }">{{ fps }}</span>
    </div>

    <div class="main-content">
      <div class="scene-container">
        <CityGrid
          ref="cityGridRef"
          :rows="rows"
          :cols="cols"
          :blocks="blocks"
          :animation-state="animationState"
          :current-dimension="currentDimension"
          :current-hour="currentHour"
          :current-theme-colors="currentThemeColors"
          :get-block-value="getBlockValue"
          :get-rating="getRating"
          :get-dimension-label="getDimensionLabel"
          :get-dimension-unit="getDimensionUnit"
          :hex-to-rgb="hexToRgb"
          :interpolate-color="interpolateColor"
          :update-targets="updateTargets"
          @fps-update="handleFpsUpdate"
        />
      </div>

      <div class="panel-container">
        <ControlPanel
          :current-dimension="currentDimension"
          :current-hour="currentHour"
          :current-theme="currentTheme"
          @update:current-dimension="handleDimensionChange"
          @update:current-hour="handleHourChange"
          @update:current-theme="handleThemeChange"
          @grid-size-change="handleGridSizeChange"
        />
      </div>
    </div>

    <div class="app-footer">
      <span>© 2026 City Heatmap Visualization | 城市热力图可视化平台</span>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

.background-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(
    ellipse at 50% 40%,
    #1a0a2e 0%,
    #0f0a1e 40%,
    #0a0e1a 100%
  );
  z-index: 0;
}

.background-layer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 20% 80%, rgba(0, 240, 255, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(136, 0, 255, 0.08) 0%, transparent 50%);
  pointer-events: none;
}

.fps-counter {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 100;
  background: rgba(10, 14, 26, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 8px 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Consolas', 'Monaco', monospace;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.fps-label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.fps-value {
  font-size: 18px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  transition: color 0.3s ease;
  text-shadow: 0 0 10px currentColor;
}

.main-content {
  position: relative;
  z-index: 1;
  display: flex;
  width: 100%;
  height: 100%;
  padding: 24px;
  gap: 24px;
  box-sizing: border-box;
}

.scene-container {
  flex: 1;
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(10, 14, 26, 0.3);
}

.scene-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 16px;
  border: 1px solid rgba(0, 240, 255, 0.1);
  pointer-events: none;
  z-index: 10;
}

.panel-container {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
}

.app-footer {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.25);
  letter-spacing: 0.5px;
  pointer-events: none;
}
</style>
