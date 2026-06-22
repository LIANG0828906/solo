<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useGalleryStore } from '@/stores/galleryStore'
import type { ImageItem } from '@/types'

interface Props {
  image: ImageItem
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'close'): void
}>()

const store = useGalleryStore()
const isLoaded = ref(false)
const isClosing = ref(false)
const modalRef = ref<HTMLElement | null>(null)

const isFavorite = () => store.isFavorite(props.image.id)

function handleLoad() {
  isLoaded.value = true
}

function handleFavoriteClick() {
  store.toggleFavorite(props.image.id)
}

function handleClose() {
  isClosing.value = true
  setTimeout(() => {
    emit('close')
  }, 250)
}

function handleOverlayClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    handleClose()
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    handleClose()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <div
      ref="modalRef"
      class="modal-overlay"
      :class="{ closing: isClosing }"
      @click="handleOverlayClick"
    >
      <div class="modal-content" :class="{ closing: isClosing }">
        <button
          class="close-btn"
          @click="handleClose"
          aria-label="关闭"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6 6 18M6 6l12 12"></path>
          </svg>
        </button>

        <div class="image-wrapper">
          <div class="image-placeholder" />
          <img
            :src="image.url"
            :alt="image.title"
            class="modal-image"
            :class="{ loaded: isLoaded }"
            @load="handleLoad"
          />
        </div>

        <div class="modal-footer">
          <div class="image-info">
            <h2 class="image-title">{{ image.title }}</h2>
            <div class="image-tags">
              <span
                v-for="tag in image.tags"
                :key="tag"
                class="tag-chip"
              >
                {{ tag }}
              </span>
            </div>
          </div>

          <button
            class="favorite-btn-large"
            :class="{ active: isFavorite() }"
            @click="handleFavoriteClick"
          >
            <svg
              class="heart-icon"
              viewBox="0 0 24 24"
              :fill="isFavorite() ? 'url(#heartGradientModal)' : 'none'"
              stroke="currentColor"
              stroke-width="2"
            >
              <defs>
                <linearGradient id="heartGradientModal" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#ff6b6b" />
                  <stop offset="100%" stop-color="#ee5a24" />
                </linearGradient>
              </defs>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span>{{ isFavorite() ? '已收藏' : '收藏' }}</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
  opacity: 1;
  transition: opacity var(--transition-normal);
}

.modal-overlay.closing {
  opacity: 0;
}

.modal-content {
  position: relative;
  background: var(--bg-primary);
  border-radius: 12px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
  transform: scale(1);
  transition: transform var(--transition-normal);
}

.modal-content.closing {
  transform: scale(0.9);
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary);
  z-index: 10;
  transition: all var(--transition-fast);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.close-btn:hover {
  background: white;
  transform: rotate(90deg);
}

.image-wrapper {
  position: relative;
  flex: 1;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  min-height: 300px;
}

.image-placeholder {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.modal-image {
  max-width: 100%;
  max-height: calc(90vh - 120px);
  object-fit: contain;
  opacity: 0;
  transition: opacity var(--transition-normal);
  position: relative;
  z-index: 1;
}

.modal-image.loaded {
  opacity: 1;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-top: 1px solid var(--bg-secondary);
  gap: 16px;
}

.image-info {
  flex: 1;
  min-width: 0;
}

.image-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.image-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-chip {
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 500;
}

.favorite-btn-large {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 24px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.favorite-btn-large:hover {
  background: #e9ecef;
  transform: scale(1.02);
}

.favorite-btn-large.active {
  background: linear-gradient(135deg, var(--favorite-start), var(--favorite-end));
  color: white;
}

.favorite-btn-large.active:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 16px rgba(255, 107, 107, 0.4);
}

.heart-icon {
  width: 18px;
  height: 18px;
}

@media (max-width: 768px) {
  .modal-overlay {
    padding: 0;
  }

  .modal-content {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }

  .modal-footer {
    flex-direction: column;
    align-items: flex-start;
    padding: 16px;
  }

  .image-title {
    font-size: 16px;
  }
}
</style>
