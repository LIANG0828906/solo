<template>
  <div
    class="swatch-wrapper"
    :class="{ 'is-dragging': isDragging }"
    :style="wrapperStyle"
    draggable="true"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
  >
    <div
      class="swatch-item"
      :style="swatchStyle"
      @click="togglePicker"
    >
      <div class="hex-label">{{ swatch.color }}</div>

      <div class="drag-handle" @click.stop>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
          <circle cx="5" cy="3" r="1.2" opacity="0.7" />
          <circle cx="11" cy="3" r="1.2" opacity="0.7" />
          <circle cx="5" cy="8" r="1.2" opacity="0.7" />
          <circle cx="11" cy="8" r="1.2" opacity="0.7" />
          <circle cx="5" cy="13" r="1.2" opacity="0.7" />
          <circle cx="11" cy="13" r="1.2" opacity="0.7" />
        </svg>
      </div>

      <div v-if="swatch.mood" class="mood-tag" :style="{ backgroundColor: moodBgColor }">
        {{ swatch.mood }}
      </div>

      <div
        v-if="showPicker"
        class="color-picker-popover"
        @click.stop
      >
        <div class="picker-header">
          <span>选择颜色</span>
          <button class="close-btn" @click="showPicker = false">×</button>
        </div>

        <div class="hsl-picker">
          <div class="hue-slider-wrap">
            <div class="hue-slider" ref="hueSliderRef" @mousedown="startHueDrag">
              <div
                class="hue-thumb"
                :style="{ left: huePercent + '%' }"
              ></div>
            </div>
            <div class="slider-label">色相 H: {{ hsl.h }}°</div>
          </div>

          <div
            class="sl-square"
            ref="slSquareRef"
            @mousedown="startSlDrag"
            :style="{ background: slSquareBg }"
          >
            <div
              class="sl-thumb"
              :style="{ left: hsl.s + '%', top: (100 - hsl.l) + '%' }"
            ></div>
          </div>
          <div class="sl-labels">
            <span>饱和度 S: {{ hsl.s }}%</span>
            <span>亮度 L: {{ hsl.l }}%</span>
          </div>
        </div>

        <div class="hex-input-wrap">
          <label>HEX</label>
          <input
            type="text"
            v-model="hexInput"
            class="hex-input"
            @change="applyHexInput"
            maxlength="7"
          />
        </div>
      </div>
    </div>

    <div class="comment-section" :class="{ expanded: commentExpanded }">
      <div class="comment-toggle" @click="commentExpanded = !commentExpanded">
        <span>{{ commentExpanded ? '收起注释' : '添加注释' }}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="white"
          :class="{ rotated: commentExpanded }"
        >
          <path d="M6 8L2 4h8z" opacity="0.7" />
        </svg>
      </div>

      <div v-show="commentExpanded" class="comment-content">
        <div class="comment-input-wrap">
          <input
            type="text"
            :value="swatch.comment"
            @input="handleCommentInput"
            placeholder="输入注释（最多50字）..."
            class="comment-input"
            maxlength="50"
          />
          <div class="char-count">{{ swatch.comment.length }}/50</div>
        </div>

        <div class="mood-buttons">
          <button
            v-for="mood in moodOptions"
            :key="mood"
            class="mood-btn"
            :class="{ active: swatch.mood === mood, animating: animatingMood === mood }"
            :style="{ backgroundColor: getMoodColor(mood) }"
            @click="handleMoodClick(mood)"
          >
            {{ mood }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import type { SwatchData } from '../composables/useColorHash'
import { hslToHex, hexToHsl } from '../composables/useColorHash'

interface Props {
  swatch: SwatchData
  index: number
  isRestoring: boolean
  totalCount: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'updateColor', id: string, color: string): void
  (e: 'updateComment', id: string, comment: string): void
  (e: 'updateMood', id: string, mood: string): void
  (e: 'dragStart', index: number): void
  (e: 'dragEnd'): void
}>()

const commentExpanded = ref(false)
const showPicker = ref(false)
const isDragging = ref(false)
const animatingMood = ref('')

const hexInput = ref(props.swatch.color)
const hsl = ref(hexToHsl(props.swatch.color))

const hueSliderRef = ref<HTMLElement | null>(null)
const slSquareRef = ref<HTMLElement | null>(null)

let hueDragging = false
let slDragging = false

const moodOptions = ['积极', '冷静', '热情', '中性'] as const

const moodColorMap: Record<string, string> = {
  '积极': '#44BBA4',
  '冷静': '#7289DA',
  '热情': '#E74C3C',
  '中性': '#99AAB5'
}

function getMoodColor(mood: string): string {
  return moodColorMap[mood] || '#99AAB5'
}

const moodBgColor = computed(() => getMoodColor(props.swatch.mood))

const huePercent = computed(() => (hsl.value.h / 360) * 100)

const slSquareBg = computed(() => {
  const hueColor = hslToHex(hsl.value.h, 100, 50)
  return `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hueColor})`
})

const wrapperStyle = computed(() => {
  const width = 180
  const gap = 2
  const baseLeft = props.index * (width + gap)
  const delay = props.isRestoring ? props.index * 0.1 : 0
  return {
    width: width + 'px',
    left: baseLeft + 'px',
    animationDelay: delay + 's',
    opacity: props.isRestoring ? 0 : 1
  }
})

const swatchStyle = computed(() => ({
  backgroundColor: props.swatch.color,
  transition: 'background-color 0.3s ease'
}))

watch(() => props.swatch.color, (newColor) => {
  hexInput.value = newColor
  hsl.value = hexToHsl(newColor)
})

watch(hsl, (newHsl) => {
  const newColor = hslToHex(newHsl.h, newHsl.s, newHsl.l)
  if (newColor !== props.swatch.color) {
    emit('updateColor', props.swatch.id, newColor)
  }
}, { deep: true })

function togglePicker() {
  showPicker.value = !showPicker.value
}

function handleDragStart(e: DragEvent) {
  isDragging.value = true
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(props.index))
  }
  emit('dragStart', props.index)
}

function handleDragEnd() {
  isDragging.value = false
  emit('dragEnd')
}

function handleCommentInput(e: Event) {
  const target = e.target as HTMLInputElement
  emit('updateComment', props.swatch.id, target.value)
}

function handleMoodClick(mood: string) {
  animatingMood.value = mood
  setTimeout(() => {
    animatingMood.value = ''
  }, 300)
  emit('updateMood', props.swatch.id, mood)
}

function applyHexInput() {
  let val = hexInput.value.trim()
  if (!val.startsWith('#')) {
    val = '#' + val
  }
  if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
    emit('updateColor', props.swatch.id, val.toUpperCase())
  } else {
    hexInput.value = props.swatch.color
  }
}

function getEventX(e: MouseEvent | TouchEvent): number {
  if ('touches' in e) return e.touches[0].clientX
  return e.clientX
}

function getEventY(e: MouseEvent | TouchEvent): number {
  if ('touches' in e) return e.touches[0].clientY
  return e.clientY
}

function startHueDrag(e: MouseEvent) {
  e.preventDefault()
  hueDragging = true
  updateHueFromEvent(e)
  window.addEventListener('mousemove', onHueDrag)
  window.addEventListener('mouseup', stopHueDrag)
}

function onHueDrag(e: MouseEvent) {
  if (!hueDragging) return
  updateHueFromEvent(e)
}

function stopHueDrag() {
  hueDragging = false
  window.removeEventListener('mousemove', onHueDrag)
  window.removeEventListener('mouseup', stopHueDrag)
}

function updateHueFromEvent(e: MouseEvent) {
  if (!hueSliderRef.value) return
  const rect = hueSliderRef.value.getBoundingClientRect()
  let x = getEventX(e) - rect.left
  x = Math.max(0, Math.min(rect.width, x))
  hsl.value.h = Math.round((x / rect.width) * 360)
}

function startSlDrag(e: MouseEvent) {
  e.preventDefault()
  slDragging = true
  updateSlFromEvent(e)
  window.addEventListener('mousemove', onSlDrag)
  window.addEventListener('mouseup', stopSlDrag)
}

function onSlDrag(e: MouseEvent) {
  if (!slDragging) return
  updateSlFromEvent(e)
}

function stopSlDrag() {
  slDragging = false
  window.removeEventListener('mousemove', onSlDrag)
  window.removeEventListener('mouseup', stopSlDrag)
}

function updateSlFromEvent(e: MouseEvent) {
  if (!slSquareRef.value) return
  const rect = slSquareRef.value.getBoundingClientRect()
  let x = getEventX(e) - rect.left
  let y = getEventY(e) - rect.top
  x = Math.max(0, Math.min(rect.width, x))
  y = Math.max(0, Math.min(rect.height, y))
  hsl.value.s = Math.round((x / rect.width) * 100)
  hsl.value.l = Math.round(100 - (y / rect.height) * 100)
}

onBeforeUnmount(() => {
  stopHueDrag()
  stopSlDrag()
})
</script>

<style scoped>
.swatch-wrapper {
  position: absolute;
  top: 0;
  height: 160px;
  transition: left 0.2s ease, opacity 0.3s ease;
  animation: fadeInSwatch 0.4s ease forwards;
}

@keyframes fadeInSwatch {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.swatch-wrapper.is-dragging {
  opacity: 0.5;
  z-index: 100;
}

.swatch-item {
  position: relative;
  width: 100%;
  height: 160px;
  cursor: pointer;
  overflow: visible;
}

.hex-label {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.2);
  color: white;
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 4px;
  font-family: 'SF Mono', Consolas, monospace;
  letter-spacing: 0.5px;
  user-select: all;
}

.drag-handle {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  cursor: grab;
  padding: 6px;
  border-radius: 4px;
  opacity: 0.5;
  transition: opacity 0.2s;
}

.drag-handle:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.15);
}

.drag-handle:active {
  cursor: grabbing;
}

.mood-tag {
  position: absolute;
  bottom: 8px;
  right: 8px;
  color: white;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 8px;
  animation: fadeInTag 0.2s ease;
}

@keyframes fadeInTag {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.color-picker-popover {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 8px;
  background: #36393F;
  border-radius: 8px;
  padding: 16px;
  width: 240px;
  z-index: 1000;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  animation: popoverIn 0.2s ease;
}

@keyframes popoverIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 12px;
}

.close-btn {
  background: none;
  border: none;
  color: #99AAB5;
  font-size: 20px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}

.close-btn:hover {
  color: white;
}

.hsl-picker {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hue-slider-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hue-slider {
  position: relative;
  height: 16px;
  border-radius: 8px;
  background: linear-gradient(to right,
    #f00 0%, #ff0 17%, #0f0 33%,
    #0ff 50%, #00f 67%, #f0f 83%, #f00 100%
  );
  cursor: pointer;
}

.hue-thumb {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  border: 2px solid #2C2F33;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.slider-label {
  font-size: 11px;
  color: #99AAB5;
}

.sl-square {
  position: relative;
  width: 100%;
  height: 140px;
  border-radius: 6px;
  cursor: crosshair;
}

.sl-thumb {
  position: absolute;
  transform: translate(-50%, -50%);
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: white;
  border: 2px solid #2C2F33;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.sl-labels {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #99AAB5;
}

.hex-input-wrap {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.hex-input-wrap label {
  font-size: 12px;
  color: #99AAB5;
  min-width: 32px;
}

.hex-input {
  flex: 1;
  background: #2C2F33;
  border: 1px solid #40444B;
  border-radius: 4px;
  color: white;
  font-size: 13px;
  padding: 6px 10px;
  font-family: 'SF Mono', Consolas, monospace;
  outline: none;
  transition: border-color 0.2s;
}

.hex-input:focus {
  border-color: #5865F2;
}

.comment-section {
  width: 100%;
  background: #36393F;
  border-radius: 0 0 8px 8px;
  overflow: hidden;
  transition: height 0.3s ease;
}

.comment-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  color: #99AAB5;
  font-size: 12px;
  transition: color 0.2s, background 0.2s;
}

.comment-toggle:hover {
  color: white;
  background: rgba(255, 255, 255, 0.03);
}

.comment-toggle svg {
  transition: transform 0.3s ease;
}

.comment-toggle svg.rotated {
  transform: rotate(180deg);
}

.comment-content {
  padding: 0 12px 12px;
}

.comment-input-wrap {
  position: relative;
  margin-bottom: 10px;
}

.comment-input {
  width: 100%;
  background: transparent;
  border: none;
  border-bottom: 2px solid #40444B;
  color: white;
  font-size: 14px;
  padding: 6px 0;
  outline: none;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.comment-input::placeholder {
  color: #60646B;
}

.comment-input:focus {
  border-bottom-color: #5865F2;
  animation: underlinePulse 0.4s ease;
}

@keyframes underlinePulse {
  0% { border-bottom-color: #5865F2; }
  50% { border-bottom-color: #7289DA; box-shadow: 0 1px 0 0 #5865F2; }
  100% { border-bottom-color: #5865F2; }
}

.char-count {
  position: absolute;
  right: 0;
  top: 8px;
  font-size: 10px;
  color: #60646B;
}

.mood-buttons {
  display: flex;
  gap: 6px;
}

.mood-btn {
  flex: 1;
  height: 30px;
  border: none;
  border-radius: 16px;
  color: white;
  font-size: 12px;
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease;
  opacity: 0.85;
}

.mood-btn:hover {
  opacity: 1;
  transform: scale(1.05);
}

.mood-btn.active {
  opacity: 1;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
}

.mood-btn.animating {
  animation: moodClick 0.3s ease;
}

@keyframes moodClick {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}
</style>
