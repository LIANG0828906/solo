<script setup lang="ts">
import { useGalleryStore } from '@/stores/galleryStore'

const store = useGalleryStore()
</script>

<template>
  <div class="filter-panel">
    <div class="panel-header">
      <h3 class="panel-title">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
        </svg>
        标签筛选
      </h3>
      <button
        v-if="store.selectedTags.length > 0"
        type="button"
        class="clear-tags"
        @click="store.clearTags"
      >
        清除
      </button>
    </div>

    <div class="tags-list">
      <button
        v-for="tag in store.allTags"
        :key="tag.name"
        type="button"
        class="tag-item"
        :class="{ selected: store.selectedTags.includes(tag.name) }"
        @click="store.toggleTag(tag.name)"
      >
        <span class="tag-name">{{ tag.name }}</span>
        <span class="tag-count">{{ tag.count }}</span>
      </button>
    </div>

    <div v-if="store.allTags.length === 0" class="empty-hint">
      暂无标签
    </div>
  </div>
</template>

<style scoped>
.filter-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border);
}

.panel-title {
  display: flex;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.3px;
  color: var(--text-primary);
}

.clear-tags {
  font-size: 12px;
  font-weight: 500;
  color: var(--fav-end);
  padding: 4px 8px;
  border-radius: 6px;
  transition: var(--transition-fast);
}
.clear-tags:hover {
  background: rgba(238, 90, 36, 0.08);
}

.tags-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 50vh;
  overflow-y: auto;
  padding: 2px;
}

.tag-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 12px;
  border-radius: 8px;
  background: transparent;
  border: 1px solid transparent;
  transition:
    background-color 0.3s ease-out,
    transform 0.3s ease-out,
    opacity 0.3s ease-out,
    border-color 0.3s ease-out,
    color 0.3s ease-out;
  color: var(--text-secondary);
  will-change: transform, opacity;
}

.tag-item:hover {
  background: var(--bg-primary);
  color: var(--text-primary);
}

.tag-item.selected {
  background: linear-gradient(135deg, rgba(44, 62, 80, 0.08), rgba(44, 62, 80, 0.04));
  border-color: rgba(44, 62, 80, 0.3);
  color: var(--text-primary);
  transform: scale(1.01);
}

.tag-name {
  font-size: 13px;
  font-weight: 500;
  text-transform: lowercase;
}

.tag-count {
  min-width: 22px;
  height: 20px;
  padding: 0 7px;
  font-size: 11px;
  font-weight: 600;
  line-height: 20px;
  text-align: center;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.04);
  color: var(--text-muted);
  transition: var(--transition-fast);
}

.tag-item.selected .tag-count {
  background: var(--text-primary);
  color: #fff;
}

.empty-hint {
  padding: 14px;
  text-align: center;
  color: var(--text-muted);
  font-size: 12px;
}

@media (max-width: 768px) {
  .tags-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    max-height: none;
  }
  .tag-item {
    padding: 10px 12px;
  }
  .panel-title {
    font-size: 14px;
  }
}
</style>
