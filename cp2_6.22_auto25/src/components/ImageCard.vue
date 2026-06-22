<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useGalleryStore } from '@/stores/galleryStore'
import type { ImageItem } from '@/types'
import { getPlaceholderColor } from '@/data/mockImages'

interface Props {
  image: ImageItem
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'click'): void
}>()

const store = useGalleryStore()
const isLoaded = ref<boolean>(false)
const isVisible = ref<boolean>(false)
const cardRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

const isFavorite = computed<boolean>(() => store.isFavorite(props.image.id))
const placeholderColor = computed<string>(() => getPlaceholderColor(props.image.id))
const aspectRatio = computed<string>(() => `${props.image.width} / ${props.image.height}`)

function handleLoad(): void {
  isLoaded.value = true
}

function handleFavoriteClick(e: MouseEvent): void {
  e.stopPropagation()
  store.toggleFavorite(props.image.id)
}

function handleCardClick(): void {
  emit('click')
}

onMounted((): void => {
  observer = new IntersectionObserver(
    (entries: IntersectionObserverEntry[]): void => {
      entries.forEach((entry: IntersectionObserverEntry): void => {
        if (entry.isIntersecting) {
          isVisible.value = true
          observer?.disconnect()
        }
      })
    },
    { rootMargin: '200px' }
  )

  if (cardRef.value) {
    observer.observe(cardRef.value)
  }
})

onUnmounted((): void => {
  observer?.disconnect()
})
</script>

<template>
  <div
    ref="cardRef"
    class="image-card"
    :style="{ aspectRatio }"
    @click="handleCardClick"
  >
    <div
      class="card-placeholder"
      :style="{ backgroundColor: placeholderColor }"
      :class="{ hidden: isLoaded }"
    ></div>

    <img
      v-if="isVisible"
      :src="image.thumbnailUrl"
      :alt="image.title"
      class="card-image"
      :class="{ loaded: isLoaded }"
      @load="handleLoad"
      loading="lazy"
    />

    <div class="card-overlay">
      <div class="card-title">{{ image.title }}</div>
    </div>

    <button
      class="favorite-btn"
      :class="{ active: isFavorite }"
      @click="handleFavoriteClick"
      aria-label="收藏"
    >
      <span class="heart">♥</span>
    </button>
  </div>
</template>

<style scoped>
.image-card {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: var(--border-radius);
  overflow: hidden;
  background: var(--bg-primary);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: all var(--transition-normal);
  will-change: transform, box-shadow;
}

.image-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.card-placeholder {
  position: absolute;
  inset: 0;
  transition: opacity var(--transition-normal);
}

.card-placeholder.hidden {
  opacity: 0;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  opacity: 0;
  transition: opacity var(--transition-normal);
}

.card-image.loaded {
  opacity: 1;
}

.card-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    transparent 60%,
    rgba(44, 62, 80, 0.9) 100%
  );
  opacity: 0;
  transition: opacity var(--transition-normal);
  display: flex;
  align-items: flex-end;
  padding: 16px;
}

.image-card:hover .card-overlay {
  opacity: 1;
}

.card-title {
  color: white;
  font-size: 14px;
  font-weight: 600;
  transform: translateY(10px);
  transition: transform var(--transition-normal);
}

.image-card:hover .card-title {
  transform: translateY(0);
}

.favorite-btn {
  position: absolute;
  bottom: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  opacity: 0;
  transform: scale(0.8);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.image-card:hover .favorite-btn,
.favorite-btn.active {
  opacity: 1;
  transform: scale(1);
}

.favorite-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.heart {
  font-size: 18px;
  line-height: 1;
  color: var(--text-primary);
  transition: all var(--transition-fast);
}

.favorite-btn.active .heart {
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
</style>
