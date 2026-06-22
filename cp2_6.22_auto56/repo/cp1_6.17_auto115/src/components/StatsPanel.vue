<template>
  <div class="stats-panel" :class="{ 'stats-expanded': isExpanded || !isSmallScreen }">
    <div v-if="isSmallScreen" class="stats-handle" @click="isExpanded = !isExpanded">
      <div class="handle-bar" />
    </div>
    <div class="stats-content">
      <div class="stat-item">
        <span class="stat-value accuracy">{{ accuracy }}%</span>
        <span class="stat-label">准确率</span>
      </div>
      <div class="stat-item">
        <span class="stat-value perfect">{{ perfect }}</span>
        <span class="stat-label">完美</span>
      </div>
      <div class="stat-item">
        <span class="stat-value good">{{ good }}</span>
        <span class="stat-label">良好</span>
      </div>
      <div class="stat-item">
        <span class="stat-value miss">{{ miss }}</span>
        <span class="stat-label">失误</span>
      </div>
      <button class="reset-btn" @click="$emit('reset')" title="重置">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 4v6h6" />
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

defineProps<{
  accuracy: number
  perfect: number
  good: number
  miss: number
}>()

defineEmits<{
  (e: 'reset'): void
}>()

const isExpanded = ref(false)
const isSmallScreen = ref(false)

function checkScreenSize() {
  isSmallScreen.value = window.innerWidth < 768
}

onMounted(() => {
  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize)
})
</script>

<style scoped>
.stats-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100px;
  background: rgba(26, 26, 46, 0.9);
  border-radius: 12px 12px 0 0;
  z-index: 20;
  transition: transform 0.3s ease;
  overflow: hidden;
}

.stats-panel.stats-expanded {
  transform: translateY(0);
}

.stats-panel:not(.stats-expanded) {
  transform: translateY(calc(100% - 36px));
}

.stats-handle {
  display: flex;
  justify-content: center;
  padding: 10px 0 4px;
  cursor: pointer;
}

.handle-bar {
  width: 40px;
  height: 4px;
  border-radius: 2px;
  background: #555;
  transition: background 0.2s ease;
}

.stats-handle:hover .handle-bar {
  background: #888;
}

.stats-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
  padding: 8px 24px;
  height: calc(100% - 36px);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-value {
  font-size: 36px;
  font-weight: 700;
  color: #EAEAEA;
  line-height: 1;
}

.stat-value.accuracy {
  font-size: 36px;
}

.stat-value.perfect {
  color: #00FF88;
}

.stat-value.good {
  color: #00BFFF;
}

.stat-value.miss {
  color: #FF4444;
}

.stat-label {
  font-size: 14px;
  color: #A0A0A0;
}

.reset-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: #E94560;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
  flex-shrink: 0;
}

.reset-btn:hover {
  background: #D63851;
}

@media (min-width: 768px) {
  .stats-handle {
    display: none;
  }

  .stats-content {
    height: 100%;
  }
}

@media (max-width: 767px) {
  .stats-content {
    gap: 16px;
    padding: 8px 16px;
  }

  .stat-value {
    font-size: 24px;
  }

  .stat-value.accuracy {
    font-size: 28px;
  }
}
</style>
