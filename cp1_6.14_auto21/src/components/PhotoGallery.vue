<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Plus, X, ChevronLeft, ChevronRight } from 'lucide-vue-next'

interface Photo {
  id: string
  original: string
  thumbnail: string
}

const props = defineProps<{
  photos: Photo[]
}>()

const emit = defineEmits<{
  upload: [files: FileList]
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const lightboxOpen = ref(false)
const lightboxIndex = ref(0)
const slideDirection = ref<'left' | 'right' | null>(null)
const touchStartX = ref(0)
const touchDeltaX = ref(0)

const currentPhoto = computed(() => props.photos[lightboxIndex.value])

function triggerUpload() {
  fileInput.value?.click()
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    emit('upload', input.files)
    input.value = ''
  }
}

function openLightbox(index: number) {
  lightboxIndex.value = index
  slideDirection.value = null
  lightboxOpen.value = true
}

function closeLightbox() {
  lightboxOpen.value = false
}

function navigate(direction: 'left' | 'right') {
  slideDirection.value = direction
  if (direction === 'left' && lightboxIndex.value > 0) {
    lightboxIndex.value--
  } else if (direction === 'right' && lightboxIndex.value < props.photos.length - 1) {
    lightboxIndex.value++
  }
  setTimeout(() => {
    slideDirection.value = null
  }, 300)
}

function onOverlayClick(e: MouseEvent) {
  if ((e.target as HTMLElement).classList.contains('lightbox-overlay')) {
    closeLightbox()
  }
}

function onKeydown(e: KeyboardEvent) {
  if (!lightboxOpen.value) return
  if (e.key === 'Escape') closeLightbox()
  if (e.key === 'ArrowLeft') navigate('left')
  if (e.key === 'ArrowRight') navigate('right')
}

function onTouchStart(e: TouchEvent) {
  touchStartX.value = e.touches[0].clientX
  touchDeltaX.value = 0
}

function onTouchMove(e: TouchEvent) {
  touchDeltaX.value = e.touches[0].clientX - touchStartX.value
}

function onTouchEnd() {
  if (Math.abs(touchDeltaX.value) > 50) {
    if (touchDeltaX.value > 0) {
      navigate('left')
    } else {
      navigate('right')
    }
  }
  touchDeltaX.value = 0
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div class="photo-gallery">
    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png"
      multiple
      class="hidden-input"
      @change="onFileChange"
    />

    <div class="upload-area" @click="triggerUpload">
      <Plus :size="32" />
      <span class="upload-text">Add Photos</span>
    </div>

    <div class="waterfall">
      <div
        v-for="(photo, index) in photos"
        :key="photo.id"
        class="thumbnail-wrapper"
        @click="openLightbox(index)"
      >
        <img
          :src="photo.thumbnail"
          :alt="'Photo ' + photo.id"
          class="thumbnail"
          loading="lazy"
        />
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="lightboxOpen"
        class="lightbox-overlay"
        @click="onOverlayClick"
      >
        <button class="lightbox-close" @click="closeLightbox">
          <X :size="24" />
        </button>

        <button
          v-if="lightboxIndex > 0"
          class="lightbox-arrow lightbox-arrow-left"
          @click.stop="navigate('left')"
        >
          <ChevronLeft :size="24" />
        </button>

        <div
          class="lightbox-image-container"
          @touchstart="onTouchStart"
          @touchmove="onTouchMove"
          @touchend="onTouchEnd"
        >
          <img
            v-if="currentPhoto"
            :src="currentPhoto.original"
            :alt="'Photo ' + currentPhoto.id"
            class="lightbox-image"
            :class="{
              'slide-left': slideDirection === 'left',
              'slide-right': slideDirection === 'right',
            }"
            @click.stop
          />
        </div>

        <button
          v-if="lightboxIndex < photos.length - 1"
          class="lightbox-arrow lightbox-arrow-right"
          @click.stop="navigate('right')"
        >
          <ChevronRight :size="24" />
        </button>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.photo-gallery {
  width: 100%;
}

.hidden-input {
  display: none;
}

.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  min-height: 120px;
  border: 2px dashed #ccc;
  border-radius: 12px;
  cursor: pointer;
  color: #999;
  transition: border-color 0.2s, color 0.2s;
  margin-bottom: 16px;
  padding: 24px;
}

.upload-area:hover {
  border-color: #666;
  color: #666;
}

.upload-text {
  font-size: 14px;
}

.waterfall {
  columns: 2;
  column-gap: 8px;
}

.thumbnail-wrapper {
  break-inside: avoid;
  margin-bottom: 8px;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  transition: box-shadow 0.3s, transform 0.3s;
}

.thumbnail-wrapper:hover {
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  transform: translateY(-2px);
}

.thumbnail {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  border-radius: 8px;
}

.lightbox-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox-close {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  background: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #222;
  transition: opacity 0.2s;
}

.lightbox-close:hover {
  opacity: 0.8;
}

.lightbox-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  background: white;
  border: none;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #222;
  transition: opacity 0.2s;
}

.lightbox-arrow:hover {
  opacity: 0.8;
}

.lightbox-arrow-left {
  left: 16px;
}

.lightbox-arrow-right {
  right: 16px;
}

.lightbox-image-container {
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  touch-action: pan-y;
}

.lightbox-image {
  max-width: 90vw;
  max-height: 85vh;
  object-fit: contain;
  border-radius: 8px;
  transition: transform 0.3s ease;
}

.lightbox-image.slide-left {
  transform: translateX(60px);
}

.lightbox-image.slide-right {
  transform: translateX(-60px);
}
</style>
