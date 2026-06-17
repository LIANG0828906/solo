<template>
  <div
    class="stage-container"
    ref="stageRef"
    @click="handleTap"
    :style="{ cursor: isPlaying ? 'pointer' : 'default' }"
  >
    <div
      class="pulse-ring"
      :style="pulseStyle"
    />
    <div
      class="flash-overlay"
      :style="flashStyle"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { VisualRenderer } from '../VisualRenderer'
import type { VisualUpdateData } from '../VisualRenderer'

const props = defineProps<{
  isPlaying: boolean
  pulseDuration: number
}>()

const emit = defineEmits<{
  (e: 'tap', timestamp: number): void
}>()

const stageRef = ref<HTMLElement | null>(null)
const visualData = ref<VisualUpdateData>({
  radius: 30,
  color: 'rgb(233,69,96)',
  flashOpacity: 0,
  pulseProgress: 1,
  isPulsing: false
})

const renderer = new VisualRenderer()

renderer.onUpdateEvent((data: VisualUpdateData) => {
  visualData.value = data
})

const pulseStyle = computed(() => {
  const d = visualData.value
  return {
    width: `${d.radius * 2}px`,
    height: `${d.radius * 2}px`,
    background: `radial-gradient(circle, ${d.color}, ${d.color}88, transparent)`,
    transform: 'translate(-50%, -50%)',
    transition: 'none'
  }
})

const flashStyle = computed(() => {
  return {
    opacity: visualData.value.flashOpacity
  }
})

function triggerPulse() {
  renderer.triggerPulse()
}

function handleTap() {
  emit('tap', performance.now())
}

function startRendering() {
  renderer.start()
}

function stopRendering() {
  renderer.stop()
}

defineExpose({
  triggerPulse,
  startRendering,
  stopRendering
})

onMounted(() => {
  renderer.setPulseConfig({
    minRadius: 30,
    maxRadius: 60,
    duration: props.pulseDuration,
    colorFrom: '#E94560',
    colorTo: '#533483'
  })
})

onUnmounted(() => {
  renderer.stop()
})
</script>

<style scoped>
.stage-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 20px;
  background: #0F3460;
  box-shadow: 0 8px 32px #00000050;
}

.pulse-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  pointer-events: none;
  will-change: transform, width, height;
}

.flash-overlay {
  position: absolute;
  inset: 0;
  background: #FFFFFF;
  pointer-events: none;
  transition: none;
}
</style>
