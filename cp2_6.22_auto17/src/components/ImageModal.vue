<script setup lang="ts">
import { watch, onMounted, onBeforeUnmount, ref } from 'vue'
import { useGalleryStore } from '@/stores/galleryStore'

const store = useGalleryStore()
const imgLoaded = ref(false)

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && store.selectedImage) {
    store.closeModal()
  }
}

function onOverlayClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    store.closeModal()
  }
}

watch(
  () => store.selectedImage,
  () => {
    imgLoaded.value = false
  },
)

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="store.selectedImage"
        class="modal-overlay"
        @click="onOverlayClick"
        role="dialog"
        aria-modal="true"
      >
        <Transition name="modal-pop" appear>
          <div v-if="store.selectedImage" class="modal-dialog" @click.stop>
            <button
              class="modal-close"
              type="button"
              aria-label="关闭"
              @click="store.closeModal"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <div class="modal-image-wrap" :style="{ backgroundColor: store.selectedImage.placeholderColor }">
              <img
                :key="store.selectedImage.id"
                :src="store.selectedImage.url"
                :alt="store.selectedImage.title"
                class="modal-image"
                :class="{ loaded: imgLoaded }"
                @load="imgLoaded = true"
              />
              <div v-if="!imgLoaded" class="modal-spinner" aria-hidden="true"></div>
            </div>

            <div class="modal-footer">
              <div class="modal-info">
                <h3 class="modal-title">{{ store.selectedImage.title }}</h3>
                <div class="modal-tags">
                  <button
                    v-for="t in store.selectedImage.tags"
                    :key="t"
                    type="button"
                    class="modal-tag"
                    :class="{ active: store.selectedTags.includes(t) }"
                    @click="store.toggleTag(t)"
                  >
                    #{{ t }}
                  </button>
                </div>
              </div>

              <button
                class="fav-button"
                type="button"
                :class="{ active: store.isFavorite(store.selectedImage.id) }"
                @click="store.toggleFavorite(store.selectedImage.id)"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" :fill="store.isFavorite(store.selectedImage.id) ? 'url(#mfavgrad)' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <defs>
                    <linearGradient id="mfavgrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="#ff6b6b" />
                      <stop offset="100%" stop-color="#ee5a24" />
                    </linearGradient>
                  </defs>
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                <span>{{ store.isFavorite(store.selectedImage.id) ? '已收藏' : '收藏' }}</span>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(20, 25, 35, 0.55);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: grid;
  place-items: center;
  padding: 24px;
}

.modal-dialog {
  position: relative;
  width: 100%;
  max-width: 920px;
  max-height: 92vh;
  background: var(--bg-white);
  border-radius: var(--radius-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.35);
}

.modal-close {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 5;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(44, 62, 80, 0.75);
  color: #fff;
  display: grid;
  place-items: center;
  transition: var(--transition-fast);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}
.modal-close:hover {
  background: var(--text-primary);
  transform: rotate(90deg);
}

.modal-image-wrap {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  max-height: 72vh;
  display: grid;
  place-items: center;
  background: #000;
  overflow: hidden;
}

.modal-image {
  max-width: 100%;
  max-height: 72vh;
  object-fit: contain;
  opacity: 0;
  transition: opacity 0.45s ease-out;
  display: block;
}
.modal-image.loaded {
  opacity: 1;
}

.modal-spinner {
  position: absolute;
  width: 36px;
  height: 36px;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 18px 22px;
  border-top: 1px solid var(--border);
  background: var(--bg-white);
}

.modal-info {
  min-width: 0;
  flex: 1;
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
  letter-spacing: 0.2px;
}

.modal-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.modal-tag {
  font-size: 12px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--bg-primary);
  color: var(--text-secondary);
  border: 1px solid transparent;
  transition: var(--transition-fast);
  text-transform: lowercase;
}
.modal-tag:hover {
  background: #eef0f2;
  color: var(--text-primary);
}
.modal-tag.active {
  background: rgba(44, 62, 80, 0.08);
  border-color: rgba(44, 62, 80, 0.3);
  color: var(--text-primary);
}

.fav-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  border-radius: 999px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 500;
  border: 1px solid var(--border);
  transition: var(--transition-base);
  flex-shrink: 0;
}
.fav-button:hover {
  border-color: rgba(238, 90, 36, 0.4);
}
.fav-button.active {
  background: linear-gradient(135deg, var(--fav-start), var(--fav-end));
  border-color: transparent;
  color: #fff;
  box-shadow: 0 6px 18px rgba(238, 90, 36, 0.35);
}
.fav-button:active {
  transform: scale(0.97);
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease-out;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-pop-enter-active,
.modal-pop-leave-active {
  transition:
    opacity 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
    transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.modal-pop-enter-from {
  opacity: 0;
  transform: scale(0.92) translateY(8px);
}
.modal-pop-leave-to {
  opacity: 0;
  transform: scale(0.92);
}

@media (max-width: 768px) {
  .modal-overlay {
    padding: 10px;
  }
  .modal-footer {
    padding: 14px 16px;
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  .modal-title {
    font-size: 14.5px;
  }
  .fav-button {
    justify-content: center;
  }
  .modal-close {
    top: 10px;
    right: 10px;
    width: 34px;
    height: 34px;
  }
}
</style>
