<script setup lang="ts">
import { useBookmarkStore } from '../stores/bookmark';
import BookmarkCard from './BookmarkCard.vue';
import { ref, computed } from 'vue';
import { getFaviconUrl } from '@/shared/api';

const store = useBookmarkStore();
const showForm = ref(false);
const newTitle = ref('');
const newUrl = ref('');
const newGroup = ref('');
const newCustomGroup = ref('');
const searchKeyword = ref('');

const emit = defineEmits<{
  select: [id: string];
}>();

const displayedBookmarks = computed(() => {
  let list = store.filteredBookmarks;
  if (searchKeyword.value.trim()) {
    const kw = searchKeyword.value.toLowerCase();
    list = list.filter(b => b.title.toLowerCase().includes(kw) || b.url.toLowerCase().includes(kw));
  }
  return list;
});

function handleCreate() {
  if (!newTitle.value.trim() || !newUrl.value.trim()) return;
  const group = newGroup.value === '__custom__' ? newCustomGroup.value.trim() : newGroup.value || '未分组';
  if (group) store.addGroup(group);
  store.create({
    title: newTitle.value.trim(),
    url: newUrl.value.trim().startsWith('http') ? newUrl.value.trim() : `https://${newUrl.value.trim()}`,
    favicon: getFaviconUrl(newUrl.value.trim().startsWith('http') ? newUrl.value.trim() : `https://${newUrl.value.trim()}`),
    group,
  });
  newTitle.value = '';
  newUrl.value = '';
  newGroup.value = '';
  newCustomGroup.value = '';
  showForm.value = false;
}

function handleDelete(id: string) {
  store.remove(id);
}

function selectGroup(group: string) {
  store.activeGroup = store.activeGroup === group ? '' : group;
}
</script>

<template>
  <div class="bookmark-grid">
    <div class="grid-header">
      <h2>书签</h2>
      <button class="btn-add" @click="showForm = !showForm">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        添加书签
      </button>
    </div>

    <div v-if="showForm" class="create-form">
      <input v-model="newTitle" placeholder="书签标题" class="form-input" />
      <input v-model="newUrl" placeholder="URL 地址" class="form-input" />
      <div class="form-row">
        <select v-model="newGroup" class="form-select">
          <option value="">选择分组</option>
          <option v-for="g in store.groups" :key="g" :value="g">{{ g }}</option>
          <option value="__custom__">新建分组...</option>
        </select>
        <input v-if="newGroup === '__custom__'" v-model="newCustomGroup" placeholder="分组名称" class="form-input" />
      </div>
      <div class="form-actions">
        <button class="btn-primary" @click="handleCreate">添加</button>
        <button class="btn-secondary" @click="showForm = false">取消</button>
      </div>
    </div>

    <div class="group-bar">
      <button class="group-btn" :class="{ active: !store.activeGroup }" @click="store.activeGroup = ''">全部</button>
      <button
        v-for="g in store.groups"
        :key="g"
        class="group-btn"
        :class="{ active: store.activeGroup === g }"
        @click="selectGroup(g)"
      >{{ g }}</button>
    </div>

    <div class="search-bar">
      <svg class="search-icon" width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5"/><path d="M11 11l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      <input v-model="searchKeyword" placeholder="搜索书签..." class="search-input" />
    </div>

    <div class="grid-body">
      <div class="masonry-grid">
        <BookmarkCard
          v-for="bookmark in displayedBookmarks"
          :key="bookmark.id"
          :bookmark="bookmark"
          @delete="handleDelete"
          @select="emit('select', $event)"
        />
      </div>
      <div v-if="displayedBookmarks.length === 0" class="empty-state">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><path d="M10 8h28a2 2 0 012 2v28l-6-4-6 4-6-4-6 4-6-4V10a2 2 0 012-2z" stroke="#8892b0" stroke-width="2"/></svg>
        <p>还没有书签，点击上方按钮添加</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bookmark-grid { height: 100%; display: flex; flex-direction: column; }
.grid-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--border-color); }
.grid-header h2 { font-size: 18px; font-weight: 600; }
.btn-add { display: flex; align-items: center; gap: 6px; padding: 6px 14px; background: var(--accent-amber); color: var(--bg-primary); border-radius: var(--radius-sm); font-size: 13px; font-weight: 500; transition: all var(--transition-normal); }
.btn-add:hover { background: #e6991e; transform: translateY(-1px); }

.create-form { padding: 16px 20px; border-bottom: 1px solid var(--border-color); background: var(--bg-secondary); display: flex; flex-direction: column; gap: 10px; }
.form-input, .form-select { padding: 8px 12px; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); color: var(--text-primary); font-size: 13px; outline: none; transition: border-color var(--transition-fast); }
.form-input:focus, .form-select:focus { border-color: var(--accent-amber); }
.form-select { appearance: none; cursor: pointer; }
.form-row { display: flex; gap: 8px; }
.form-row .form-select, .form-row .form-input { flex: 1; }
.form-actions { display: flex; gap: 8px; }
.btn-primary { padding: 6px 16px; background: var(--accent-amber); color: var(--bg-primary); border-radius: var(--radius-sm); font-size: 13px; font-weight: 500; transition: all var(--transition-normal); }
.btn-primary:hover { background: #e6991e; }
.btn-secondary { padding: 6px 16px; background: var(--bg-card); color: var(--text-secondary); border-radius: var(--radius-sm); font-size: 13px; transition: all var(--transition-normal); }
.btn-secondary:hover { background: var(--bg-card-hover); color: var(--text-primary); }

.group-bar { display: flex; gap: 6px; padding: 10px 20px; overflow-x: auto; flex-wrap: wrap; }
.group-btn { padding: 4px 12px; background: var(--bg-card); border-radius: 14px; font-size: 12px; color: var(--text-secondary); transition: all var(--transition-fast); white-space: nowrap; }
.group-btn:hover { background: var(--bg-card-hover); color: var(--text-primary); }
.group-btn.active { background: rgba(39, 174, 96, 0.2); color: var(--accent-green); }

.search-bar { position: relative; padding: 0 20px 10px; }
.search-icon { position: absolute; left: 32px; top: 9px; color: var(--text-secondary); }
.search-input { width: 100%; padding: 7px 12px 7px 32px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-sm); color: var(--text-primary); font-size: 12px; outline: none; transition: border-color var(--transition-fast); }
.search-input:focus { border-color: var(--accent-amber); }

.grid-body { flex: 1; overflow-y: auto; padding: 0 20px 20px; }
.masonry-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; color: var(--text-secondary); gap: 12px; }
.empty-state p { font-size: 13px; }

@media (max-width: 1200px) { .masonry-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 900px) { .masonry-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 768px) { .masonry-grid { grid-template-columns: 1fr; } }
</style>
