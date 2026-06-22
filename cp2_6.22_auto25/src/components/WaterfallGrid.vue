<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { ImageItem } from '@/types'
import ImageCard from './ImageCard.vue'

interface Props {
  images: ImageItem[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'open-modal', image: ImageItem): void
}>()

const windowWidth = ref(window.innerWidth)

const columnCount = computed(() => {
  if (windowWidth.value >= 1200) return 5
  if (windowWidth.value >= 992) return 4
  if (windowWidth.value >= 768) return 3
  return 2
})

const gap = computed((): number => windowWidth.value < 768 ? 8 : 16)

const columns = computed(() => {
  const cols: ImageItem[][] = Array.from({ length: columnCount.value }, () => [])
  const columnHeights: number[] = Array(columnCount.value).fill(0)

  props.images.forEach((image) => {
    const shortestColIndex = columnHeights.indexOf(Math.min(...columnHeights))
    cols[shortestColIndex].push(image)
    const aspectRatio = image.height / image.width
    columnHeights[shortestColIndex] += aspectRatio
  })

  return cols
})

function handleResize() {
  windowWidth.value = window.innerWidth
}

function handleCardClick(image: ImageItem) {
  emit('open-modal', image)
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div class="waterfall-container">
    <div
      class="waterfall-grid"
      :style="{
        gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
        gap: `${gap}px`,
      }"
    >
      <TransitionGroup
        v-for="(column, colIndex) in columns"
        :key="colIndex"
        name="list"
        tag="div"
        class="waterfall-column"
        :style="{ gap: `${gap}px` }"
      >
        <ImageCard
          v-for="image in column"
          :key="image.id"
          :image="image"
          @click="handleCardClick(image)"
        />
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
.waterfall-container {
  width: 100%;
}

.waterfall-grid {
  display: flex;
  width: 100%;
}

.waterfall-column {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease-out;
}

.list-enter-from {
  opacity: 0;
  transform: scale(0.9);
}

.list-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.list-move {
  transition: transform 0.3s ease-out;
}
</style>
