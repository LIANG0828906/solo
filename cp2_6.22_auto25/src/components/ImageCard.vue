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
const isLoaded = ref(false)
const isVisible = ref(false)
const cardRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

const isFavorite = computed(() => store.isFavorite(props.image.id))
const placeholderColor = computed(() => getPlaceholderColor(props.image.id))
const aspectRatio = computed(() => `${props.image.width} / ${props.image.height}`)

function handleLoad() {
  isLoaded.value = true
}

function handleFavoriteClick(e: Event) {
  e.stopPropagation()
  store.toggleFavorite(props.image.id)
}

function handleCardClick() {
  emit('click')
}

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
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

onUnmounted(() => {
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
    />

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
      <svg
        class="heart-icon"
        viewBox="0 0 24 24"
        :fill="isFavorite ? 'url(#heartGradient)' : 'none'"
        stroke="currentColor"
        stroke-width="2"
      >
        <defs>
          <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ff6b6b" />
            <stop offset="100%" stop-color="#ee5a24" />
          </linearGradient>
        </defs>
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.image-card {
  position: relative;
  width: 100%;
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

.heart-icon {
  width: 18px;
  height: 18px;
  color: var(--text-primary);
  transition: all var(--transition-fast);
}

.favorite-btn.active .heart-icon {
  color: transparent;
}
</style>
