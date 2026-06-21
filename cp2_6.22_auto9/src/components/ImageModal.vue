<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay" @click.self="handleClose">
        <div class="modal-content">
          <div class="image-wrapper">
            <img v-if="image?.imageUrl" :src="image.imageUrl" :alt="image.title" class="modal-image" />
            <div v-else class="image-placeholder">
              <span class="placeholder-text">{{ image?.id || '图片' }}</span>
            </div>
          </div>
          <div class="modal-footer">
            <div class="info-section">
              <h2 class="image-title">{{ image?.title || '无题' }}</h2>
              <div v-if="image?.tags?.length" class="tag-list">
                <span v-for="tag in image.tags" :key="tag" class="tag">{{ tag }}</span>
              </div>
            </div>
            <div class="actions">
              <button class="favorite-btn" @click.stop="handleToggleFavorite" aria-label="收藏">
                <svg class="heart-icon" viewBox="0 0 24 24" fill="url(#heartGradient)">
                  <defs>
                    <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style="stop-color:#ff6b6b" />
                      <stop offset="100%" style="stop-color:#ee5a24" />
                    </linearGradient>
                  </defs>
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </button>
              <button class="close-btn" @click.stop="handleClose" aria-label="关闭">
                <svg class="close-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { watch, onUnmounted } from 'vue'
import type { Image } from '../types'

const props = defineProps<{
  image?: Image
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
  'toggle-favorite': []
}>()

const handleClose = () => {
  emit('close')
}

const handleToggleFavorite = () => {
  emit('toggle-favorite')
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.visible) {
    handleClose()
  }
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      document.addEventListener('keydown', handleKeydown)
      document.body.style.overflow = 'hidden'
    } else {
      document.removeEventListener('keydown', handleKeydown)
      document.body.style.overflow = ''
    }
  }
)

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background-color: #ffffff;
  border-radius: 16px;
  overflow: hidden;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.image-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ffffff;
  overflow: hidden;
  min-height: 0;
}

.modal-image {
  max-width: 100%;
  max-height: 100%;
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.image-placeholder {
  width: 400px;
  height: 300px;
  background-color: #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-text {
  color: #adb5bd;
  font-size: 16px;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background-color: #ffffff;
  border-top: 1px solid #f1f3f5;
  gap: 20px;
}

.info-section {
  flex: 1;
  min-width: 0;
}

.image-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #2c3e50;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 12px;
  background-color: #f1f3f5;
  color: #495057;
}

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.favorite-btn {
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 50%;
  background-color: #f8f9fa;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease-out, background-color 0.2s ease-out;
}

.favorite-btn:hover {
  background-color: #fff0f0;
  transform: scale(1.05);
}

.favorite-btn:active {
  transform: scale(0.95);
}

.heart-icon {
  width: 22px;
  height: 22px;
}

.close-btn {
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 50%;
  background-color: #f8f9fa;
  color: #495057;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease-out, background-color 0.2s ease-out, color 0.2s ease-out;
}

.close-btn:hover {
  background-color: #e9ecef;
  color: #2c3e50;
  transform: scale(1.05);
}

.close-btn:active {
  transform: scale(0.95);
}

.close-icon {
  width: 20px;
  height: 20px;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease-out;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.25s ease-out, opacity 0.25s ease-out;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  opacity: 0;
  transform: scale(0.85);
}

@media (max-width: 768px) {
  .modal-overlay {
    padding: 0;
  }

  .modal-content {
    max-width: 100vw;
    max-height: 100vh;
    border-radius: 0;
    width: 100%;
    height: 100%;
  }

  .image-wrapper {
    min-height: 0;
  }

  .modal-image {
    max-height: 100%;
  }

  .image-placeholder {
    width: 100%;
    height: 200px;
  }

  .modal-footer {
    padding: 16px;
    gap: 12px;
  }

  .image-title {
    font-size: 16px;
  }

  .actions {
    gap: 8px;
  }

  .favorite-btn,
  .close-btn {
    width: 40px;
    height: 40px;
  }

  .heart-icon {
    width: 20px;
    height: 20px;
  }

  .close-icon {
    width: 18px;
    height: 18px;
  }
}
</style>
