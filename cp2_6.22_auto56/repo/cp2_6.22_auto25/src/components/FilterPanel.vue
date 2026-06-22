<script setup lang="ts">
import { computed } from 'vue'
import { useGalleryStore } from '@/stores/galleryStore'

interface Props {
  isFavoritesView?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isFavoritesView: false,
})

const emit = defineEmits<{
  (e: 'tag-toggled', tag: string): void
}>()

const store = useGalleryStore()

const tags = computed(() => {
  return props.isFavoritesView ? store.favoriteTags : store.allTags
})

function handleTagClick(_e: MouseEvent, tag: string): void {
  store.toggleTag(tag)
  emit('tag-toggled', tag)
}

function handleClearAll(_e: MouseEvent): void {
  store.clearAllTags()
}
</script>

<template>
  <div class="filter-panel">
    <div class="panel-header">
      <h3 class="panel-title">标签筛选</h3>
      <button
        v-if="store.selectedTags.length > 0"
        class="clear-all-btn"
        @click="handleClearAll"
      >
        清除全部
      </button>
    </div>

    <div class="tags-list">
      <button
        v-for="tag in tags"
        :key="tag.name"
        class="tag-item"
        :class="{ active: store.isTagSelected(tag.name) }"
        @click="(e: MouseEvent): void => handleTagClick(e, tag.name)"
      >
        <span class="tag-name">{{ tag.name }}</span>
        <span class="tag-count">{{ tag.count }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.filter-panel {
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  padding: 20px;
  box-shadow: var(--shadow-sm);
  height: fit-content;
  position: sticky;
  top: 100px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.clear-all-btn {
  font-size: 12px;
  color: var(--text-secondary);
  padding: 4px 8px;
  border-radius: 4px;
  transition: all var(--transition-fast);
}

.clear-all-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.tags-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 4px;
}

.tags-list::-webkit-scrollbar {
  width: 4px;
}

.tags-list::-webkit-scrollbar-track {
  background: transparent;
}

.tags-list::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
}

.tag-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: var(--border-radius);
  font-size: 14px;
  color: var(--text-primary);
  transition: all var(--transition-normal);
  border: 2px solid transparent;
}

.tag-item:hover {
  background: var(--bg-secondary);
}

.tag-item.active {
  background: rgba(44, 62, 80, 0.1);
  border-color: var(--accent);
}

.tag-name {
  font-weight: 500;
}

.tag-count {
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
  transition: all var(--transition-fast);
}

.tag-item.active .tag-count {
  background: var(--accent);
  color: white;
}

@media (max-width: 768px) {
  .filter-panel {
    position: static;
    box-shadow: none;
    padding: 16px 20px 24px;
  }

  .tags-list {
    max-height: none;
  }
}
</style>
