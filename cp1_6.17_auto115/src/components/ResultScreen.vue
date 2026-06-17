<template>
  <div class="result-overlay">
    <div class="result-content">
      <div class="ring-container">
        <svg class="progress-ring" width="200" height="200" viewBox="0 0 200 200">
          <circle
            class="ring-bg"
            cx="100" cy="100" r="88"
            fill="none"
            stroke="#333333"
            stroke-width="12"
          />
          <circle
            class="ring-progress"
            cx="100" cy="100" r="88"
            fill="none"
            :stroke="ringGradientUrl ? 'url(#scoreGradient)' : '#00FF88'"
            stroke-width="12"
            stroke-linecap="round"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="dashOffset"
            transform="rotate(-90 100 100)"
          />
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#00FF88" />
              <stop offset="100%" stop-color="#E94560" />
            </linearGradient>
          </defs>
        </svg>
        <div class="score-text">{{ animatedScore }}</div>
      </div>
      <p class="encourage-text">{{ encourageText }}</p>
      <button class="retry-btn" @click="$emit('retry')">再来一次</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps<{
  score: number
}>()

defineEmits<{
  (e: 'retry'): void
}>()

const circumference = 2 * Math.PI * 88
const animatedScore = ref(0)
const ringGradientUrl = ref(true)

const encourageTexts = ['节奏大师！', '渐入佳境！', '保持节奏！']
const encourageText = encourageTexts[Math.floor(Math.random() * encourageTexts.length)]

const dashOffset = computed(() => {
  const progress = animatedScore.value / 100
  return circumference * (1 - progress)
})

watch(() => props.score, (newScore) => {
  animateScore(newScore)
}, { immediate: false })

function animateScore(target: number) {
  const duration = 1200
  const start = animatedScore.value
  const diff = target - start
  const startTime = performance.now()

  function step(now: number) {
    const elapsed = now - startTime
    const progress = Math.min(elapsed / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    animatedScore.value = Math.round(start + diff * eased)
    if (progress < 1) {
      requestAnimationFrame(step)
    }
  }

  requestAnimationFrame(step)
}

onMounted(() => {
  setTimeout(() => animateScore(props.score), 300)
})
</script>

<style scoped>
.result-overlay {
  position: fixed;
  inset: 0;
  background: linear-gradient(135deg, #2D1B46, #1A1A2E);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.result-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.ring-container {
  position: relative;
  width: 200px;
  height: 200px;
}

.progress-ring {
  width: 200px;
  height: 200px;
}

.ring-progress {
  transition: stroke-dashoffset 0.3s ease;
}

.score-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 68px;
  font-weight: 700;
  color: #EAEAEA;
  line-height: 1;
}

.encourage-text {
  font-size: 24px;
  color: #E94560;
  font-style: italic;
  font-weight: 600;
}

.retry-btn {
  width: 200px;
  height: 50px;
  border-radius: 28px;
  border: none;
  background: #533483;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s ease, transform 0.2s ease;
}

.retry-btn:hover {
  background: #6B4EAE;
  transform: scale(1.03);
}

.retry-btn:active {
  transform: scale(0.97);
}
</style>
