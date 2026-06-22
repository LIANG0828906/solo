<template>
  <Transition name="panel">
    <div
      v-if="visible"
      class="info-panel-wrapper"
      :style="wrapperStyle"
      @click.stop
    >
      <svg class="connector-svg">
        <line
          :x1="lineStart.x"
          :y1="lineStart.y"
          :x2="lineEnd.x"
          :y2="lineEnd.y"
          stroke="rgba(0, 210, 255, 0.7)"
          stroke-width="1.5"
          stroke-dasharray="6 4"
          stroke-linecap="round"
        />
        <circle
          :cx="lineEnd.x"
          :cy="lineEnd.y"
          r="4"
          fill="#00d2ff"
          opacity="0.8"
        />
      </svg>
      
      <div class="info-panel" ref="panelRef">
        <div class="panel-header">
          <div class="panel-dot"></div>
          <span class="panel-title">材质信息</span>
        </div>
        
        <div class="panel-content serif-font">
          <div class="info-row">
            <span class="info-label">材质</span>
            <span class="info-value">{{ info.material }}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">生产年月</span>
            <span class="info-value">{{ info.productionDate }}</span>
          </div>
          
          <div class="info-description">
            <span class="info-label">简介</span>
            <p class="info-value description-text">{{ info.description }}</p>
          </div>
        </div>
        
        <div class="panel-close" @click="handleClose">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <line x1="2" y1="2" x2="12" y2="12" stroke="currentColor" stroke-width="1.5" />
            <line x1="12" y1="2" x2="2" y2="12" stroke="currentColor" stroke-width="1.5" />
          </svg>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'

interface PointInfo {
  material: string
  productionDate: string
  description: string
  position: { x: number; y: number; z: number }
  screenX: number
  screenY: number
}

interface Props {
  visible: boolean
  info: PointInfo
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  info: () => ({
    material: '',
    productionDate: '',
    description: '',
    position: { x: 0, y: 0, z: 0 },
    screenX: 0,
    screenY: 0,
  }),
})

const emit = defineEmits<{
  (e: 'close'): void
}>()

const panelRef = ref<HTMLDivElement | null>(null)
const panelWidth = 280
const panelHeight = 200
const margin = 20

const panelPosition = computed(() => {
  const clickX = props.info.screenX
  const clickY = props.info.screenY
  
  let x = clickX + 30
  let y = clickY - panelHeight / 2
  
  if (x + panelWidth + margin > window.innerWidth) {
    x = clickX - 30 - panelWidth
  }
  
  if (y < margin) {
    y = margin
  }
  if (y + panelHeight + margin > window.innerHeight) {
    y = window.innerHeight - panelHeight - margin
  }
  
  return { x, y }
})

const wrapperStyle = computed(() => ({
  left: `${Math.min(panelPosition.value.x, props.info.screenX)}px`,
  top: `${Math.min(panelPosition.value.y, props.info.screenY)}px`,
  width: `${Math.abs(props.info.screenX - panelPosition.value.x) + panelWidth + 20}px`,
  height: `${Math.abs(props.info.screenY - panelPosition.value.y) + panelHeight + 20}px`,
}))

const lineStart = computed(() => {
  const panelX = panelPosition.value.x
  const panelY = panelPosition.value.y
  const clickX = props.info.screenX
  const clickY = props.info.screenY
  
  const svgX = Math.min(panelX, clickX)
  const svgY = Math.min(panelY, clickY)
  
  let startX: number, startY: number
  
  if (clickX < panelX) {
    startX = panelX - svgX
    startY = panelY - svgY + 40
  } else if (clickX > panelX + panelWidth) {
    startX = panelX - svgX + panelWidth
    startY = panelY - svgY + 40
  } else if (clickY < panelY) {
    startX = panelX - svgX + panelWidth / 2
    startY = panelY - svgY
  } else {
    startX = panelX - svgX + panelWidth / 2
    startY = panelY - svgY + panelHeight
  }
  
  return { x: startX, y: startY }
})

const lineEnd = computed(() => {
  const panelX = panelPosition.value.x
  const panelY = panelPosition.value.y
  const clickX = props.info.screenX
  const clickY = props.info.screenY
  
  const svgX = Math.min(panelX, clickX)
  const svgY = Math.min(panelY, clickY)
  
  return {
    x: clickX - svgX,
    y: clickY - svgY,
  }
})

const handleClose = () => {
  emit('close')
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.visible) {
    emit('close')
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

watch(() => props.visible, (val) => {
  if (val) {
    nextTick(() => {
    })
  }
})
</script>

<style scoped>
.info-panel-wrapper {
  position: fixed;
  z-index: 1000;
  pointer-events: none;
}

.connector-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: visible;
}

.info-panel {
  position: absolute;
  width: 280px;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 210, 255, 0.3);
  border-radius: 16px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 0 20px rgba(0, 210, 255, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  pointer-events: auto;
  overflow: hidden;
  left: auto;
  right: auto;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px 12px;
  border-bottom: 1px solid rgba(0, 210, 255, 0.15);
}

.panel-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #00d2ff;
  box-shadow: 0 0 10px rgba(0, 210, 255, 0.8);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.2);
  }
}

.panel-title {
  font-size: 13px;
  font-weight: 600;
  color: #00d2ff;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.panel-content {
  padding: 16px 20px 20px;
}

.info-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 14px;
}

.info-description {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-label {
  font-size: 11px;
  color: #666677;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-family: 'Segoe UI', sans-serif;
}

.info-value {
  font-size: 14px;
  color: #e0e0e0;
  line-height: 1.5;
}

.description-text {
  font-size: 13px;
  line-height: 1.7;
  color: #b0b0c0;
  margin: 0;
}

.panel-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666677;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.panel-close:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.1);
}

.panel-enter-active,
.panel-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.panel-enter-from {
  opacity: 0;
  transform: scale(0.85);
}

.panel-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

@media (max-width: 768px) {
  .info-panel {
    width: 240px;
  }
  
  .panel-content {
    padding: 12px 16px 16px;
  }
  
  .description-text {
    font-size: 12px;
  }
}
</style>
