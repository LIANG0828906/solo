<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import ColorInput from '@/components/ColorInput.vue'
import ResultDisplay from '@/components/ResultDisplay.vue'
import {
  calculateContrastRatio,
  generateRecommendations,
  isValidColor,
  createDebounce,
} from '@/utils/contrastCalculator'
import type { ContrastResult, RecommendedColor } from '@/utils/contrastCalculator'

interface HistoryRecord {
  foreground: string
  background: string
  ratio: number
  timestamp: number
}

const HISTORY_KEY = 'contrast-checker-history'
const MAX_HISTORY = 10

const foreground = ref('#1E3A5F')
const background = ref('#F5F5F5')
const contrastResult = ref<ContrastResult | null>(null)
const recommendations = ref<RecommendedColor[]>([])
const history = ref<HistoryRecord[]>([])
const previewText = ref('色彩对比度检测器')

const foregroundValid = computed(() => isValidColor(foreground.value))
const backgroundValid = computed(() => isValidColor(background.value))

function computeResults() {
  if (foregroundValid.value && backgroundValid.value) {
    const result = calculateContrastRatio(foreground.value, background.value)
    contrastResult.value = result

    if (result && result.ratio < 4.5) {
      recommendations.value = generateRecommendations(foreground.value, background.value, 3)
    } else {
      recommendations.value = []
    }
  } else {
    contrastResult.value = null
    recommendations.value = []
  }
}

const debouncedCompute = createDebounce(computeResults, 16)

const debouncedSaveHistory = createDebounce(() => {
  saveHistory()
}, 300)

function saveHistory() {
  if (!contrastResult.value) return

  const record: HistoryRecord = {
    foreground: foreground.value,
    background: background.value,
    ratio: contrastResult.value.ratio,
    timestamp: Date.now(),
  }

  const existing = history.value.findIndex(
    (h) => h.foreground === record.foreground && h.background === record.background
  )
  if (existing !== -1) {
    history.value.splice(existing, 1)
  }

  history.value.unshift(record)

  if (history.value.length > MAX_HISTORY) {
    history.value = history.value.slice(0, MAX_HISTORY)
  }

  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.value))
  } catch {
    // storage full, ignore
  }
}

function loadHistory() {
  try {
    const stored = localStorage.getItem(HISTORY_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) {
        history.value = parsed.slice(0, MAX_HISTORY)
      }
    }
  } catch {
    history.value = []
  }
}

function clearHistory() {
  history.value = []
  try {
    localStorage.removeItem(HISTORY_KEY)
  } catch {
    // ignore
  }
}

function restoreFromHistory(record: HistoryRecord) {
  foreground.value = record.foreground
  background.value = record.background
  computeResults()
}

function applyRecommendation(hex: string) {
  foreground.value = hex
  computeResults()
}

watch([foreground, background], () => {
  debouncedCompute()
  debouncedSaveHistory()
})

function formatTime(ts: number): string {
  const d = new Date(ts)
  const h = d.getHours().toString().padStart(2, '0')
  const m = d.getMinutes().toString().padStart(2, '0')
  const s = d.getSeconds().toString().padStart(2, '0')
  return `${h}:${m}:${s}`
}

onMounted(() => {
  loadHistory()
  computeResults()
})
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <div class="header-content">
        <div class="logo-area">
          <div class="logo-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1E3A5F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 2a10 10 0 0 1 0 20"/>
            </svg>
          </div>
          <div class="header-text">
            <h1 class="app-title">色彩对比度检测器</h1>
            <p class="app-subtitle">WCAG 2.1 无障碍评估工具</p>
          </div>
        </div>
      </div>
    </header>

    <main class="main-layout">
      <div class="left-column">
        <section class="card input-card">
          <h2 class="section-title">颜色输入</h2>
          <div class="input-pair">
            <ColorInput v-model="foreground" label="前景色" />
            <ColorInput v-model="background" label="背景色" />
          </div>
          <div class="color-combo-bar" :style="{ background: `linear-gradient(135deg, ${foreground} 50%, ${background} 50%)` }"></div>
        </section>

        <section class="card result-card">
          <ResultDisplay
            :foreground="foreground"
            :background="background"
            :contrast-result="contrastResult"
            :recommendations="recommendations"
            :preview-text="previewText"
            @apply-color="applyRecommendation"
            @update:preview-text="previewText = $event"
          />
        </section>
      </div>

      <aside class="right-column">
        <section class="card history-card">
          <div class="history-header">
            <h2 class="section-title">历史记录</h2>
            <button
              v-if="history.length > 0"
              class="clear-btn"
              @click="clearHistory"
            >
              清空
            </button>
          </div>
          <div class="history-list" v-if="history.length > 0">
            <div
              v-for="(record, idx) in history"
              :key="idx"
              class="history-item"
              @click="restoreFromHistory(record)"
            >
              <div
                class="history-colors"
                :style="{
                  background: `linear-gradient(135deg, ${record.foreground} 50%, ${record.background} 50%)`
                }"
              ></div>
              <div class="history-info">
                <span class="history-ratio">{{ record.ratio.toFixed(2) }}:1</span>
                <span class="history-time">{{ formatTime(record.timestamp) }}</span>
              </div>
              <div class="history-hex">
                <span class="hex-tag" :style="{ color: record.foreground }">{{ record.foreground }}</span>
                <span class="hex-sep">/</span>
                <span class="hex-tag" :style="{ color: record.background }">{{ record.background }}</span>
              </div>
            </div>
          </div>
          <div class="history-empty" v-else>
            <span class="empty-text">暂无检测记录</span>
          </div>
        </section>
      </aside>
    </main>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  background: #F5F5F5;
}

.app-header {
  background: white;
  border-bottom: 1px solid #e8ecf0;
  padding: 16px 24px;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-text {
  display: flex;
  flex-direction: column;
}

.app-title {
  font-family: 'DM Serif Display', serif;
  font-size: 22px;
  color: #1E3A5F;
  margin: 0;
  line-height: 1.2;
}

.app-subtitle {
  font-family: 'Outfit', sans-serif;
  font-size: 12px;
  color: #94a3b8;
  margin: 0;
  font-weight: 400;
}

.main-layout {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
}

.left-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.right-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.02);
}

.section-title {
  font-family: 'Outfit', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #1E3A5F;
  margin: 0 0 16px 0;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.input-pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.color-combo-bar {
  height: 6px;
  border-radius: 3px;
  margin-top: 16px;
  transition: background 0.3s ease;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.history-header .section-title {
  margin-bottom: 0;
}

.clear-btn {
  font-family: 'Outfit', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  background: none;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 4px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-btn:hover {
  color: #ef4444;
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.04);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 520px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s ease, box-shadow 0.2s ease;
  border: 1px solid transparent;
}

.history-item:hover {
  background: #f8fafc;
  border-color: #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.history-colors {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  flex-shrink: 0;
  border: 2px solid rgba(0, 0, 0, 0.06);
}

.history-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex: 1;
  min-width: 0;
}

.history-ratio {
  font-family: 'Outfit', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #1E3A5F;
}

.history-time {
  font-family: 'Outfit', sans-serif;
  font-size: 11px;
  color: #94a3b8;
}

.history-hex {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.hex-tag {
  font-family: 'Outfit', sans-serif;
  font-size: 10px;
  font-weight: 600;
}

.hex-sep {
  color: #cbd5e1;
  font-size: 10px;
}

.history-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.empty-text {
  font-family: 'Outfit', sans-serif;
  font-size: 13px;
  color: #cbd5e1;
}

@media (max-width: 768px) {
  .main-layout {
    grid-template-columns: 1fr;
    padding: 16px;
    gap: 16px;
  }

  .input-pair {
    grid-template-columns: 1fr;
  }

  .app-header {
    padding: 12px 16px;
  }

  .card {
    padding: 16px;
  }
}
</style>
