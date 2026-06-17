<template>
  <div class="app-root" :class="{ 'result-bg': store.isFinished }">
    <div v-if="!store.isFinished" class="main-layout">
      <div class="top-bar">
        <div class="difficulty-badge" :class="difficultyClass">
          {{ difficultyLabel }}
        </div>
        <div class="bpm-display">{{ store.bpm }}</div>
      </div>

      <div class="stage-wrapper">
        <div class="stage-inner">
          <Stage
            ref="stageRef"
            :is-playing="store.isPlaying"
            :pulse-duration="pulseDuration"
            @tap="handleTap"
          />
        </div>
      </div>

      <div class="feedback-layer">
        <TransitionGroup name="feedback">
          <div
            v-for="fb in feedbacks"
            :key="fb.id"
            class="feedback-item"
            :class="fb.result"
            :style="{ left: fb.x + 'px', top: fb.y + 'px' }"
          >
            <template v-if="fb.result === 'perfect'">+2</template>
            <template v-else-if="fb.result === 'good'">+1</template>
            <template v-else>
              <span class="miss-x">X</span>
            </template>
          </div>
        </TransitionGroup>
      </div>

      <StatsPanel
        v-if="store.completedMeasures > 0"
        :accuracy="store.accuracy"
        :perfect="store.perfectCount"
        :good="store.goodCount"
        :miss="store.missCount"
        @reset="handleReset"
      />

      <div v-if="!store.isPlaying" class="start-overlay">
        <div class="start-content" @click.stop>
          <h1 class="start-title">视觉节奏训练器</h1>
          <p class="start-hint">选择难度后点击开始</p>
          <div class="difficulty-select">
            <button
              v-for="d in difficulties"
              :key="d.value"
              class="diff-btn"
              :class="{ active: store.difficulty === d.value, [d.value]: true }"
              @click.stop="selectDifficulty(d.value)"
            >
              {{ d.label }}
            </button>
          </div>
          <button class="start-btn" @click.stop="startGame">
            开始训练
          </button>
        </div>
      </div>
    </div>

    <ResultScreen
      v-if="store.isFinished"
      :score="store.finalScore"
      @retry="handleReset"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRhythmStore } from './stores/rhythmStore'
import { BeatEngine } from './BeatEngine'
import Stage from './components/Stage.vue'
import StatsPanel from './components/StatsPanel.vue'
import ResultScreen from './components/ResultScreen.vue'
import type { Difficulty, TapResult } from './types'

interface FeedbackItem {
  id: number
  result: TapResult
  x: number
  y: number
  timestamp: number
}

const store = useRhythmStore()
const stageRef = ref<InstanceType<typeof Stage> | null>(null)
const feedbacks = ref<FeedbackItem[]>([])
let feedbackIdCounter = 0
let feedbackCleanupTimer: ReturnType<typeof setInterval> | null = null

const pulseDuration = ref(1.0)

const engine = new BeatEngine()

const difficulties: { value: Difficulty; label: string }[] = [
  { value: 'beginner', label: '初级' },
  { value: 'intermediate', label: '中级' },
  { value: 'advanced', label: '高级' }
]

const difficultyLabel = computed(() => {
  const map: Record<Difficulty, string> = {
    beginner: '初级',
    intermediate: '中级',
    advanced: '高级'
  }
  return map[store.difficulty]
})

const difficultyClass = computed(() => `diff-${store.difficulty}`)

engine.onDeviationEvent((result) => {
  store.commitTap(
    performance.now(),
    result.deviation,
    result.result,
    engine.getCurrentBeat()?.beatIndex ?? 0
  )
  addFeedback(result.result)
})

engine.onBeatEvent((info) => {
  store.updateBeat(info.beatIndex, info.measureIndex)
  stageRef.value?.triggerPulse()
})

engine.onMeasureEvent((measureIndex) => {
  store.completeMeasure(measureIndex)
})

function selectDifficulty(d: Difficulty) {
  store.setDifficulty(d)
}

function startGame() {
  store.reset()
  engine.setDifficulty(store.difficulty)
  pulseDuration.value = engine.getPulseDuration()
  store.setBPM(engine.getBPM())
  store.setPlaying(true)
  feedbacks.value = []

  setTimeout(() => {
    stageRef.value?.stopRendering()
    stageRef.value?.startRendering()
    engine.start()
  }, 100)
}

function handleTap(timestamp: number) {
  if (!store.isPlaying) return
  engine.registerTap(timestamp)
}

function addFeedback(result: TapResult) {
  const stageEl = document.querySelector('.stage-container')
  const rect = stageEl?.getBoundingClientRect()
  const x = rect ? rect.left + rect.width / 2 + (Math.random() - 0.5) * 60 : window.innerWidth / 2
  const y = rect ? rect.top + rect.height / 2 + (Math.random() - 0.5) * 40 : window.innerHeight / 2

  feedbacks.value.push({
    id: feedbackIdCounter++,
    result,
    x,
    y,
    timestamp: performance.now()
  })

  if (feedbacks.value.length > 12) {
    feedbacks.value = feedbacks.value.slice(-12)
  }
}

function handleReset() {
  engine.stop()
  stageRef.value?.stopRendering()
  store.reset()
  feedbacks.value = []
}

function handleKeydown(e: KeyboardEvent) {
  if (e.code === 'Space') {
    e.preventDefault()
    if (store.isPlaying) {
      handleTap(performance.now())
    }
  }
}

feedbackCleanupTimer = setInterval(() => {
  const now = performance.now()
  feedbacks.value = feedbacks.value.filter(f => now - f.timestamp < 1200)
}, 500)

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  engine.stop()
  if (feedbackCleanupTimer) clearInterval(feedbackCleanupTimer)
})
</script>

<style>
.app-root {
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #1A1A2E, #16213E);
  overflow: hidden;
  position: relative;
  transition: background 0.5s ease;
}

.app-root.result-bg {
  background: linear-gradient(135deg, #2D1B46, #1A1A2E);
}

.main-layout {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.top-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  z-index: 10;
  flex-shrink: 0;
}

.difficulty-badge {
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 0.5px;
  transition: all 0.2s ease;
}

.difficulty-badge.diff-beginner {
  background: #00BFFF;
}

.difficulty-badge.diff-intermediate {
  background: #533483;
}

.difficulty-badge.diff-advanced {
  background: #E94560;
  font-weight: 700;
}

.bpm-display {
  font-size: 24px;
  color: #EAEAEA;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.stage-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 24px 20px;
  min-height: 0;
}

.stage-inner {
  width: 60%;
  height: 70%;
  max-width: 900px;
  min-width: 300px;
  min-height: 300px;
  transition: width 0.3s ease;
}

@media (max-width: 767px) {
  .stage-inner {
    width: 95%;
    height: 60%;
  }
}

.feedback-layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 30;
}

.feedback-item {
  position: absolute;
  font-size: 14px;
  font-weight: 700;
  pointer-events: none;
  animation: floatUp 1s ease-out forwards;
}

.feedback-item.perfect {
  color: #00FF88;
  font-size: 18px;
}

.feedback-item.good {
  color: #00BFFF;
  font-size: 16px;
}

.feedback-item.miss {
  color: #FF4444;
  font-size: 20px;
  animation: shake 0.2s ease, floatUp 1s ease-out 0.2s forwards;
}

.miss-x {
  display: inline-block;
}

@keyframes floatUp {
  0% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(-60px);
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  50% { transform: translateX(6px); }
  75% { transform: translateX(-4px); }
}

.feedback-enter-active {
  animation: floatUp 1s ease-out forwards;
}

.feedback-leave-active {
  transition: opacity 0.2s;
}

.feedback-leave-to {
  opacity: 0;
}

.start-overlay {
  position: fixed;
  inset: 0;
  background: rgba(26, 26, 46, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.start-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.start-title {
  font-size: 36px;
  font-weight: 700;
  color: #EAEAEA;
  letter-spacing: 2px;
}

.start-hint {
  font-size: 16px;
  color: #A0A0A0;
}

.difficulty-select {
  display: flex;
  gap: 12px;
}

.diff-btn {
  padding: 10px 24px;
  border-radius: 24px;
  border: 2px solid transparent;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #333;
}

.diff-btn.beginner {
  border-color: #00BFFF;
}

.diff-btn.beginner.active {
  background: #00BFFF;
}

.diff-btn.intermediate {
  border-color: #533483;
}

.diff-btn.intermediate.active {
  background: #533483;
}

.diff-btn.advanced {
  border-color: #E94560;
}

.diff-btn.advanced.active {
  background: #E94560;
}

.diff-btn:hover {
  transform: scale(1.05);
}

.start-btn {
  margin-top: 12px;
  padding: 14px 48px;
  border-radius: 28px;
  border: none;
  background: #E94560;
  color: #fff;
  font-size: 20px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  letter-spacing: 1px;
}

.start-btn:hover {
  background: #D63851;
  transform: scale(1.05);
}

.start-btn:active {
  transform: scale(0.97);
}
</style>
