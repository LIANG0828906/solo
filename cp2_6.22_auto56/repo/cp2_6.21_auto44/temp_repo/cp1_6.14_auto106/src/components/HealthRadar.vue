<template>
  <div class="health-radar-container">
    <svg
      ref="svgRef"
      class="radar-svg"
      viewBox="-120 -120 240 240"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <radialGradient id="radarBgGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#1a2a3a" stop-opacity="0.9" />
          <stop offset="100%" stop-color="#0a1520" stop-opacity="0.7" />
        </radialGradient>

        <linearGradient id="radarFillGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fbbf24" stop-opacity="0.6" />
          <stop offset="25%" stop-color="#3b82f6" stop-opacity="0.6" />
          <stop offset="50%" stop-color="#ef4444" stop-opacity="0.6" />
          <stop offset="75%" stop-color="#22c55e" stop-opacity="0.6" />
          <stop offset="100%" stop-color="#a855f7" stop-opacity="0.6" />
        </linearGradient>

        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle cx="0" cy="0" r="110" fill="url(#radarBgGradient)" />

      <g class="radar-grid">
        <polygon
          v-for="(level, index) in 5"
          :key="'grid-' + index"
          :points="getPolygonPoints(20 + index * 18)"
          fill="none"
          stroke="#334155"
          stroke-width="0.5"
          stroke-opacity="0.5"
        />
      </g>

      <g class="radar-axes">
        <line
          v-for="(axis, index) in axes"
          :key="'axis-' + index"
          x1="0"
          y1="0"
          :x2="getAxisEnd(index).x"
          :y2="getAxisEnd(index).y"
          stroke="#475569"
          stroke-width="1"
          stroke-opacity="0.6"
        />
      </g>

      <polygon
        :points="dataPoints"
        fill="url(#radarFillGradient)"
        stroke="#60a5fa"
        stroke-width="2"
        filter="url(#glow)"
        class="radar-data-polygon"
      />

      <g class="radar-points">
        <circle
          v-for="(axis, index) in axes"
          :key="'point-' + index"
          :cx="getDataPoint(index).x"
          :cy="getDataPoint(index).y"
          r="4"
          :fill="axis.color"
          filter="url(#glow)"
          class="radar-point"
        />
      </g>

      <g class="radar-labels">
        <text
          v-for="(axis, index) in axes"
          :key="'label-' + index"
          :x="getLabelPosition(index).x"
          :y="getLabelPosition(index).y"
          :fill="axis.color"
          font-size="11"
          font-weight="500"
          text-anchor="middle"
          dominant-baseline="middle"
          class="radar-label"
        >
          {{ axis.label }}
        </text>
      </g>

      <g class="radar-values">
        <text
          v-for="(axis, index) in axes"
          :key="'value-' + index"
          :x="getValuePosition(index).x"
          :y="getValuePosition(index).y"
          fill="#e2e8f0"
          font-size="10"
          font-weight="600"
          text-anchor="middle"
          dominant-baseline="middle"
          class="radar-value"
        >
          {{ Math.round(displayMetrics[axis.key]) }}%
        </text>
      </g>
    </svg>

    <div class="radar-legend">
      <div
        v-for="(axis, index) in axes"
        :key="'legend-' + index"
        class="legend-item"
      >
        <span class="legend-dot" :style="{ backgroundColor: axis.color }"></span>
        <span class="legend-label">{{ axis.label }}</span>
        <span class="legend-value" :style="{ color: axis.color }">
          {{ Math.round(displayMetrics[axis.key]) }}%
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import * as TWEEN from '@tweenjs/tween.js'
import { scaleLinear } from 'd3-scale'

interface HealthMetrics {
  light: number
  water: number
  temperature: number
  nutrients: number
  pests: number
}

interface Props {
  metrics: HealthMetrics
  size?: number
  animate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 280,
  animate: true
})

const svgRef = ref<SVGSVGElement | null>(null)
const displayMetrics = reactive<HealthMetrics>({
  light: 0,
  water: 0,
  temperature: 0,
  nutrients: 0,
  pests: 0
})
let currentTween: TWEEN.Tween | null = null
let rafId: number | null = null

const axes = [
  { label: '光照', key: 'light' as const, color: '#fbbf24' },
  { label: '水分', key: 'water' as const, color: '#3b82f6' },
  { label: '温度', key: 'temperature' as const, color: '#ef4444' },
  { label: '养分', key: 'nutrients' as const, color: '#22c55e' },
  { label: '抗病', key: 'pests' as const, color: '#a855f7' }
]

const radius = 90
const centerX = 0
const centerY = 0

const angleScale = scaleLinear()
  .domain([0, 5])
  .range([-Math.PI / 2, -Math.PI / 2 + Math.PI * 2])

const valueScale = scaleLinear()
  .domain([0, 100])
  .range([0, radius])

function getPolygonPoints(r: number): string {
  const points: string[] = []
  for (let i = 0; i < 5; i++) {
    const angle = angleScale(i) as number
    const x = centerX + r * Math.cos(angle)
    const y = centerY + r * Math.sin(angle)
    points.push(`${x},${y}`)
  }
  return points.join(' ')
}

function getAxisEnd(index: number): { x: number; y: number } {
  const angle = angleScale(index) as number
  return {
    x: centerX + radius * Math.cos(angle),
    y: centerY + radius * Math.sin(angle)
  }
}

function getDataPoint(index: number): { x: number; y: number } {
  const angle = angleScale(index) as number
  const key = axes[index].key
  const value = displayMetrics[key]
  const r = valueScale(value) as number
  return {
    x: centerX + r * Math.cos(angle),
    y: centerY + r * Math.sin(angle)
  }
}

const dataPoints = computed(() => {
  const points: string[] = []
  for (let i = 0; i < 5; i++) {
    const point = getDataPoint(i)
    points.push(`${point.x},${point.y}`)
  }
  return points.join(' ')
})

function getLabelPosition(index: number): { x: number; y: number } {
  const angle = angleScale(index) as number
  const labelRadius = radius + 22
  return {
    x: centerX + labelRadius * Math.cos(angle),
    y: centerY + labelRadius * Math.sin(angle)
  }
}

function getValuePosition(index: number): { x: number; y: number } {
  const angle = angleScale(index) as number
  const valueRadius = radius + 8
  return {
    x: centerX + valueRadius * Math.cos(angle),
    y: centerY + valueRadius * Math.sin(angle)
  }
}

function requestUpdate() {
}

watch(
  () => props.metrics,
  (newVal) => {
    if (currentTween) {
      currentTween.stop()
      currentTween = null
    }

    if (!props.animate) {
      Object.assign(displayMetrics, newVal)
      return
    }

    currentTween = new TWEEN.Tween(displayMetrics)
      .to({ ...newVal }, 300)
      .easing(TWEEN.Easing.Cubic.Out)
      .onUpdate(() => requestUpdate())
      .onComplete(() => {
        currentTween = null
      })
      .start()
  },
  { deep: true }
)

function animateLoop() {
  TWEEN.update()
  rafId = requestAnimationFrame(animateLoop)
}

onMounted(() => {
  animateLoop()

  if (props.animate) {
    currentTween = new TWEEN.Tween(displayMetrics)
      .to({ ...props.metrics }, 300)
      .easing(TWEEN.Easing.Cubic.Out)
      .onUpdate(() => requestUpdate())
      .onComplete(() => {
        currentTween = null
      })
      .delay(100)
      .start()
  } else {
    Object.assign(displayMetrics, props.metrics)
  }
})

onBeforeUnmount(() => {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  if (currentTween) {
    currentTween.stop()
    currentTween = null
  }
  TWEEN.removeAll()
})
</script>

<style scoped>
.health-radar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.radar-svg {
  width: 100%;
  max-width: 280px;
  height: auto;
}

.radar-data-polygon {
  transition: all 0.3s ease-out;
  transform-origin: center;
  animation: radarEnter 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.radar-point {
  transition: all 0.3s ease-out;
}

.radar-label {
  font-family: 'Segoe UI', system-ui, sans-serif;
}

.radar-value {
  font-family: 'Segoe UI', system-ui, sans-serif;
}

@keyframes radarEnter {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.radar-legend {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px 16px;
  width: 100%;
  max-width: 260px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-label {
  color: #94a3b8;
  flex: 1;
}

.legend-value {
  font-weight: 600;
  font-size: 13px;
}
</style>
