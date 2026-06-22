<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useGalleryStore } from '@/stores/galleryStore'
import type { ImageItem } from '@/types'

const store = useGalleryStore()

const containerRef = ref<HTMLElement | null>(null)
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1280)
const loaded = new Set<string>()

const responsiveConfig = computed(() => {
  const w = windowWidth.value
  if (w < 768) return { cols: 2, gap: 8 }
  if (w < 1024) return { cols: 3, gap: 12 }
  if (w < 1440) return { cols: 4, gap: 16 }
  return { cols: 5, gap: 20 }
})

const cardStyle = computed(() => {
  const { gap } = responsiveConfig.value
  return {
    columnGap: `${gap}px`,
  }
})

const gridStyle = computed(() => {
  const { cols, gap } = responsiveConfig.value
  return {
    columnCount: cols,
    columnGap: `${gap}px`,
  }
})

const wrapperStyle = computed(() => {
  const { gap } = responsiveConfig.value
  return {
    marginBottom: `${gap}px`,
  }
})

function onLoad(id: string) {
  loaded.add(id)
}

function onCardClick(img: ImageItem) {
  store.openModal(img)
}

function onFavClick(e: MouseEvent, img: ImageItem) {
  e.stopPropagation()
  store.toggleFavorite(img.id)
}

let rafId: number | null = null
function onResize() {
  if (rafId != null) cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(() => {
    windowWidth.value = window.innerWidth
  })
}

onMounted(() => {
  window.addEventListener('resize', onResize, { passive: true })
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  if (rafId != null) cancelAnimationFrame(rafId)
})

watch(
  () => store.filteredImages.length,
  () => {},
)
</script>

<template>
  <div ref="containerRef" class="waterfall-wrap" :style="cardStyle">
    <TransitionGroup
      name="card-transition"
      tag="div"
      class="waterfall-grid"
      :style="gridStyle"
    >
      <div
        v-for="(img) in store.filteredImages"
        :key="img.id"
        class="card-wrap"
        :style="wrapperStyle"
      >
        <button
          type="button"
          class="image-card"
          @click="onCardClick(img)"
        >
          <div
            class="image-placeholder"
            :style="{
              backgroundColor: img.placeholderColor,
              paddingBottom: `${(img.height / img.width) * 100}%`,
            }"
          >
            <img
              :src="img.thumbnailUrl"
              :alt="img.title"
              loading="lazy"
              decoding="async"
              class="image-img"
              :class="{ loaded: loaded.has(img.id) }"
              @load="onLoad(img.id)"
            />
          </div>

          <div class="card-overlay">
            <div class="card-title">{{ img.title }}</div>
            <div class="card-tags">
              <span
                v-for="t in img.tags.slice(0, 3)"
                :key="t"
                class="card-tag"
              >#{{ t }}</span>
            </div>
          </div>

          <div
            class="fav-btn"
            role="button"
            :class="{ active: store.isFavorite(img.id) }"
            @click="(e) => onFavClick(e, img)"
            @mousedown.stop
          >
            <svg viewBox="0 0 24 24" width="18" height="18" :fill="store.isFavorite(img.id) ? 'url(#favgrad)' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <defs>
                <linearGradient id="favgrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#ff6b6b" />
                  <stop offset="100%" stop-color="#ee5a24" />
                </linearGradient>
              </defs>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </div>
        </button>
      </div>
    </TransitionGroup>

    <Transition name="empty-fade">
      <div v-if="store.filteredImages.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
        </div>
        <p class="empty-title">
          {{ store.filterScope === 'favorites' ? '暂无收藏图片' : '没有找到匹配的图片' }}
        </p>
        <p class="empty-desc">
          {{ store.filterScope === 'favorites' ? '浏览画廊时点击心形即可收藏' : '试试其他关键词或清除筛选条件' }}
        </p>
        <button
          v-if="store.selectedTags.length || store.searchQuery"
          class="empty-btn"
          @click="store.clearSearch(); store.clearTags()"
        >
          清除筛选
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.waterfall-wrap {
  position: relative;
}

.waterfall-grid {
  display: block;
  orphans: 1;
  widows: 1;
}

.card-wrap {
  break-inside: avoid;
  page-break-inside: avoid;
  -webkit-column-break-inside: avoid;
  display: inline-block;
  width: 100%;
  vertical-align: top;
}

.image-card {
  position: relative;
  display: block;
  width: 100%;
  text-align: left;
  overflow: hidden;
  border-radius: var(--radius-md);
  background: var(--bg-white);
  box-shadow: var(--shadow-card);
  transition:
    transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    box-shadow 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  will-change: transform, box-shadow;
  transform: translate3d(0, 0, 0);
}

.image-card:hover {
  transform: translate3d(0, -4px, 0);
  box-shadow: var(--shadow-hover);
  z-index: 2;
}

.image-placeholder {
  position: relative;
  display: block;
  width: 100%;
  overflow: hidden;
  transition: filter var(--transition-base);
}

.image-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transform: scale(1.02);
  transition:
    opacity 0.45s ease-out,
    transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
  background: inherit;
}
.image-img.loaded {
  opacity: 1;
}
.image-card:hover .image-img.loaded {
  transform: scale(1.06);
}

.card-overlay {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 18px 14px 14px;
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0.25) 45%,
    rgba(0, 0, 0, 0.65) 100%
  );
  opacity: 0;
  transform: translateY(8px);
  transition:
    opacity 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  pointer-events: none;
  color: #fff;
}
.image-card:hover .card-overlay {
  opacity: 1;
  transform: translateY(0);
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.35;
  margin-bottom: 6px;
  letter-spacing: 0.1px;
  background: linear-gradient(90deg, #ffffff 0%, #f8f9fa 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.card-tag {
  font-size: 11px;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.16);
  color: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}

.fav-btn {
  position: absolute;
  right: 10px;
  bottom: 10px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: grid;
  place-items: center;
  color: #ffffff;
  opacity: 0;
  transform: translateY(6px) scale(0.9);
  transition:
    opacity 0.25s var(--ease-out),
    transform 0.25s var(--ease-out),
    background-color 0.25s var(--ease-out);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
  z-index: 3;
  will-change: transform;
}
.image-card:hover .fav-btn,
.fav-btn.active {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.fav-btn {
  color: var(--text-primary);
}
.fav-btn.active {
  background: linear-gradient(135deg, var(--fav-start), var(--fav-end));
  color: #fff;
  box-shadow: 0 4px 14px rgba(238, 90, 36, 0.4);
}
.fav-btn:hover:not(.active) {
  background: #fff;
  transform: scale(1.08);
}
.fav-btn:active {
  transform: scale(0.92);
}

.card-transition-enter-active,
.card-transition-leave-active {
  transition:
    opacity 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.card-transition-enter-from {
  opacity: 0;
  transform: scale(0.94);
}
.card-transition-leave-to {
  opacity: 0;
  transform: scale(0.94);
}
.card-transition-move {
  transition: transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.empty-state {
  padding: 80px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.empty-icon {
  color: var(--text-muted);
  opacity: 0.6;
  margin-bottom: 8px;
}

.empty-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.empty-desc {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 16px;
}

.empty-btn {
  padding: 8px 18px;
  border-radius: 999px;
  background: var(--text-primary);
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  transition: var(--transition-fast);
}
.empty-btn:hover {
  opacity: 0.88;
  transform: translateY(-1px);
}

.empty-fade-enter-active,
.empty-fade-leave-active {
  transition: opacity 0.3s ease-out;
}
.empty-fade-enter-from,
.empty-fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .card-overlay {
    padding: 14px 10px 10px;
    opacity: 1;
    transform: none;
  }
  .card-title {
    font-size: 12.5px;
  }
  .card-tag {
    font-size: 10px;
  }
  .fav-btn {
    width: 30px;
    height: 30px;
    opacity: 1;
    transform: none;
  }
}
</style>
