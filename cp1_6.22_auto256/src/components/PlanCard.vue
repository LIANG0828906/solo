<template>
  <div class="plan-card" @click="$emit('click')">
    <div class="plan-card-content">
      <div class="plan-header">
        <span class="sport-icon">{{ getSportIcon(plan.sport.type) }}</span>
        <h3 class="plan-name">{{ plan.sport.name }}</h3>
      </div>
      <div class="plan-info">
        <div class="info-row">
          <span class="info-label">时间</span>
          <span class="info-value">{{ formatDateTime(plan.weather) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">时长</span>
          <span class="info-value">{{ formatDuration(plan.sport.duration) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">难度</span>
          <span class="info-value">{{ '★'.repeat(plan.sport.difficulty) }}{{ '☆'.repeat(5 - plan.sport.difficulty) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">气温</span>
          <span class="info-value">{{ plan.weather.temperature }}°C · {{ plan.weather.windLevel }}级风</span>
        </div>
      </div>
    </div>
    <div class="plan-card-footer">
      <div class="weather-match">
        <span class="match-label">天气匹配度</span>
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: plan.weatherMatch + '%' }"
          ></div>
        </div>
        <span class="match-value">{{ plan.weatherMatch }}%</span>
      </div>
      <n-button type="primary" size="small" @click.stop="$emit('team')">
        发起组队
      </n-button>
    </div>
    <div class="card-gradient"></div>
  </div>
</template>

<script setup lang="ts">
import type { RecommendedPlan } from '@/types'
import { DATE_LABELS, TIME_SLOT_LABELS, SPORT_TYPE_LABELS } from '@/types'

const props = defineProps<{
  plan: RecommendedPlan
}>()

defineEmits<{
  (e: 'click'): void
  (e: 'team'): void
}>()

function getSportIcon(type: string): string {
  const icons: Record<string, string> = {
    cycling: '🚴',
    hiking: '🥾',
    running: '🏃',
    climbing: '🧗'
  }
  return icons[type] || '🏃'
}

function formatDateTime(weather: RecommendedPlan['weather']): string {
  return `${DATE_LABELS[weather.date]} ${TIME_SLOT_LABELS[weather.timeSlot]}`
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}分钟`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`
}
</script>

<style scoped>
.plan-card {
  position: relative;
  height: 200px;
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.plan-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.plan-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.sport-icon {
  font-size: 24px;
}

.plan-name {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #2d3436;
}

.plan-info {
  flex: 1;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 13px;
}

.info-label {
  color: #95a5a6;
}

.info-value {
  color: #2d3436;
  font-weight: 500;
}

.plan-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  position: relative;
  z-index: 2;
}

.weather-match {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.match-label {
  font-size: 12px;
  color: #95a5a6;
  white-space: nowrap;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #ecf0f1;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #FFEB3B 0%, #4CAF50 100%);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.match-value {
  font-size: 12px;
  font-weight: 600;
  color: #4CAF50;
  min-width: 36px;
  text-align: right;
}

.card-gradient {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 60px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.25) 0%, transparent 100%);
  pointer-events: none;
  border-radius: 0 0 12px 12px;
}
</style>
