<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import { useGalleryStore } from '@/stores/galleryStore'

const store = useGalleryStore()

onMounted(() => {
  store.setScope('favorites')
})
onBeforeUnmount(() => {
  store.clearSearch()
  store.clearTags()
})
</script>

<template>
  <div></div>
</template>
