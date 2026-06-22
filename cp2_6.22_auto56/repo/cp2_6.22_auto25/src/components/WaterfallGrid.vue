<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import type { ImageItem } from '@/types'
import ImageCard from './ImageCard.vue'

interface PositionedImage {
  image: ImageItem
  top: number
  left: number
  width: number
  height: number
}

interface Props {
  images: ImageItem[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'open-modal', image: ImageItem): void
}>()

const containerRef = ref<HTMLElement | null>(null)
const windowWidth = ref(window.innerWidth)
const containerWidth = ref(0)
const loadedImages = ref<Set<string>>(new Set())
let resizeObserver: ResizeObserver | null = null

const columnCount = computed((): number => {
  if (windowWidth.value >= 1200) return 5
  if (windowWidth.value >= 992) return 4
  if (windowWidth.value >= 768) return 3
  return 2
})

const gap = computed((): number => (windowWidth.value < 768 ? 8 : 16))

const cardWidth = computed((): number => {
  if (containerWidth.value <= 0) return 200
  const totalGap = gap.value * (columnCount.value - 1)
  return (containerWidth.value - totalGap) / columnCount.value
})

const positionedImages = computed((): PositionedImage[] => {
  const columns: number[] = Array(columnCount.value).fill(0)
  const result: PositionedImage[] = []

  props.images.forEach((image: ImageItem) => {
    const shortestColIndex: number = columns.indexOf(Math.min(...columns))
    const aspectRatio: number = image.height / image.width
    const cardHeight: number = cardWidth.value * aspectRatio

    result.push({
      image,
      top: columns[shortestColIndex],
      left: shortestColIndex * (cardWidth.value + gap.value),
      width: cardWidth.value,
      height: cardHeight,
    })

    columns[shortestColIndex] += cardHeight + gap.value
  })

  return result
})

const containerHeight = computed((): number => {
  const columns: number[] = Array(columnCount.value).fill(0)

  props.images.forEach((image: ImageItem) => {
    const shortestColIndex: number = columns.indexOf(Math.min(...columns))
    const aspectRatio: number = image.height / image.width
    const cardHeight: number = cardWidth.value * aspectRatio
    columns[shortestColIndex] += cardHeight + gap.value
  })

  return Math.max(...columns, 0)
})

function handleWindowResize(_e: Event): void {
  windowWidth.value = window.innerWidth
}

function measureContainer(): void {
  if (containerRef.value) {
    containerWidth.value = containerRef.value.clientWidth
  }
}

function handleCardClick(image: ImageItem): void {
  emit('open-modal', image)
}

function handleImageLoaded(id: string): void {
  loadedImages.value.add(id)
  nextTick((): void => {
    measureContainer()
  })
}

onMounted((): void => {
  window.addEventListener('resize', handleWindowResize)
  nextTick((): void => {
    measureContainer()
  })

  if (containerRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver((): void => {
      measureContainer()
    })
    resizeObserver.observe(containerRef.value)
  }
})

onUnmounted((): void => {
  window.removeEventListener('resize', handleWindowResize)
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})

watch(
  () => columnCount.value,
  (): void => {
    nextTick((): void => {
      measureContainer()
    })
  }
)
</script>

<template>
  <div class="waterfall-container" ref="containerRef">
    <div
      class="waterfall-grid"
      :style="{ height: `${containerHeight}px` }"
    >
      <TransitionGroup name="card">
        <div
          v-for="item in positionedImages"
          :key="item.image.id"
          class="waterfall-card"
          :style="{
            top: `${item.top}px`,
            left: `${item.left}px`,
            width: `${item.width}px`,
            height: `${item.height}px`,
          }"
        >
          <ImageCard
            :image="item.image"
            @click="(): void => handleCardClick(item.image)"
            @image-loaded="(id: string): void => handleImageLoaded(id)"
          />
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
.waterfall-container {
  width: 100%;
  position: relative;
}

.waterfall-grid {
  position: relative;
  width: 100%;
}

.waterfall-card {
  position: absolute;
  transition: transform 0.3s ease-out, opacity 0.3s ease-out, top 0.3s ease-out, left 0.3s ease-out;
}

.card-enter-active,
.card-leave-active {
  transition: all 0.3s ease-out;
}

.card-enter-from {
  opacity: 0;
  transform: scale(0.9);
}

.card-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.card-move {
  transition: top 0.3s ease-out, left 0.3s ease-out;
}
</style>
