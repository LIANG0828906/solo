<template>
  <div
    class="palette-board"
    @dragover.prevent="handleDragOver"
    @drop.prevent="handleDrop"
  >
    <div
      class="swatches-container"
      ref="containerRef"
      :style="containerStyle"
    >
      <SwatchItem
        v-for="(swatch, index) in swatches"
        :key="swatch.id"
        :swatch="swatch"
        :index="getDisplayIndex(index)"
        :is-restoring="isRestoring"
        :total-count="swatches.length"
        @update-color="handleUpdateColor"
        @update-comment="handleUpdateComment"
        @update-mood="handleUpdateMood"
        @drag-start="handleSwatchDragStart"
        @drag-end="handleSwatchDragEnd"
      />
    </div>

    <div class="board-gap" v-for="i in Math.max(0, swatches.length - 1)" :key="'gap-' + i" :style="gapStyle(i - 1)"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import SwatchItem from './SwatchItem.vue'
import type { SwatchData } from '../composables/useColorHash'

interface Props {
  swatches: SwatchData[]
  isRestoring: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'updateColor', id: string, color: string): void
  (e: 'updateComment', id: string, comment: string): void
  (e: 'updateMood', id: string, mood: string): void
  (e: 'reorder', fromIndex: number, toIndex: number): void
}>()

const containerRef = ref<HTMLElement | null>(null)
const draggingIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

const SWATCH_WIDTH = 180
const SWATCH_HEIGHT = 160
const GAP = 2

const displayOrder = computed(() => {
  const order = props.swatches.map((_, i) => i)
  if (draggingIndex.value === null || dragOverIndex.value === null) {
    return order
  }
  const from = draggingIndex.value
  const to = dragOverIndex.value
  if (from === to) return order

  const item = order.splice(from, 1)[0]
  order.splice(to, 0, item)
  return order
})

function getDisplayIndex(originalIndex: number): number {
  return displayOrder.value.indexOf(originalIndex)
}

const totalWidth = computed(() => {
  const count = props.swatches.length
  if (count === 0) return 0
  return count * SWATCH_WIDTH + (count - 1) * GAP
})

const containerStyle = computed(() => ({
  width: totalWidth.value + 'px',
  height: SWATCH_HEIGHT + 'px',
  position: 'relative' as const
}))

function gapStyle(index: number) {
  return {
    position: 'absolute' as const,
    left: ((index + 1) * SWATCH_WIDTH + index * GAP) + 'px',
    top: 0,
    width: GAP + 'px',
    height: SWATCH_HEIGHT + 'px',
    backgroundColor: '#23272A'
  }
}

function handleUpdateColor(id: string, color: string) {
  emit('updateColor', id, color)
}

function handleUpdateComment(id: string, comment: string) {
  emit('updateComment', id, comment)
}

function handleUpdateMood(id: string, mood: string) {
  emit('updateMood', id, mood)
}

function handleSwatchDragStart(index: number) {
  draggingIndex.value = index
  dragOverIndex.value = index
}

function handleSwatchDragEnd() {
  if (draggingIndex.value !== null && dragOverIndex.value !== null) {
    if (draggingIndex.value !== dragOverIndex.value) {
      emit('reorder', draggingIndex.value, dragOverIndex.value)
    }
  }
  draggingIndex.value = null
  dragOverIndex.value = null
}

function handleDragOver(e: DragEvent) {
  if (draggingIndex.value === null) return
  if (!containerRef.value) return

  const rect = containerRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  let targetIndex = Math.floor(x / (SWATCH_WIDTH + GAP))
  targetIndex = Math.max(0, Math.min(props.swatches.length - 1, targetIndex))
  dragOverIndex.value = targetIndex
}

function handleDrop() {
  handleSwatchDragEnd()
}
</script>

<style scoped>
.palette-board {
  width: 900px;
  background-color: #2C2F33;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
}

.swatches-container {
  position: relative;
}

.board-gap {
  pointer-events: none;
  z-index: 0;
}
</style>
