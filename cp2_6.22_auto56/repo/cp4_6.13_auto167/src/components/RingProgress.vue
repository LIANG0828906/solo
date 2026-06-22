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
const isUnmounted = ref(false)

const targetProgress = computed(() => {
  return Math.min(100, (props.value / props.maxValue) * 100)
})

const displayValue = computed(() => {
  if (props.unit === '%') {
    return Math.round(currentValue.value)
  }
  return Math.round((currentValue.value / 100) * props.maxValue)
})

function cubicBezier(t: number): number {
  const x1 = 0.68
  const y1 = -0.55
  const x2 = 0.27
  const y2 = 1.55

  if (t <= 0) return 0
  if (t >= 1) return 1

  let lo = 0
  let hi = 1
  for (let i = 0; i < 16; i++) {
    const mid = (lo + hi) / 2
    const x = 3 * x1 * mid * (1 - mid) * (1 - mid) + 3 * x2 * mid * mid * (1 - mid) + mid * mid * mid
    if (x < t) {
      lo = mid
    } else {
      hi = mid
    }
  }
  const s = (lo + hi) / 2
  const y = 3 * y1 * s * (1 - s) * (1 - s) + 3 * y2 * s * s * (1 - s) + s * s * s
  return y
}

function drawRing(progress: number) {
  if (isUnmounted.value) return
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
  ctx.setTransform(1, 0, 0, 1, 0, 0)
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
    const clampedProgress = Math.max(0, Math.min(100, progress))
    const startAngle = -Math.PI / 2
    const endAngle = startAngle + (clampedProgress / 100) * 2 * Math.PI

    const gradient = ctx.createLinearGradient(0, 0, actualSize, actualSize)
    gradient.addColorStop(0, props.color)
    gradient.addColorStop(1, adjustColor(props.color, -30))

    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, startAngle, endAngle)
    ctx.strokeStyle = gradient
    ctx.lineWidth = strokeWidth.value
    ctx.lineCap = 'round'
    ctx.stroke()

    const glowRadius = radius
    const glowAngle = endAngle
    const glowX = centerX + Math.cos(glowAngle) * glowRadius
    const glowY = centerY + Math.sin(glowAngle) * glowRadius

    ctx.save()
    ctx.shadowColor = props.color
    ctx.shadowBlur = 8
    ctx.beginPath()
    ctx.arc(glowX, glowY, strokeWidth.value * 0.35, 0, 2 * Math.PI)
    ctx.fillStyle = props.color
    ctx.fill()
    ctx.restore()
  }
}

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + amount))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount))
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount))
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

function cancelAnimation() {
  if (animationFrame.value !== null) {
    cancelAnimationFrame(animationFrame.value)
    animationFrame.value = null
  }
}

function animateTo(target: number) {
  cancelAnimation()

  const startValue = currentValue.value
  const diff = target - startValue
  if (Math.abs(diff) < 0.01) {
    currentValue.value = target
    drawRing(target)
    return
  }

  const duration = 800
  const startTime = performance.now()

  function animate(currentTime: number) {
    if (isUnmounted.value) return

    const elapsed = currentTime - startTime
    const timeProgress = Math.min(1, elapsed / duration)

    const easedProgress = cubicBezier(timeProgress)
    currentValue.value = startValue + diff * easedProgress

    drawRing(currentValue.value)

    if (timeProgress < 1) {
      animationFrame.value = requestAnimationFrame(animate)
    } else {
      currentValue.value = target
      drawRing(target)
      animationFrame.value = null
    }
  }

  animationFrame.value = requestAnimationFrame(animate)
}

watch(targetProgress, (newVal) => {
  animateTo(newVal)
})

onMounted(() => {
  isUnmounted.value = false
  drawRing(0)
  const initTimer = setTimeout(() => {
    if (!isUnmounted.value) {
      animateTo(targetProgress.value)
    }
  }, 120)
  ;(canvasRef.value as any)._initTimer = initTimer
})

onUnmounted(() => {
  isUnmounted.value = true
  cancelAnimation()
  if (canvasRef.value && (canvasRef.value as any)._initTimer) {
    clearTimeout((canvasRef.value as any)._initTimer)
    ;(canvasRef.value as any)._initTimer = null
  }
  canvasRef.value = null
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
  pointer-events: none;
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
