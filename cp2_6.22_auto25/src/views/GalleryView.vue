<script setup lang="ts">
import { computed } from 'vue'
import { useGalleryStore } from '@/stores/galleryStore'
import WaterfallGrid from '@/components/WaterfallGrid.vue'

const emit = defineEmits<{
  (e: 'open-modal', image: any): void
}>()

const store = useGalleryStore()
const images = computed(() => store.filteredImages)
</script>

<template>
  <div class="gallery-view">
    <div v-if="images.length === 0 && (store.searchQuery || store.selectedTags.length > 0)" class="no-results">
      <p class="no-results-text">没有找到匹配的图片</p>
      <p class="no-results-subtext">尝试调整搜索关键词或筛选条件</p>
    </div>
    <WaterfallGrid
      v-else
      :images="images"
      @open-modal="(img) => emit('open-modal', img)"
    />
  </div>
</template>

<style scoped>
.gallery-view {
  width: 100%;
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
