<script setup lang="ts">
import { useBookmarkStore } from '../stores/bookmark';
import { ref, computed } from 'vue';

const store = useBookmarkStore();
const keyword = ref('');

const results = computed(() => {
  if (!keyword.value.trim()) return [];
  const kw = keyword.value.toLowerCase();
  return store.bookmarks.filter(b =>
    b.title.toLowerCase().includes(kw) || b.url.toLowerCase().includes(kw)
  );
});
</script>

<template>
  <div class="bookmark-search">
    <div class="search-box">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5"/><path d="M11 11l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      <input v-model="keyword" placeholder="搜索书签..." class="search-input" />
    </div>
    <div v-if="keyword.trim() && results.length > 0" class="search-results">
      <div v-for="b in results" :key="b.id" class="result-item">
        <img v-if="b.favicon" :src="b.favicon" class="result-favicon" />
        <div class="result-info">
          <span class="result-title">{{ b.title }}</span>
          <span class="result-url">{{ b.url }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-box { position: relative; display: flex; align-items: center; gap: 8px; }
.search-box svg { position: absolute; left: 10px; color: var(--text-secondary); }
.search-input { width: 100%; padding: 7px 12px 7px 30px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-sm); color: var(--text-primary); font-size: 12px; outline: none; }
.search-input:focus { border-color: var(--accent-amber); }
.search-results { position: absolute; top: 100%; left: 0; right: 0; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); margin-top: 4px; max-height: 200px; overflow-y: auto; z-index: 100; }
.result-item { display: flex; align-items: center; gap: 8px; padding: 8px 12px; cursor: pointer; transition: background var(--transition-fast); }
.result-item:hover { background: var(--bg-card-hover); }
.result-favicon { width: 16px; height: 16px; }
.result-info { flex: 1; min-width: 0; }
.result-title { display: block; font-size: 12px; font-weight: 500; }
.result-url { display: block; font-size: 10px; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
