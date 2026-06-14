<template>
  <div class="growth-log">
    <h3 class="log-title">生长日志</h3>

    <div class="log-container" ref="logContainerRef">
      <div v-if="logs.length === 0" class="empty-state">
        <span class="empty-icon">📝</span>
        <span class="empty-text">暂无生长记录</span>
      </div>

      <div
        v-for="(log, index) in logs"
        :key="log.id"
        class="log-item"
        :class="{ 'log-enter': isNewLog(log.id) }"
        :style="{ animationDelay: index * 0.05 + 's' }"
      >
        <div class="log-timeline">
          <span class="timeline-dot" :class="log.type"></span>
          <span class="timeline-line" v-if="index < logs.length - 1"></span>
        </div>

        <div class="log-content">
          <span class="log-time">{{ formatTime(log.timestamp) }}</span>
          <p class="log-message" :class="log.type">{{ log.message }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import type { GrowthLogEntry } from '@/types'
import { formatTime } from '@/utils/helpers'

interface Props {
  logs: GrowthLogEntry[]
}

const props = defineProps<Props>()

const logContainerRef = ref<HTMLElement | null>(null)
const newLogIds = ref<Set<string>>(new Set())

function isNewLog(id: string): boolean {
  return newLogIds.value.has(id)
}

watch(
  () => props.logs,
  (newLogs, oldLogs) => {
    if (newLogs.length > (oldLogs?.length || 0)) {
      const newIds = newLogs.slice(0, newLogs.length - (oldLogs?.length || 0)).map(l => l.id)
      newIds.forEach(id => newLogIds.value.add(id))

      setTimeout(() => {
        newIds.forEach(id => newLogIds.value.delete(id))
      }, 1000)

      nextTick(() => {
        if (logContainerRef.value) {
          logContainerRef.value.scrollTop = 0
        }
      })
    }
  },
  { deep: true }
)
</script>

<style scoped>
.growth-log {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

.log-title {
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
  margin: 0;
  flex-shrink: 0;
}

.log-container {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-right: 8px;
  min-height: 0;
}

.log-container::-webkit-scrollbar {
  width: 4px;
}

.log-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 2px;
}

.log-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.log-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px 16px;
  color: #64748b;
}

.empty-icon {
  font-size: 32px;
  opacity: 0.5;
}

.empty-text {
  font-size: 12px;
}

.log-item {
  display: flex;
  gap: 12px;
  position: relative;
}

.log-item.log-enter {
  animation: slideIn 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.log-timeline {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 16px;
  flex-shrink: 0;
  padding-top: 4px;
}

.timeline-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  background: #64748b;
  box-shadow: 0 0 8px currentColor;
}

.timeline-dot.info {
  background: #60a5fa;
  box-shadow: 0 0 8px #60a5fa;
}

.timeline-dot.success {
  background: #4ade80;
  box-shadow: 0 0 8px #4ade80;
}

.timeline-dot.warning {
  background: #fbbf24;
  box-shadow: 0 0 8px #fbbf24;
}

.timeline-dot.danger {
  background: #f87171;
  box-shadow: 0 0 8px #f87171;
}

.timeline-line {
  width: 2px;
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  margin-top: 4px;
}

.log-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-bottom: 12px;
}

.log-time {
  font-size: 10px;
  color: #64748b;
  font-variant-numeric: tabular-nums;
}

.log-message {
  font-size: 12px;
  color: #cbd5e1;
  margin: 0;
  line-height: 1.4;
}

.log-message.info {
  color: #93c5fd;
}

.log-message.success {
  color: #86efac;
}

.log-message.warning {
  color: #fcd34d;
}

.log-message.danger {
  color: #fca5a5;
}
</style>
