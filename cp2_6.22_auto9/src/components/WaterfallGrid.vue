<template>
  <div class="waterfall-grid">
    <div v-for="(image, index) in images" :key="image.id" class="grid-item">
      <div
        class="image-card"
        :style="{ animationDelay: index * 0.03 + 's' }"
        :class="{ 'card-enter': isAnimating }"
        @click="handleCardClick(image)"
      >
        <div
          :ref="el => setImageRef(el, image.id)"
          class="image-wrapper"
          :style="{ paddingBottom: getAspectRatio(image) + '%' }"
        >
          <div class="image-placeholder" :style="{ backgroundColor: getPlaceholderColor(image.id) }"></div>
          <img
            v-if="loadedImages.has(image.id)"
            :src="image.imageUrl"
            :alt="image.title"
            class="image-img"
          />
          <div class="image-overlay">
            <span class="image-title">{{ image.title }}</span>
          </div>
          <button
            class="favorite-btn"
            :class="{ active: galleryStore.favorites.has(image.id) }"
            @click.stop="handleFavorite(image.id)"
          >
            <svg class="heart-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import type { Image } from '../types'
import { useGalleryStore } from '../stores/galleryStore'

const props = defineProps<{
  images: Image[]
}>()

const emit = defineEmits<{
  (e: 'show-modal', image: Image): void
}>()

const galleryStore = useGalleryStore()

const loadedImages = ref<Set<string>>(new Set())
const isAnimating = ref(false)
const imageRefs = new Map<string, HTMLElement>()
let observer: IntersectionObserver | null = null

const getAspectRatio = (image: Image): number => {
  return (image.height / 600) * 100
}

const getPlaceholderColor = (id: string): string => {
  const colors = [
    '#e8f4f8',
    '#f0f0e8',
    '#f8e8e8',
    '#e8f0f8',
    '#f0e8f8',
    '#e8f8f0'
  ]
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

const setImageRef = (el: unknown, imageId: string) => {
  if (el && el instanceof HTMLElement) {
    imageRefs.set(imageId, el)
    if (observer && !loadedImages.value.has(imageId)) {
      observer.observe(el)
    }
  } else {
    imageRefs.delete(imageId)
  }
}

const handleCardClick = (image: Image) => {
  galleryStore.openModal(image)
}

const handleFavorite = (imageId: string) => {
  galleryStore.toggleFavorite(imageId)
}

watch(() => props.images, async (newImages) => {
  const newIds = new Set(newImages.map(img => img.id))
  loadedImages.value = new Set([...loadedImages.value].filter(id => newIds.has(id)))
  
  isAnimating.value = true
  await nextTick()
  setTimeout(() => {
    isAnimating.value = false
  }, 30)
}, { deep: true })

onMounted(() => {
  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target as HTMLElement
        for (const [id, el] of imageRefs) {
          if (el === target && !loadedImages.value.has(id)) {
            loadedImages.value.add(id)
            break
          }
        }
        observer?.unobserve(entry.target)
      }
    })
  }, {
    rootMargin: '100px',
    threshold: 0.01
  })

  for (const [id, el] of imageRefs) {
    if (!loadedImages.value.has(id)) {
      observer.observe(el)
    }
  }
})

onUnmounted(() => {
  observer?.disconnect()
  observer = null
  imageRefs.clear()
})
</script>

<style scoped>
.waterfall-grid {
  columns: 5;
  column-gap: 16px;
}

.grid-item {
  break-inside: avoid;
  margin-bottom: 16px;
}

.image-card {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease, opacity 0.3s ease;
  transform: translateY(0);
}

.image-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.image-card.card-enter {
  animation: cardEnter 0.3s ease forwards;
  opacity: 0;
  transform: scale(0.9);
}

@keyframes cardEnter {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.image-wrapper {
  position: relative;
  width: 100%;
  height: 0;
  overflow: hidden;
}

.image-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.image-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.image-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24px 16px 16px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.image-card:hover .image-overlay {
  opacity: 1;
}

.image-title {
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.favorite-btn {
  position: absolute;
  bottom: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
  color: #ffffff;
  opacity: 0;
  transform: scale(0.8);
  transition: opacity 0.3s ease, transform 0.3s ease;
  z-index: 2;
  padding: 0;
}

.image-card:hover .favorite-btn {
  opacity: 1;
  transform: scale(1);
}

.favorite-btn.active {
  opacity: 1;
  transform: scale(1);
}

.heart-icon {
  width: 18px;
  height: 18px;
}

@media (max-width: 1400px) {
  .waterfall-grid {
    columns: 4;
  }
}

@media (max-width: 1100px) {
  .waterfall-grid {
    columns: 3;
  }
}

@media (max-width: 768px) {
  .waterfall-grid {
    columns: 2;
    column-gap: 8px;
  }

  .grid-item {
    margin-bottom: 8px;
  }
}

@media (max-width: 500px) {
  .waterfall-grid {
    columns: 1;
    column-gap: 8px;
  }

  .grid-item {
    margin-bottom: 8px;
  }
}
</style>
