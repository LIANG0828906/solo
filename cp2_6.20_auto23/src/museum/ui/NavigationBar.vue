<script setup lang="ts">
import { computed } from 'vue'
import { HALL_CONFIGS, HALL_ORDER, type HallId } from '../core/SceneManager'

interface Props {
  currentHall: HallId
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'navigate', hallId: HallId): void
}>()

const halls = computed(() => {
  return HALL_ORDER.map((id) => ({
    id,
    name: HALL_CONFIGS[id].name,
    color: `#${HALL_CONFIGS[id].wallColor.toString(16).padStart(6, '0')}`,
  }))
})

const handleClick = (id: HallId) => {
  if (id !== props.currentHall) {
    emit('navigate', id)
  }
}
</script>

<template>
  <div class="nav-bar">
    <div class="nav-inner">
      <div class="nav-title">
        <span class="nav-title-main">VIRTUAL MUSEUM</span>
        <span class="nav-title-sub">虚拟博物馆</span>
      </div>
      <div class="nav-dots">
        <button
          v-for="hall in halls"
          :key="hall.id"
          class="nav-dot-btn"
          :class="{ active: currentHall === hall.id }"
          :style="{ '--hall-color': hall.color }"
          @click="handleClick(hall.id)"
          :title="hall.name"
        >
          <span class="nav-dot" />
          <span class="nav-label">{{ hall.name }}</span>
        </button>
      </div>
      <div class="nav-hint">
        <span class="hint-key">W A S D</span>
        <span class="hint-text">移动</span>
        <span class="hint-key">鼠标</span>
        <span class="hint-text">视角</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.nav-bar {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  width: min(640px, 90vw);
  animation: slideUp 0.6s ease 0.5s both;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translate(-50%, 40px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

.nav-inner {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 14px 24px;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(20px) saturate(2);
  -webkit-backdrop-filter: blur(20px) saturate(2);
  border: 1px solid rgba(201, 169, 98, 0.22);
  border-radius: 20px;
  box-shadow:
    0 10px 40px rgba(0, 0, 0, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 0 15px rgba(201, 169, 98, 0.2),
    0 0 30px rgba(201, 169, 98, 0.08);
}

.nav-title {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  min-width: 110px;
}

.nav-title-main {
  font-family: 'Cinzel', serif;
  font-size: 13px;
  font-weight: 600;
  color: #c9a962;
  letter-spacing: 2px;
}

.nav-title-sub {
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 3px;
  margin-top: 2px;
}

.nav-dots {
  display: flex;
  gap: 8px;
  flex: 1;
  justify-content: center;
}

.nav-dot-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 10px;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.nav-dot-btn:hover {
  background: rgba(201, 169, 98, 0.1);
  transform: scale(1.08);
}

.nav-dot-btn:active {
  transform: scale(0.96);
}

.nav-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--hall-color);
  opacity: 0.4;
  border: 2px solid transparent;
  transition: opacity 0.3s ease, border-color 0.3s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.nav-dot-btn.active .nav-dot {
  opacity: 1;
  border-color: #c9a962;
  box-shadow:
    0 0 12px rgba(201, 169, 98, 0.6),
    0 0 24px rgba(201, 169, 98, 0.3);
  transform: scale(1.2);
}

.nav-label {
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 1px;
  transition: color 0.2s ease;
  white-space: nowrap;
}

.nav-dot-btn.active .nav-label,
.nav-dot-btn:hover .nav-label {
  color: #c9a962;
}

.nav-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 140px;
  justify-content: flex-end;
}

.hint-key {
  font-family: 'Cinzel', monospace;
  font-size: 9px;
  font-weight: 700;
  color: #c9a962;
  background: rgba(201, 169, 98, 0.1);
  padding: 3px 6px;
  border-radius: 4px;
  border: 1px solid rgba(201, 169, 98, 0.25);
  letter-spacing: 0.5px;
}

.hint-text {
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.3);
}

@media (max-width: 640px) {
  .nav-inner {
    padding: 12px 16px;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: center;
  }
  .nav-title {
    flex-direction: row;
    gap: 8px;
    align-items: center;
    min-width: auto;
  }
  .nav-title-sub {
    margin-top: 0;
  }
  .nav-hint {
    display: none;
  }
  .nav-dots {
    width: 100%;
    order: 3;
  }
}
</style>
