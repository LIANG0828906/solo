<script setup lang="ts">
import { BookmarkGrid } from '@/modules/bookmark';

const emit = defineEmits<{
  select: [id: string];
}>();
</script>

<template>
  <div class="bookmark-page">
    <BookmarkGrid @select="emit('select', $event)" />
  </div>
</template>

<style scoped>
.bookmark-page { height: 100%; }
</style>
