<template>
  <div class="growth-log">
    <div class="log-container" ref="logContainerRef">
      <div v-if="logs.length === 0" class="empty-state">
        <span class="empty-text">暂无生长日志</span>
      </div>

      <TransitionGroup name="log" tag="div" class="log-list">
        <div
          v-for="(log, index) in logs"
          :key="log.id"
          class="log-item"
        >
          <div class="log-timeline">
            <span class="timeline-dot" :class="log.type"></span>
            <span class="timeline-line" v-if="index < logs.length - 1"></span>
          </div>

          <div class="log-content">
            <span class="log-time">{{ formatTime(log.timestamp) }}</span>
            <p class="log-message">{{ log.message }}</p>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

interface LogEntry {
  id: string
  timestamp: Date
  message: string
  type: 'info' | 'success' | 'warning' | 'danger'
}

interface Props {
  logs: LogEntry[]
}

const props = defineProps<Props>()

const logContainerRef = ref<HTMLElement | null>(null)

function formatTime(date: Date): string {
  const d = new Date(date)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

watch(
  () => props.logs.length,
  () => {
    nextTick(() => {
      if (logContainerRef.value) {
        logContainerRef.value.scrollTop = 0
      }
    })
  }
)
</script>

<style scoped>
.growth-log {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 16px;
  box-sizing: border-box;
}

.log-container {
  flex: 1;
  max-height: 300px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.log-container::-webkit-scrollbar {
  width: 6px;
}

.log-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 3px;
}

.log-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
}

.log-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
  color: #64748b;
}

.empty-text {
  font-size: 13px;
}

.log-list {
  display: flex;
  flex-direction: column;
}

.log-item {
  display: flex;
  gap: 12px;
  position: relative;
}

.log-enter-active {
  transition: all 0.3s ease-out;
}

.log-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.log-enter-to {
  opacity: 1;
  transform: translateX(0);
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
}

.timeline-dot.info {
  background: #94a3b8;
  box-shadow: 0 0 6px #94a3b8;
}

.timeline-dot.success {
  background: #4ade80;
  box-shadow: 0 0 6px #4ade80;
}

.timeline-dot.warning {
  background: #fbbf24;
  box-shadow: 0 0 6px #fbbf24;
}

.timeline-dot.danger {
  background: #f87171;
  box-shadow: 0 0 6px #f87171;
}

.timeline-line {
  width: 2px;
  flex: 1;
  background: rgba(255, 255, 255, 0.08);
  margin-top: 4px;
}

.log-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-bottom: 14px;
}

.log-time {
  font-size: 11px;
  color: #64748b;
  font-variant-numeric: tabular-nums;
}

.log-message {
  font-size: 13px;
  color: #cbd5e1;
  margin: 0;
  line-height: 1.5;
}
</style>
