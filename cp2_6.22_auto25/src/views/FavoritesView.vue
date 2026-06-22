<script setup lang="ts">
import { computed } from 'vue'
import { useGalleryStore } from '@/stores/galleryStore'
import WaterfallGrid from '@/components/WaterfallGrid.vue'

const emit = defineEmits<{
  (e: 'open-modal', image: any): void
}>()

const store = useGalleryStore()

const filteredFavorites = computed(() => {
  let result = store.favoriteImages

  if (store.searchQuery.trim()) {
    const query = store.searchQuery.toLowerCase().trim()
    result = result.filter(
      (img) =>
        img.title.toLowerCase().includes(query) ||
        img.tags.some((tag) => tag.toLowerCase().includes(query))
    )
  }

  if (store.selectedTags.length > 0) {
    result = result.filter((img) =>
      store.selectedTags.every((tag) => img.tags.includes(tag))
    )
  }

  return result
})
</script>

<template>
  <div class="favorites-view">
    <div v-if="store.favoriteImages.length === 0" class="empty-favorites">
      <div class="empty-icon">♡</div>
      <p class="empty-text">暂无收藏图片</p>
      <p class="empty-subtext">点击图片卡片上的心形按钮添加收藏</p>
    </div>
    <div v-else-if="filteredFavorites.length === 0" class="no-results">
      <p class="no-results-text">收藏中没有匹配的图片</p>
      <p class="no-results-subtext">尝试调整搜索关键词或筛选条件</p>
    </div>
    <WaterfallGrid
      v-else
      :images="filteredFavorites"
      @open-modal="(img) => emit('open-modal', img)"
    />
  </div>
</template>

<style scoped>
.favorites-view {
  width: 100%;
}

.empty-favorites {
  text-align: center;
  padding: 80px 24px;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.3;
}

.empty-text {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.empty-subtext {
  font-size: 14px;
}

.no-results {
  text-align: center;
  padding: 80px 24px;
  color: var(--text-secondary);
}

.no-results-text {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.no-results-subtext {
  font-size: 14px;
}
</style>
