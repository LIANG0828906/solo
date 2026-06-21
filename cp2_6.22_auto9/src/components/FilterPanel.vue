<template>
  <div class="filter-panel">
    <div class="filter-header">
      <h3 class="filter-title">标签筛选</h3>
      <button
        v-if="selectedTagsCount > 0"
        class="clear-btn"
        @click="clearAllTags"
      >
        清除全部
      </button>
    </div>

    <div class="tag-list">
      <button
        v-for="item in allTags"
        :key="item.tag"
        class="tag"
        :class="{ active: galleryStore.selectedTags.has(item.tag) }"
        @click="galleryStore.toggleTag(item.tag)"
      >
        <span class="tag-name">{{ item.tag }}</span>
        <span class="tag-count">{{ item.count }}</span>
      </button>
    </div>

    <div v-if="selectedTagsCount > 0" class="selected-info">
      <span>已选 {{ selectedTagsCount }} 个标签</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGalleryStore } from '../stores/galleryStore'

const galleryStore = useGalleryStore()

const allTags = computed(() => galleryStore.allTags)
const selectedTagsCount = computed(() => galleryStore.selectedTags.size)

const clearAllTags = () => {
  galleryStore.selectedTags.clear()
}
</script>

<style scoped>
.filter-panel {
  width: 100%;
}

.filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.filter-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #2c3e50;
}

.clear-btn {
  padding: 4px 10px;
  font-size: 12px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  background-color: #ffffff;
  color: #6c757d;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s ease;
}

.clear-btn:hover {
  border-color: #2c3e50;
  color: #2c3e50;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 13px;
  border: 1px solid #dee2e6;
  border-radius: 16px;
  background-color: #ffffff;
  color: #495057;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.tag:hover {
  border-color: #adb5bd;
  background-color: #f8f9fa;
}

.tag.active {
  background-color: #2c3e50;
  border-color: #2c3e50;
  color: #ffffff;
}

.tag-count {
  font-size: 11px;
  opacity: 0.7;
}

.selected-info {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #f1f3f5;
  font-size: 12px;
  color: #6c757d;
}
</style>
