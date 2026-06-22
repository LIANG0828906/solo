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
const isLoaded = ref<boolean>(false)
const isClosing = ref<boolean>(false)
const modalRef = ref<HTMLElement | null>(null)
let closeTimeoutId: number | null = null

const isFavorite = (): boolean => store.isFavorite(props.image.id)

function handleLoad(_e: Event): void {
  isLoaded.value = true
}

function handleFavoriteClick(e: MouseEvent): void {
  e.stopPropagation()
  store.toggleFavorite(props.image.id)
}

function handleClose(): void {
  if (isClosing.value) return
  isClosing.value = true
  if (closeTimeoutId) {
    clearTimeout(closeTimeoutId)
  }
  closeTimeoutId = window.setTimeout((): void => {
    emit('close')
  }, 300)
}

function handleOverlayClick(e: MouseEvent): void {
  if (e.target === e.currentTarget) {
    handleClose()
  }
}

function handleKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    handleClose()
  }
}

function handleCloseBtnClick(e: MouseEvent): void {
  e.stopPropagation()
  handleClose()
}

onMounted((): void => {
  document.addEventListener('keydown', handleKeydown)
  document.body.style.overflow = 'hidden'
})

onUnmounted((): void => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
  if (closeTimeoutId) {
    clearTimeout(closeTimeoutId)
  }
})
</script>

<template>
  <Teleport to="body">
    <div ref="modalRef" class="modal-overlay" :class="{ closing: isClosing }" @click="handleOverlayClick">
      <div class="modal-content" :class="{ closing: isClosing }">
        <button class="close-btn" @click="handleCloseBtnClick" aria-label="关闭">
          <span class="close-icon">×</span>
        </button>
        <div class="image-wrapper">
          <div class="image-placeholder"></div>
          <img :src="image.url" :alt="image.title" class="modal-image" :class="{ loaded: isLoaded }" @load="handleLoad" />
        </div>
        <div class="modal-footer">
          <div class="image-info">
            <h2 class="image-title">{{ image.title }}</h2>
            <div class="image-tags">
              <span v-for="tag in image.tags" :key="tag" class="tag-chip">{{ tag }}</span>
            </div>
          </div>
          <button class="favorite-btn-large" :class="{ active: isFavorite() }" @click="handleFavoriteClick">
            <span class="heart">♥</span>
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
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
  opacity: 1;
  transition: opacity 0.3s ease-out;
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
  transform: scale(0.8);
  transition: transform 0.3s ease-out, opacity 0.3s ease-out;
  opacity: 0;
  animation: modalIn 0.3s ease-out forwards;
}

@keyframes modalIn {
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.modal-content.closing {
  transform: scale(0.8);
  opacity: 0;
  animation: none;
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
}

.close-btn:hover {
  background: white;
  transform: scale(1.1);
}

.close-icon {
  font-size: 24px;
  line-height: 1;
}

.image-wrapper {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  min-height: 300px;
}

.image-placeholder {
  position: absolute;
  inset: 0;
  background: var(--bg-secondary);
}

.modal-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  display: block;
  opacity: 0;
  transition: opacity 0.3s ease-out;
  position: relative;
  z-index: 1;
}

.modal-image.loaded {
  opacity: 1;
}

.modal-footer {
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: var(--bg-primary);
  border-top: 1px solid var(--bg-secondary);
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
  gap: 6px;
}

.tag-chip {
  background: var(--bg-secondary);
  color: var(--text-secondary);
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
}

.favorite-btn-large {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 24px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-weight: 500;
  font-size: 14px;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.favorite-btn-large:hover {
  background: var(--bg-primary);
  box-shadow: var(--shadow-sm);
}

.favorite-btn-large.active {
  background: linear-gradient(135deg, var(--favorite-start), var(--favorite-end));
  color: white;
}

.favorite-btn-large .heart {
  font-size: 18px;
  line-height: 1;
}
</style>
