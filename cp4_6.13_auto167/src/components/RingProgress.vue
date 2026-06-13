<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted, computed } from 'vue'

const props = defineProps<{
  value: number
  maxValue: number
  color: string
  label: string
  unit: string
  size?: number
  strokeWidth?: number
}>()

const size = computed(() => props.size || 160)
const strokeWidth = computed(() => props.strokeWidth || 10)

const canvasRef = ref<HTMLCanvasElement | null>(null)
const currentValue = ref(0)
const animationFrame = ref<number | null>(null)

const targetProgress = computed(() => {
  return Math.min(100, (props.value / props.maxValue) * 100)
})

const displayValue = computed(() => {
  if (props.unit === '%') {
    return Math.round(currentValue.value)
  }
  return Math.round((currentValue.value / 100) * props.maxValue)
})

function easeOutElastic(t: number): number {
  const c4 = (2 * Math.PI) / 3
  return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
}

function drawRing(progress: number) {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  const actualSize = size.value
  canvas.width = actualSize * dpr
  canvas.height = actualSize * dpr
  canvas.style.width = `${actualSize}px`
  canvas.style.height = `${actualSize}px`
  ctx.scale(dpr, dpr)

  const centerX = actualSize / 2
  const centerY = actualSize / 2
  const radius = (actualSize - strokeWidth.value * 2) / 2

  ctx.clearRect(0, 0, actualSize, actualSize)

  ctx.beginPath()
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
  ctx.strokeStyle = '#eef0f5'
  ctx.lineWidth = strokeWidth.value
  ctx.lineCap = 'round'
  ctx.stroke()

  if (progress > 0) {
    const startAngle = -Math.PI / 2
    const endAngle = startAngle + (progress / 100) * 2 * Math.PI

    const gradient = ctx.createLinearGradient(0, 0, actualSize, actualSize)
    gradient.addColorStop(0, props.color)
    gradient.addColorStop(1, adjustColor(props.color, -20))

    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, startAngle, endAngle)
    ctx.strokeStyle = gradient
    ctx.lineWidth = strokeWidth.value
    ctx.lineCap = 'round'
    ctx.stroke()

    const glowRadius = radius - strokeWidth.value / 2
    const glowAngle = endAngle
    const glowX = centerX + Math.cos(glowAngle) * glowRadius
    const glowY = centerY + Math.sin(glowAngle) * glowRadius

    const glowGradient = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, strokeWidth.value)
    glowGradient.addColorStop(0, props.color)
    glowGradient.addColorStop(1, 'transparent')
    
    ctx.beginPath()
    ctx.arc(glowX, glowY, strokeWidth.value, 0, 2 * Math.PI)
    ctx.fillStyle = glowGradient
    ctx.fill()
  }
}

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + amount))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount))
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount))
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

function animateTo(target: number) {
  const startValue = currentValue.value
  const diff = target - startValue
  const duration = 800
  const startTime = performance.now()

  function animate(currentTime: number) {
    const elapsed = currentTime - startTime
    const progress = Math.min(1, elapsed / duration)
    
    const easedProgress = easeOutElastic(progress)
    currentValue.value = startValue + diff * easedProgress
    
    drawRing(currentValue.value)

    if (progress < 1) {
      animationFrame.value = requestAnimationFrame(animate)
    }
  }

  if (animationFrame.value) {
    cancelAnimationFrame(animationFrame.value)
  }
  animationFrame.value = requestAnimationFrame(animate)
}

watch(targetProgress, (newVal) => {
  animateTo(newVal)
})

onMounted(() => {
  drawRing(0)
  setTimeout(() => {
    animateTo(targetProgress.value)
  }, 100)
})

onUnmounted(() => {
  if (animationFrame.value) {
    cancelAnimationFrame(animationFrame.value)
  }
})
</script>

<template>
  <div class="ring-progress">
    <div class="ring-container">
      <canvas ref="canvasRef"></canvas>
      <div class="ring-content">
        <span class="ring-value">{{ displayValue }}</span>
        <span class="ring-unit">{{ unit }}</span>
      </div>
    </div>
    <div class="ring-label">{{ label }}</div>
  </div>
</template>

<style scoped>
.ring-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.ring-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ring-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.ring-value {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  line-height: 1;
}

.ring-unit {
  font-size: 12px;
  color: #999;
}

.ring-label {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}
</style>
