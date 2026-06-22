<script setup lang="ts">
import type { Bookmark } from '@/shared/types';
import { getFaviconUrl } from '@/shared/api';

const props = defineProps<{ bookmark: Bookmark }>();
const emit = defineEmits<{
  delete: [id: string];
  select: [id: string];
}>();

function handleDelete() {
  if (confirm('确定删除该书签？')) {
    emit('delete', props.bookmark.id);
  }
}
</script>

<template>
  <div class="bookmark-card" @click="emit('select', bookmark.id)">
    <div class="card-favicon">
      <img v-if="bookmark.favicon" :src="bookmark.favicon" :alt="bookmark.title" @error="($event.target as HTMLImageElement).style.display='none'" />
      <span v-else class="favicon-fallback">{{ bookmark.title.charAt(0).toUpperCase() }}</span>
    </div>
    <div class="card-info">
      <h4 class="card-title">{{ bookmark.title }}</h4>
      <p class="card-url">{{ bookmark.url }}</p>
      <span class="card-group">{{ bookmark.group }}</span>
    </div>
    <button class="btn-delete" @click.stop="handleDelete" title="删除">
      <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M2 3.5h10M5.5 3.5V2.5a1 1 0 011-1h1a1 1 0 011 1v1M3.5 3.5l.5 8a1 1 0 001 1h4a1 1 0 001-1l.5-8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
    </button>
  </div>
</template>

<style scoped>
.bookmark-card { background: var(--bg-card); border-radius: var(--radius-md); padding: 14px; cursor: pointer; transition: all 0.2s ease; border: 1px solid transparent; display: flex; gap: 10px; align-items: flex-start; position: relative; }
.bookmark-card:hover { transform: scale(1.05); box-shadow: var(--shadow-elevated); border-color: var(--border-color); z-index: 1; }
.card-favicon { width: 32px; height: 32px; border-radius: var(--radius-sm); overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: var(--bg-secondary); }
.card-favicon img { width: 100%; height: 100%; object-fit: contain; }
.favicon-fallback { font-size: 16px; font-weight: 700; color: var(--accent-amber); }
.card-info { flex: 1; min-width: 0; }
.card-title { font-size: 13px; font-weight: 600; margin-bottom: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.card-url { font-size: 11px; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 4px; }
.card-group { display: inline-block; padding: 1px 8px; background: rgba(39, 174, 96, 0.15); color: var(--accent-green); border-radius: 10px; font-size: 10px; }
.btn-delete { position: absolute; top: 8px; right: 8px; padding: 3px; color: var(--text-secondary); opacity: 0; transition: all var(--transition-fast); border-radius: var(--radius-sm); }
.bookmark-card:hover .btn-delete { opacity: 1; }
.btn-delete:hover { color: var(--accent-red); background: rgba(231, 76, 60, 0.15); }
</style>
