<template>
  <div class="gallery-view">
    <div class="view-header">
      <h2 class="view-title">探索画廊</h2>
      <div class="view-tabs">
        <router-link to="/" class="tab active">全部</router-link>
        <router-link to="/favorites" class="tab">收藏</router-link>
      </div>
    </div>
    <div class="results-info">
      <span>共 {{ galleryStore.filteredImages.length }} 张图片</span>
    </div>
    <WaterfallGrid :images="galleryStore.filteredImages" />
  </div>
</template>

<script setup lang="ts">
import WaterfallGrid from '../components/WaterfallGrid.vue'
import { useGalleryStore } from '../stores/galleryStore'

const galleryStore = useGalleryStore()
</script>

<style scoped>
.gallery-view {
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
