<template>
  <div class="favorites-view">
    <div class="view-header">
      <h2 class="view-title">我的收藏</h2>
      <div class="view-tabs">
        <router-link to="/" class="tab">全部</router-link>
        <router-link to="/favorites" class="tab active">收藏</router-link>
      </div>
    </div>
    <div v-if="galleryStore.favoriteImages.length === 0" class="empty-state">
      <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      <p class="empty-text">暂无收藏的图片</p>
      <p class="empty-desc">点击图片卡片上的爱心图标来收藏喜欢的图片</p>
    </div>
    <div v-else>
      <div class="results-info">
        <span>收藏了 {{ galleryStore.favoriteImages.length }} 张图片</span>
      </div>
      <WaterfallGrid :images="filteredFavorites" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import WaterfallGrid from '../components/WaterfallGrid.vue'
import { useGalleryStore } from '../stores/galleryStore'
import type { Image } from '../types'

const galleryStore = useGalleryStore()

const filteredFavorites = computed<Image[]>(() => {
  let result = galleryStore.favoriteImages

  if (galleryStore.searchQuery.trim()) {
    const query = galleryStore.searchQuery.toLowerCase()
    result = result.filter(img =>
      img.title.toLowerCase().includes(query) ||
      img.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }

  if (galleryStore.selectedTags.size > 0) {
    result = result.filter(img =>
      Array.from(galleryStore.selectedTags).every(tag => img.tags.includes(tag))
    )
  }

  return result
})
</script>

<style scoped>
.favorites-view {
  width: 100%;
}

.view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.view-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: #2c3e50;
}

.view-tabs {
  display: flex;
  gap: 8px;
}

.tab {
  padding: 8px 16px;
  font-size: 14px;
  color: #6c757d;
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.tab:hover {
  background-color: #e9ecef;
}

.tab.active {
  background-color: #2c3e50;
  color: #ffffff;
}

.results-info {
  font-size: 13px;
  color: #6c757d;
  margin-bottom: 16px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.empty-icon {
  width: 64px;
  height: 64px;
  color: #dee2e6;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  font-weight: 500;
  color: #495057;
  margin: 0 0 8px 0;
}

.empty-desc {
  font-size: 14px;
  color: #adb5bd;
  margin: 0;
}

@media (max-width: 768px) {
  .view-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 12px;
  }

  .view-title {
    font-size: 18px;
  }

  .view-tabs {
    width: 100%;
  }

  .tab {
    flex: 1;
    text-align: center;
  }
}
</style>
