<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { AudioController } from './components/AudioController'
import { VisualizationPanel } from './components/VisualizationPanel'
import type { EffectType, Sensitivity, ColorTheme, VisualizationPreset, AudioDataPayload } from './types'
import { COLOR_THEMES } from './types'

const audioController = new AudioController()
const canvasRef = ref<HTMLCanvasElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const dropAreaRef = ref<HTMLDivElement | null>(null)
let vizPanel: VisualizationPanel | null = null

const isAudioLoaded = ref(false)
const isPlaying = ref(false)
const fileName = ref('')
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(80)
const fps = ref(0)
const sampleRate = ref(0)
const switchTime = ref(0)
const isDragging = ref(false)
const isSeeking = ref(false)

const effectType = ref<EffectType>('bars')
const particleSpeed = ref(1.0)
const sensitivity = ref<Sensitivity>('medium')
const colorTheme = ref<ColorTheme>('neon')

const presets = ref<VisualizationPreset[]>([])
const selectedPresetId = ref<string>('')
const presetNameInput = ref('')
const showPresetDropdown = ref(false)

const PRESETS_KEY = 'music-visualizer-presets'

const formatTime = (sec: number): string => {
  if (!sec || isNaN(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

const progressPercent = computed(() => {
  if (duration.value === 0) return 0
  return (currentTime.value / duration.value) * 100
})

const loadPresets = (): void => {
  try {
    const saved = localStorage.getItem(PRESETS_KEY)
    if (saved) {
      presets.value = JSON.parse(saved)
    }
  } catch (_e) { /* noop */ }
}

const savePresetsToStorage = (): void => {
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets.value))
}

const saveCurrentPreset = (): void => {
  const name = presetNameInput.value.trim() || `预设 ${presets.value.length + 1}`
  if (presets.value.length >= 5) {
    presets.value.shift()
  }
  const preset: VisualizationPreset = {
    id: Date.now().toString(),
    name,
    effectType: effectType.value,
    particleSpeed: particleSpeed.value,
    sensitivity: sensitivity.value,
    colorTheme: colorTheme.value,
    createdAt: Date.now()
  }
  presets.value.push(preset)
  savePresetsToStorage()
  presetNameInput.value = ''
}

const applyPreset = (preset: VisualizationPreset): void => {
  effectType.value = preset.effectType
  particleSpeed.value = preset.particleSpeed
  sensitivity.value = preset.sensitivity
  colorTheme.value = preset.colorTheme
  selectedPresetId.value = preset.id
  showPresetDropdown.value = false
  nextTick(() => {
    if (vizPanel) {
      vizPanel.setEffectType(effectType.value)
      vizPanel.setParticleSpeed(particleSpeed.value)
      vizPanel.setSensitivity(sensitivity.value)
      vizPanel.setColorTheme(colorTheme.value)
    }
  })
}

const deletePreset = (id: string): void => {
  presets.value = presets.value.filter(p => p.id !== id)
  savePresetsToStorage()
  if (selectedPresetId.value === id) {
    selectedPresetId.value = ''
  }
}

const handleFileSelect = (e: Event): void => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) loadAudioFile(file)
}

const handleDrop = (e: DragEvent): void => {
  e.preventDefault()
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file && (file.type.startsWith('audio/') || /\.(mp3|wav)$/i.test(file.name))) {
    loadAudioFile(file)
  }
}

const handleDragOver = (e: DragEvent): void => {
  e.preventDefault()
  isDragging.value = true
}

const handleDragLeave = (): void => {
  isDragging.value = false
}

const loadAudioFile = async (file: File): Promise<void> => {
  try {
    await audioController.loadFile(file)
    fileName.value = file.name
    isAudioLoaded.value = true
    currentTime.value = 0
    duration.value = audioController.getDuration()
    sampleRate.value = audioController.getSampleRate()
  } catch (err) {
    console.error('加载音频失败:', err)
  }
}

const triggerUpload = (): void => {
  fileInputRef.value?.click()
}

const togglePlay = (): void => {
  if (!isAudioLoaded.value) return
  if (isPlaying.value) {
    audioController.pause()
  } else {
    audioController.play()
  }
}

const stopPlayback = (): void => {
  audioController.stop()
  currentTime.value = 0
}

const handleVolumeChange = (): void => {
  audioController.setVolume(volume.value / 100)
}

const handleProgressClick = (e: MouseEvent): void => {
  if (!duration.value) return
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const percent = (e.clientX - rect.left) / rect.width
  audioController.seek(percent * duration.value)
  currentTime.value = percent * duration.value
}

const handleProgressInput = (e: Event): void => {
  if (!duration.value) return
  const target = e.target as HTMLInputElement
  currentTime.value = parseFloat(target.value)
}

const handleProgressMouseDown = (): void => {
  isSeeking.value = true
}

const handleProgressMouseUp = (): void => {
  if (isSeeking.value) {
    audioController.seek(currentTime.value)
    isSeeking.value = false
  }
}

const switchEffect = (type: EffectType): void => {
  effectType.value = type
  if (vizPanel) vizPanel.setEffectType(type)
}

watch(particleSpeed, (v) => {
  if (vizPanel) vizPanel.setParticleSpeed(v)
})

watch(sensitivity, (v) => {
  if (vizPanel) vizPanel.setSensitivity(v)
})

watch(colorTheme, (v) => {
  if (vizPanel) vizPanel.setColorTheme(v)
})

const handleResize = (): void => {
  if (vizPanel) vizPanel.resize()
}

onMounted(() => {
  if (canvasRef.value) {
    vizPanel = new VisualizationPanel(canvasRef.value)
    vizPanel.setOnFpsUpdate((v) => { fps.value = v })
    vizPanel.setOnSwitchTime((v) => { switchTime.value = v })
    vizPanel.start()
  }

  audioController.onStateChange((playing) => { isPlaying.value = playing })
  audioController.onProgress((current, dur) => {
    if (!isSeeking.value) {
      currentTime.value = current
      duration.value = dur
    }
  })
  audioController.onLoaded((name, dur) => {
    fileName.value = name
    duration.value = dur
    sampleRate.value = audioController.getSampleRate()
  })
  audioController.onAudioData((data: AudioDataPayload) => {
    if (vizPanel) vizPanel.updateData(data)
  })

  audioController.setVolume(volume.value / 100)
  loadPresets()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  vizPanel?.dispose()
  audioController.dispose()
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div class="app-container">
    <div class="bg-gradient"></div>
    <div class="bg-noise"></div>

    <div class="upload-overlay" v-if="!isAudioLoaded">
      <div
        ref="dropAreaRef"
        class="upload-area"
        :class="{ dragging: isDragging }"
        @click="triggerUpload"
        @drop="handleDrop"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
      >
        <div class="upload-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
        </div>
        <div class="upload-title">点击或拖拽上传音频</div>
        <div class="upload-subtitle">支持 MP3、WAV 格式</div>
        <input
          ref="fileInputRef"
          type="file"
          accept="audio/*,.mp3,.wav"
          style="display: none"
          @change="handleFileSelect"
        />
      </div>
    </div>

    <div class="performance-panel" v-if="isAudioLoaded">
      <div class="perf-item">
        <span class="perf-label">FPS</span>
        <span class="perf-value" :class="{ low: fps < 45 }">{{ fps }}</span>
      </div>
      <div class="perf-item">
        <span class="perf-label">采样率</span>
        <span class="perf-value">{{ sampleRate }}Hz</span>
      </div>
      <div class="perf-item">
        <span class="perf-label">切换耗时</span>
        <span class="perf-value">{{ switchTime.toFixed(1) }}ms</span>
      </div>
    </div>

    <div class="sidebar" v-if="isAudioLoaded">
      <div class="panel-title">可视化参数</div>

      <div class="param-group">
        <label class="param-label">粒子扩散速度</label>
        <div class="param-value">{{ particleSpeed.toFixed(1) }}x</div>
        <input
          type="range"
          class="slider"
          min="0.1"
          max="3"
          step="0.1"
          v-model="particleSpeed"
        />
      </div>

      <div class="param-group">
        <label class="param-label">频谱灵敏度</label>
        <div class="sensitivity-buttons">
          <button
            v-for="s in (['low', 'medium', 'high'] as Sensitivity[])"
            :key="s"
            class="sensitivity-btn"
            :class="{ active: sensitivity === s }"
            @click="sensitivity = s"
          >
            {{ s === 'low' ? '低' : s === 'medium' ? '中' : '高' }}
          </button>
        </div>
      </div>

      <div class="param-group">
        <label class="param-label">颜色主题</label>
        <div class="theme-buttons">
          <button
            v-for="(theme, key) in COLOR_THEMES"
            :key="key"
            class="theme-btn"
            :class="{ active: colorTheme === key }"
            :style="{ '--theme-color': theme.primary }"
            @click="colorTheme = key as ColorTheme"
          >
            <span class="theme-dot"></span>
            {{ theme.name }}
          </button>
        </div>
      </div>

      <div class="param-group">
        <label class="param-label">预设管理</label>
        <div class="preset-input-row">
          <input
            type="text"
            class="preset-name-input"
            placeholder="预设名称"
            v-model="presetNameInput"
          />
          <button class="save-preset-btn" @click="saveCurrentPreset" :disabled="presets.length >= 5 && !presetNameInput">
            保存
          </button>
        </div>
        <div class="preset-dropdown-wrapper" @click.stop>
          <div class="preset-selector" @click="showPresetDropdown = !showPresetDropdown">
            <span>{{ presets.find(p => p.id === selectedPresetId)?.name || '选择预设...' }}</span>
            <svg class="dropdown-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
          <div class="preset-dropdown" v-show="showPresetDropdown">
            <div v-if="presets.length === 0" class="preset-empty">暂无预设</div>
            <div
              v-for="preset in presets"
              :key="preset.id"
              class="preset-item"
              :class="{ active: selectedPresetId === preset.id }"
            >
              <span class="preset-item-name" @click="applyPreset(preset)">{{ preset.name }}</span>
              <button class="preset-delete" @click="deletePreset(preset.id)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div class="preset-count">{{ presets.length }}/5</div>
      </div>
    </div>

    <div class="canvas-wrapper">
      <canvas ref="canvasRef" class="viz-canvas"></canvas>
    </div>

    <div class="control-panel" v-if="isAudioLoaded">
      <div class="file-name">{{ fileName }}</div>

      <div class="progress-container">
        <span class="time-label">{{ formatTime(currentTime) }}</span>
        <div class="progress-bar-wrapper" @click="handleProgressClick">
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" :style="{ width: progressPercent + '%' }"></div>
          </div>
          <input
            type="range"
            class="progress-slider"
            min="0"
            :max="duration || 0"
            step="0.1"
            :value="currentTime"
            @input="handleProgressInput"
            @mousedown="handleProgressMouseDown"
            @mouseup="handleProgressMouseUp"
            @touchend="handleProgressMouseUp"
          />
        </div>
        <span class="time-label">{{ formatTime(duration) }}</span>
      </div>

      <div class="controls-row">
        <div class="play-controls">
          <button class="ctrl-btn" @click="stopPlayback" title="停止">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12"></rect>
            </svg>
          </button>
          <button class="ctrl-btn play-btn" @click="togglePlay" :title="isPlaying ? '暂停' : '播放'">
            <svg v-if="!isPlaying" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="6 4 20 12 6 20 6 4"></polygon>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
          </button>
          <div class="volume-control">
            <svg class="volume-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            </svg>
            <input
              type="range"
              class="volume-slider"
              min="0"
              max="100"
              v-model="volume"
              @input="handleVolumeChange"
            />
          </div>
        </div>

        <div class="effect-buttons">
          <button
            class="effect-btn"
            :class="{ active: effectType === 'bars' }"
            @click="switchEffect('bars')"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="4" y1="21" x2="4" y2="14"></line>
              <line x1="8" y1="21" x2="8" y2="10"></line>
              <line x1="12" y1="21" x2="12" y2="6"></line>
              <line x1="16" y1="21" x2="16" y2="8"></line>
              <line x1="20" y1="21" x2="20" y2="12"></line>
            </svg>
            <span>柱状频谱</span>
          </button>
          <button
            class="effect-btn"
            :class="{ active: effectType === 'waveform' }"
            @click="switchEffect('waveform')"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="1 12 5 12 8 4 12 20 16 8 20 12 23 12"></polyline>
            </svg>
            <span>波形折线</span>
          </button>
          <button
            class="effect-btn"
            :class="{ active: effectType === 'particles' }"
            @click="switchEffect('particles')"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"></circle>
              <circle cx="12" cy="12" r="8"></circle>
              <circle cx="12" cy="12" r="11"></circle>
            </svg>
            <span>环形粒子</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body, #app {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: #0a0e27;
  color: #fff;
}

.app-container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.bg-gradient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 20% 30%, rgba(138, 43, 226, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 70%, rgba(0, 119, 190, 0.15) 0%, transparent 50%),
    linear-gradient(180deg, #0a0e27 0%, #0d1335 100%);
  z-index: 0;
}

.bg-noise {
  position: absolute;
  inset: 0;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  z-index: 1;
}

.upload-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  background: rgba(10, 14, 39, 0.7);
  backdrop-filter: blur(8px);
}

.upload-area {
  border: 2px dashed rgba(138, 43, 226, 0.5);
  border-radius: 20px;
  padding: 60px 80px;
  text-align: center;
  cursor: pointer;
  background: rgba(138, 43, 226, 0.05);
  transition: all 0.2s ease;
}

.upload-area:hover,
.upload-area.dragging {
  border-color: #8a2be2;
  background: rgba(138, 43, 226, 0.12);
  transform: scale(1.02);
}

.upload-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 20px;
  color: #8a2be2;
}

.upload-icon svg {
  width: 100%;
  height: 100%;
}

.upload-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #fff;
}

.upload-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
}

.performance-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  gap: 16px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  z-index: 50;
}

.perf-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.perf-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

.perf-value {
  font-size: 15px;
  font-weight: 600;
  color: #8a2be2;
  font-variant-numeric: tabular-nums;
}

.perf-value.low {
  color: #ff4d4d;
}

.sidebar {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  width: 260px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  z-index: 50;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 24px;
  color: #fff;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.param-group {
  margin-bottom: 24px;
}

.param-label {
  display: block;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8px;
}

.param-value {
  float: right;
  font-size: 13px;
  color: #8a2be2;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.slider,
.volume-slider,
.progress-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.slider::-webkit-slider-thumb,
.volume-slider::-webkit-slider-thumb,
.progress-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  background: #8a2be2;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(138, 43, 226, 0.5);
  transition: all 0.2s ease;
}

.slider::-webkit-slider-thumb:hover,
.volume-slider::-webkit-slider-thumb:hover,
.progress-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 0 16px rgba(138, 43, 226, 0.8);
}

.sensitivity-buttons {
  display: flex;
  gap: 8px;
}

.sensitivity-btn {
  flex: 1;
  padding: 8px 12px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.sensitivity-btn:hover {
  background: rgba(138, 43, 226, 0.15);
  border-color: rgba(138, 43, 226, 0.3);
}

.sensitivity-btn.active {
  background: rgba(138, 43, 226, 0.3);
  border-color: #8a2be2;
  color: #fff;
}

.theme-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.theme-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.theme-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.theme-btn.active {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--theme-color);
  color: #fff;
}

.theme-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--theme-color);
  box-shadow: 0 0 8px var(--theme-color);
}

.preset-input-row {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.preset-name-input {
  flex: 1;
  padding: 8px 12px;
  font-size: 13px;
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  outline: none;
  transition: all 0.2s ease;
  font-family: inherit;
}

.preset-name-input:focus {
  border-color: #8a2be2;
}

.preset-name-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.save-preset-btn {
  padding: 8px 16px;
  font-size: 13px;
  color: #fff;
  background: #8a2be2;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.save-preset-btn:hover:not(:disabled) {
  background: #9b3fff;
  transform: scale(1.05);
  box-shadow: 0 0 16px rgba(138, 43, 226, 0.5);
}

.save-preset-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.preset-dropdown-wrapper {
  position: relative;
}

.preset-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.preset-selector:hover {
  border-color: rgba(138, 43, 226, 0.5);
}

.dropdown-arrow {
  width: 14px;
  height: 14px;
  transition: transform 0.2s ease;
}

.preset-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  max-height: 200px;
  overflow-y: auto;
  background: rgba(20, 25, 55, 0.98);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  z-index: 10;
}

.preset-empty {
  padding: 12px;
  text-align: center;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
}

.preset-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.preset-item:hover {
  background: rgba(138, 43, 226, 0.15);
}

.preset-item.active {
  background: rgba(138, 43, 226, 0.25);
}

.preset-item-name {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  flex: 1;
}

.preset-delete {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.preset-delete:hover {
  background: rgba(255, 77, 77, 0.2);
  color: #ff4d4d;
}

.preset-delete svg {
  width: 14px;
  height: 14px;
}

.preset-count {
  margin-top: 6px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  text-align: right;
}

.canvas-wrapper {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 320px 200px 320px;
  z-index: 10;
}

.viz-canvas {
  width: 100%;
  height: 100%;
  min-width: 800px;
  min-height: 500px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 16px;
  box-shadow: 0 0 60px rgba(138, 43, 226, 0.1);
}

.control-panel {
  position: absolute;
  left: 50%;
  bottom: 20px;
  transform: translateX(-50%);
  width: calc(100% - 40px);
  max-width: 900px;
  padding: 20px 28px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  z-index: 50;
}

.file-name {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.time-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  font-variant-numeric: tabular-nums;
  min-width: 40px;
  text-align: center;
}

.progress-bar-wrapper {
  flex: 1;
  position: relative;
  height: 16px;
  display: flex;
  align-items: center;
  cursor: pointer;
}

.progress-bar-bg {
  position: absolute;
  left: 0;
  right: 0;
  height: 4px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #8a2be2, #ff69b4);
  border-radius: 2px;
  transition: width 0.1s linear;
}

.progress-slider {
  position: absolute;
  left: 0;
  right: 0;
  width: 100%;
  opacity: 0;
  cursor: pointer;
}

.controls-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.play-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ctrl-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
}

.ctrl-btn:hover {
  transform: scale(1.05);
  background: rgba(138, 43, 226, 0.2);
  border-color: rgba(138, 43, 226, 0.4);
  box-shadow: 0 0 20px rgba(138, 43, 226, 0.3);
}

.ctrl-btn svg {
  width: 18px;
  height: 18px;
}

.play-btn {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #8a2be2, #6610c4);
  border: none;
  box-shadow: 0 0 24px rgba(138, 43, 226, 0.4);
}

.play-btn:hover {
  transform: scale(1.08);
  box-shadow: 0 0 32px rgba(138, 43, 226, 0.6);
}

.play-btn svg {
  width: 22px;
  height: 22px;
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: 12px;
  padding-left: 16px;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
}

.volume-icon {
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.6);
}

.volume-slider {
  width: 100px;
}

.effect-buttons {
  display: flex;
  gap: 10px;
}

.effect-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.effect-btn:hover {
  transform: scale(1.05);
  background: rgba(138, 43, 226, 0.15);
  border-color: rgba(138, 43, 226, 0.4);
  box-shadow: 0 0 16px rgba(138, 43, 226, 0.25);
  color: #fff;
}

.effect-btn.active {
  background: linear-gradient(135deg, rgba(138, 43, 226, 0.4), rgba(138, 43, 226, 0.2));
  border-color: #8a2be2;
  color: #fff;
  box-shadow: 0 0 20px rgba(138, 43, 226, 0.4);
}

.effect-btn svg {
  width: 18px;
  height: 18px;
}
</style>
