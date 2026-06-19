<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, h } from 'vue'
const PlayIcon = {
  render: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', style: 'width: 18px; height: 18px;' }, [
    h('polygon', { points: '5 3 19 12 5 21 5 3' })
  ])
}
const PauseIcon = {
  render: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', style: 'width: 18px; height: 18px;' }, [
    h('rect', { x: 6, y: 4, width: 4, height: 16 }),
    h('rect', { x: 14, y: 4, width: 4, height: 16 })
  ])
}
const StopIcon = {
  render: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', style: 'width: 14px; height: 14px;' }, [
    h('rect', { x: 4, y: 4, width: 16, height: 16 })
  ])
}
const XIcon = {
  render: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', style: 'width: 20px; height: 20px;' }, [
    h('line', { x1: 18, y1: 6, x2: 6, y2: 18 }),
    h('line', { x1: 6, y1: 6, x2: 18, y2: 18 })
  ])
}
import type { ExhibitData } from '../exhibits/ExhibitFactory'
import { AudioGuide, type AudioState } from '../audio/AudioGuide'

interface Props {
  exhibit: ExhibitData | null
  visible: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'audioPlay', id: string): void
  (e: 'audioPause', id: string): void
  (e: 'audioStop', id: string): void
}>()

const audioGuide = new AudioGuide()
const audioState = ref<AudioState>('idle')
const audioProgress = ref(0)
const cardRef = ref<HTMLElement | null>(null)
const isAnimating = ref(false)
const show = ref(false)

const formattedTime = computed(() => {
  const current = audioProgress.value * (props.exhibit?.audioDuration || 0)
  const total = props.exhibit?.audioDuration || 0
  const fmt = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }
  return `${fmt(current)} / ${fmt(total)}`
})

watch(
  () => props.visible,
  (val) => {
    if (val) {
      show.value = true
      isAnimating.value = true
      requestAnimationFrame(() => {
        setTimeout(() => {
          isAnimating.value = false
        }, 300)
      })
      if (props.exhibit) {
        audioGuide.load(props.exhibit.id, props.exhibit.audioDuration)
      }
    } else {
      isAnimating.value = true
      audioGuide.stop()
      setTimeout(() => {
        show.value = false
        isAnimating.value = false
      }, 300)
    }
  }
)

onMounted(() => {
  audioGuide.on('stateChange', (s: AudioState) => {
    audioState.value = s
  })
  audioGuide.on('progress', (p: number) => {
    audioProgress.value = p
  })
  audioGuide.on('play', (id: string) => emit('audioPlay', id))
  audioGuide.on('pause', (id: string) => emit('audioPause', id))
  audioGuide.on('stop', (id: string) => emit('audioStop', id))
})

onUnmounted(() => {
  audioGuide.destroy()
})

const handlePlay = () => {
  if (audioState.value === 'playing') {
    audioGuide.pause()
  } else {
    audioGuide.play()
  }
}

const handleStop = () => {
  audioGuide.stop()
}

const handleClose = () => {
  emit('close')
}

const handleBackdrop = (e: MouseEvent) => {
  if (e.target === e.currentTarget) {
    handleClose()
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="show"
        class="card-overlay"
        @click="handleBackdrop"
      >
        <div
          ref="cardRef"
          class="exhibit-card"
          :class="{ visible: visible, 'anim-out': !visible && isAnimating }"
          @click.stop
        >
          <button class="close-btn" @click="handleClose" aria-label="关闭">
            <XIcon />
          </button>

          <div v-if="exhibit" class="card-content">
            <div class="card-header">
              <div class="card-type-badge">{{ exhibit.type === 'painting' ? '油画' : exhibit.type === 'sculpture' ? '雕塑' : '装置' }}</div>
              <h2 class="card-title">{{ exhibit.name }}</h2>
              <div class="card-meta">
                <span class="meta-author">{{ exhibit.author }}</span>
                <span class="meta-divider">·</span>
                <span class="meta-year">{{ exhibit.year }}</span>
              </div>
            </div>

            <div class="card-image">
              <div class="image-frame">
                <div class="image-placeholder" :style="{ backgroundImage: `linear-gradient(135deg, #c9a96233, #e08a3c33)` }">
                  <div class="placeholder-text">ARTWORK PREVIEW</div>
                </div>
              </div>
            </div>

            <div class="card-details">
              <div class="detail-row">
                <span class="detail-label">材质</span>
                <span class="detail-value">{{ exhibit.material }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">尺寸</span>
                <span class="detail-value">{{ exhibit.dimensions }}</span>
              </div>
            </div>

            <p class="card-description">{{ exhibit.description }}</p>

            <div class="audio-section">
              <div class="audio-label">
                <span class="audio-icon">♪</span>
                语音导览
              </div>
              <div class="audio-controls">
                <button
                  class="audio-btn play-btn"
                  :class="{ playing: audioState === 'playing' }"
                  @click="handlePlay"
                >
                  <PauseIcon v-if="audioState === 'playing'" />
                  <PlayIcon v-else />
                </button>
                <div class="progress-wrap">
                  <div class="progress-track">
                    <div
                      class="progress-fill"
                      :style="{ width: `${audioProgress * 100}%` }"
                    />
                  </div>
                  <span class="progress-time">{{ formattedTime }}</span>
                </div>
                <button
                  class="audio-btn stop-btn"
                  @click="handleStop"
                  :disabled="audioState === 'idle' || audioState === 'stopped'"
                >
                  <StopIcon />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.card-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 20px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.exhibit-card {
  position: relative;
  width: min(520px, 100%);
  max-height: 90vh;
  overflow-y: auto;
  background: rgba(30, 30, 38, 0.82);
  backdrop-filter: blur(28px) saturate(1.6);
  -webkit-backdrop-filter: blur(28px) saturate(1.6);
  border: 1px solid rgba(201, 169, 98, 0.25);
  border-radius: 24px;
  box-shadow:
    0 30px 80px rgba(0, 0, 0, 0.6),
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 0 0 1px rgba(255, 255, 255, 0.02) inset;
  transform-origin: center center;
  animation: cardIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.exhibit-card.anim-out {
  animation: cardOut 0.3s cubic-bezier(0.4, 0, 1, 1) both;
}

@keyframes cardIn {
  from {
    opacity: 0;
    transform: scale(0.88) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes cardOut {
  from {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
  to {
    opacity: 0;
    transform: scale(0.92) translateY(10px);
  }
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 2;
}

.close-btn:hover {
  background: rgba(224, 138, 60, 0.15);
  border-color: rgba(224, 138, 60, 0.4);
  color: #e08a3c;
  transform: rotate(90deg) scale(1.1);
}

.close-btn:active {
  transform: rotate(90deg) scale(0.95);
}

.card-content {
  padding: 32px 32px 28px;
}

.card-header {
  margin-bottom: 20px;
  padding-right: 32px;
}

.card-type-badge {
  display: inline-block;
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 11px;
  font-weight: 500;
  color: #c9a962;
  background: rgba(201, 169, 98, 0.1);
  border: 1px solid rgba(201, 169, 98, 0.25);
  padding: 4px 12px;
  border-radius: 20px;
  letter-spacing: 2px;
  margin-bottom: 14px;
}

.card-title {
  font-family: 'Cinzel', 'Noto Sans SC', serif;
  font-size: 26px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 1px;
  line-height: 1.3;
  margin: 0 0 10px 0;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Noto Sans SC', sans-serif;
}

.meta-author {
  font-size: 14px;
  font-weight: 500;
  color: #c9a962;
}

.meta-divider {
  color: rgba(255, 255, 255, 0.2);
}

.meta-year {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
}

.card-image {
  margin-bottom: 22px;
}

.image-frame {
  position: relative;
  aspect-ratio: 4 / 3;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(201, 169, 98, 0.2);
  box-shadow:
    inset 0 0 0 3px rgba(201, 169, 98, 0.15),
    0 10px 30px rgba(0, 0, 0, 0.3);
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #c9a96233, #e08a3c33);
}

.placeholder-text {
  font-family: 'Cinzel', serif;
  font-size: 22px;
  font-weight: 600;
  color: #c9a962;
  letter-spacing: 4px;
  opacity: 0.7;
}

.card-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 18px;
  padding: 14px 18px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.detail-row {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.detail-label {
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.35);
  letter-spacing: 2px;
}

.detail-value {
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
}

.card-description {
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 13.5px;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 24px 0;
  letter-spacing: 0.3px;
}

.audio-section {
  padding: 18px 20px;
  background: linear-gradient(135deg, rgba(201, 169, 98, 0.08), rgba(224, 138, 60, 0.06));
  border-radius: 14px;
  border: 1px solid rgba(201, 169, 98, 0.15);
}

.audio-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: #c9a962;
  letter-spacing: 2px;
  margin-bottom: 14px;
}

.audio-icon {
  font-size: 16px;
  color: #e08a3c;
}

.audio-controls {
  display: flex;
  align-items: center;
  gap: 14px;
}

.audio-btn {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.play-btn {
  background: linear-gradient(135deg, #c9a962, #e08a3c);
  color: #1a1a1f;
  box-shadow:
    0 4px 16px rgba(224, 138, 60, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.play-btn:hover {
  transform: scale(1.1);
  box-shadow:
    0 6px 24px rgba(224, 138, 60, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.play-btn:active {
  transform: scale(0.95);
}

.play-btn.playing {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow:
      0 4px 16px rgba(224, 138, 60, 0.35),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }
  50% {
    box-shadow:
      0 4px 24px rgba(224, 138, 60, 0.6),
      0 0 0 6px rgba(224, 138, 60, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }
}

.stop-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
}

.stop-btn:hover:not(:disabled) {
  background: rgba(224, 138, 60, 0.12);
  border-color: rgba(224, 138, 60, 0.3);
  color: #e08a3c;
  transform: scale(1.1);
}

.stop-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.stop-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.progress-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.progress-track {
  height: 4px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #c9a962, #e08a3c);
  border-radius: 2px;
  transition: width 0.1s linear;
  box-shadow: 0 0 8px rgba(224, 138, 60, 0.5);
}

.progress-time {
  font-family: 'Cinzel', monospace;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 1px;
}

@media (max-width: 520px) {
  .card-content {
    padding: 24px 20px 22px;
  }
  .card-title {
    font-size: 20px;
  }
  .card-details {
    grid-template-columns: 1fr;
  }
}
</style>
