<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { globalSearch } from '@/shared/api';
import type { SearchResult } from '@/shared/types';
import { useArticleStore } from '@/modules/article/stores/article';
import { useTaskStore } from '@/modules/task/stores/task';
import { useBookmarkStore } from '@/modules/bookmark/stores/bookmark';

const router = useRouter();
const route = useRoute();
const articleStore = useArticleStore();
const taskStore = useTaskStore();
const bookmarkStore = useBookmarkStore();

const searchKeyword = ref('');
const searchResults = ref<SearchResult[]>([]);
const showSearch = ref(false);
const detailPanelOpen = ref(false);
const detailType = ref<'article' | 'task' | 'bookmark' | null>(null);
const detailId = ref<string | null>(null);

const currentModule = computed(() => {
  const path = route.path;
  if (path.includes('task')) return 'task';
  if (path.includes('bookmark')) return 'bookmark';
  return 'article';
});

const navItems = [
  { key: 'article', label: '笔记', path: '/article', icon: 'M14 8H2M8 2v12' },
  { key: 'task', label: '任务', path: '/task', icon: 'M5 2h10a1 1 0 011 1v10a1 1 0 01-1 1H5a1 1 0 01-1-1V3a1 1 0 011-1zM8 6h4M8 9h2' },
  { key: 'bookmark', label: '书签', path: '/bookmark', icon: 'M10 2H6a2 2 0 00-2 2v12l4-2 4 2V4a2 2 0 00-2-2z' },
];

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

watch(searchKeyword, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer);
  if (!val.trim()) {
    searchResults.value = [];
    showSearch.value = false;
    return;
  }
  debounceTimer = setTimeout(() => {
    searchResults.value = globalSearch(val);
    showSearch.value = true;
  }, 300);
});

function navigateTo(path: string) {
  router.push(path);
}

function handleSearchResultClick(result: SearchResult) {
  showSearch.value = false;
  searchKeyword.value = '';
  openDetail(result.module, result.id);
  if (route.path !== `/${result.module}`) {
    router.push(`/${result.module}`);
  }
}

function openDetail(type: 'article' | 'task' | 'bookmark', id: string) {
  detailType.value = type;
  detailId.value = id;
  detailPanelOpen.value = true;
}

function closeDetail() {
  detailPanelOpen.value = false;
  detailType.value = null;
  detailId.value = null;
}

const selectedArticle = computed(() => {
  if (detailType.value !== 'article' || !detailId.value) return null;
  return articleStore.articles.find(a => a.id === detailId.value) || null;
});

const selectedTask = computed(() => {
  if (detailType.value !== 'task' || !detailId.value) return null;
  return taskStore.tasks.find(t => t.id === detailId.value) || null;
});

const selectedBookmark = computed(() => {
  if (detailType.value !== 'bookmark' || !detailId.value) return null;
  return bookmarkStore.bookmarks.find(b => b.id === detailId.value) || null;
});

const taskPriorityLabel: Record<string, string> = { low: '低', medium: '中', high: '高' };
const taskStatusLabel: Record<string, string> = { todo: '待开始', in_progress: '进行中', done: '已完成' };

function handleArticleDelete() {
  if (!selectedArticle.value) return;
  const result = articleStore.remove(selectedArticle.value.id);
  if (!result.success && result.references.length > 0) {
    const taskNames = result.references.map(r => `"${r.title}"`).join('、');
    const confirmed = window.confirm(
      `该笔记被以下任务引用：${taskNames}。删除笔记将同时解除这些引用关系，是否继续？`
    );
    if (confirmed) {
      taskStore.clearArticleRef(selectedArticle.value.id);
      articleStore.forceRemove(selectedArticle.value.id);
      closeDetail();
    }
  } else {
    closeDetail();
  }
}

function handleTaskDelete() {
  if (!selectedTask.value) return;
  if (confirm('确定删除该任务？')) {
    taskStore.remove(selectedTask.value.id);
    closeDetail();
  }
}

function handleBookmarkDelete() {
  if (!selectedBookmark.value) return;
  if (confirm('确定删除该书签？')) {
    bookmarkStore.remove(selectedBookmark.value.id);
    closeDetail();
  }
}
</script>

<template>
  <div class="app-layout">
    <nav class="sidebar">
      <div class="sidebar-logo">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="#f5a623" stroke-width="2"/>
          <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="#27ae60" stroke-width="2"/>
          <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="#3498db" stroke-width="2"/>
          <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="#8892b0" stroke-width="2"/>
        </svg>
      </div>
      <div class="nav-items">
        <button
          v-for="item in navItems"
          :key="item.key"
          class="nav-item"
          :class="{ active: currentModule === item.key }"
          @click="navigateTo(item.path)"
        >
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
            <path :d="item.icon" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="nav-label">{{ item.label }}</span>
        </button>
      </div>
    </nav>

    <div class="main-area">
      <header class="topbar">
        <div class="search-container">
          <svg class="search-icon" width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5"/><path d="M11 11l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          <input
            v-model="searchKeyword"
            placeholder="搜索笔记、任务、书签..."
            class="search-input"
            @focus="searchKeyword && (showSearch = true)"
            @blur="setTimeout(() => showSearch = false, 200)"
          />
          <div v-if="showSearch && searchResults.length > 0" class="search-dropdown">
            <div class="search-section" v-if="searchResults.filter(r => r.module === 'article').length">
              <div class="section-title">笔记</div>
              <div
                v-for="r in searchResults.filter(r => r.module === 'article')"
                :key="r.id"
                class="search-item"
                @mousedown.prevent="handleSearchResultClick(r)"
              >
                <span class="item-title">{{ r.title }}</span>
                <span class="item-excerpt">{{ r.excerpt }}</span>
              </div>
            </div>
            <div class="search-section" v-if="searchResults.filter(r => r.module === 'task').length">
              <div class="section-title">任务</div>
              <div
                v-for="r in searchResults.filter(r => r.module === 'task')"
                :key="r.id"
                class="search-item"
                @mousedown.prevent="handleSearchResultClick(r)"
              >
                <span class="item-title">{{ r.title }}</span>
                <span class="item-excerpt">{{ r.excerpt }}</span>
              </div>
            </div>
            <div class="search-section" v-if="searchResults.filter(r => r.module === 'bookmark').length">
              <div class="section-title">书签</div>
              <div
                v-for="r in searchResults.filter(r => r.module === 'bookmark')"
                :key="r.id"
                class="search-item"
                @mousedown.prevent="handleSearchResultClick(r)"
              >
                <span class="item-title">{{ r.title }}</span>
                <span class="item-excerpt">{{ r.excerpt }}</span>
              </div>
            </div>
            <div v-if="searchResults.length === 0" class="search-empty">未找到相关结果</div>
          </div>
        </div>
      </header>

      <main class="content">
        <router-view
          @select="(id: string) => openDetail(currentModule, id)"
        />
      </main>
    </div>

    <Transition name="slide">
      <div v-if="detailPanelOpen" class="detail-panel">
        <div class="detail-header">
          <button class="btn-close" @click="closeDetail">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          </button>
          <span class="detail-type-label">{{ detailType === 'article' ? '笔记' : detailType === 'task' ? '任务' : '书签' }}</span>
        </div>
        <div class="detail-body">
          <template v-if="detailType === 'article' && selectedArticle">
            <h3 class="detail-title">{{ selectedArticle.title || '无标题' }}</h3>
            <div class="detail-meta">
              <span>更新于 {{ new Date(selectedArticle.updatedAt).toLocaleString('zh-CN') }}</span>
            </div>
            <div class="detail-tags">
              <span v-for="tag in selectedArticle.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
            <div class="detail-content-text">{{ selectedArticle.content.slice(0, 500) }}{{ selectedArticle.content.length > 500 ? '...' : '' }}</div>
            <button class="btn-danger" @click="handleArticleDelete">删除笔记</button>
          </template>
          <template v-if="detailType === 'task' && selectedTask">
            <h3 class="detail-title">{{ selectedTask.title }}</h3>
            <div class="detail-meta">
              <span class="task-status-badge" :class="'status-' + selectedTask.status">{{ taskStatusLabel[selectedTask.status] }}</span>
              <span class="task-priority-badge" :class="'priority-' + selectedTask.priority">{{ taskPriorityLabel[selectedTask.priority] }}优先级</span>
            </div>
            <p class="detail-desc">{{ selectedTask.description }}</p>
            <div v-if="selectedTask.dueDate" class="detail-due">
              截止日期：{{ new Date(selectedTask.dueDate).toLocaleDateString('zh-CN') }}
            </div>
            <button class="btn-danger" @click="handleTaskDelete">删除任务</button>
          </template>
          <template v-if="detailType === 'bookmark' && selectedBookmark">
            <h3 class="detail-title">{{ selectedBookmark.title }}</h3>
            <div class="detail-meta">
              <a :href="selectedBookmark.url" target="_blank" rel="noopener">{{ selectedBookmark.url }}</a>
            </div>
            <div class="detail-group-badge">{{ selectedBookmark.group }}</div>
            <button class="btn-danger" @click="handleBookmarkDelete">删除书签</button>
          </template>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.app-layout { display: flex; height: 100vh; overflow: hidden; }

.sidebar { width: var(--nav-width); background: var(--bg-secondary); border-right: 1px solid var(--border-color); display: flex; flex-direction: column; align-items: center; padding: 16px 0; flex-shrink: 0; }
.sidebar-logo { padding: 8px 0 20px; }
.nav-items { display: flex; flex-direction: column; gap: 4px; width: 100%; padding: 0 8px; }
.nav-item { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 10px 8px; border-radius: var(--radius-md); color: var(--text-secondary); transition: all var(--transition-normal); position: relative; }
.nav-item:hover { color: var(--text-primary); background: var(--bg-card); }
.nav-item.active { color: var(--accent-amber); background: rgba(245, 166, 35, 0.1); }
.nav-item.active::before { content: ''; position: absolute; left: -8px; top: 50%; transform: translateY(-50%); width: 3px; height: 20px; background: var(--accent-amber); border-radius: 0 2px 2px 0; }
.nav-label { font-size: 10px; }

.main-area { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.topbar { height: 48px; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; padding: 0 20px; flex-shrink: 0; background: var(--bg-secondary); }
.search-container { position: relative; width: 100%; max-width: 600px; }
.search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-secondary); pointer-events: none; }
.search-input { width: 100%; padding: 7px 12px 7px 34px; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); color: var(--text-primary); font-size: 13px; outline: none; transition: border-color var(--transition-fast); }
.search-input:focus { border-color: var(--accent-amber); }
.search-dropdown { position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); max-height: 400px; overflow-y: auto; z-index: 1000; box-shadow: var(--shadow-elevated); }
.search-section { border-bottom: 1px solid var(--border-color); }
.search-section:last-child { border-bottom: none; }
.section-title { padding: 8px 14px; font-size: 11px; font-weight: 600; color: var(--accent-amber); text-transform: uppercase; letter-spacing: 0.5px; background: rgba(245, 166, 35, 0.05); }
.search-item { padding: 8px 14px; cursor: pointer; transition: background var(--transition-fast); }
.search-item:hover { background: var(--bg-card-hover); }
.item-title { display: block; font-size: 13px; font-weight: 500; margin-bottom: 2px; }
.item-excerpt { display: block; font-size: 11px; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.search-empty { padding: 20px; text-align: center; color: var(--text-secondary); font-size: 13px; }

.content { flex: 1; overflow: hidden; }

.detail-panel { width: var(--detail-width); background: var(--bg-secondary); border-left: 1px solid var(--border-color); flex-shrink: 0; display: flex; flex-direction: column; position: relative; }
.detail-header { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-bottom: 1px solid var(--border-color); }
.btn-close { padding: 4px; color: var(--text-secondary); border-radius: var(--radius-sm); transition: all var(--transition-fast); }
.btn-close:hover { color: var(--text-primary); background: var(--bg-card); }
.detail-type-label { font-size: 12px; color: var(--text-secondary); }
.detail-body { flex: 1; overflow-y: auto; padding: 16px; }
.detail-title { font-size: 18px; font-weight: 600; margin-bottom: 10px; }
.detail-meta { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; font-size: 12px; color: var(--text-secondary); }
.detail-meta a { color: var(--accent-amber); word-break: break-all; }
.detail-tags { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 12px; }
.tag { padding: 2px 10px; background: rgba(245, 166, 35, 0.15); color: var(--accent-amber); border-radius: 10px; font-size: 11px; }
.detail-content-text { font-size: 13px; color: var(--text-secondary); line-height: 1.7; white-space: pre-wrap; margin-bottom: 16px; }
.detail-desc { font-size: 13px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 12px; }
.detail-due { font-size: 12px; color: var(--text-secondary); margin-bottom: 16px; }
.detail-group-badge { display: inline-block; padding: 3px 12px; background: rgba(39, 174, 96, 0.15); color: var(--accent-green); border-radius: 12px; font-size: 12px; margin-bottom: 16px; }
.btn-danger { padding: 6px 16px; background: rgba(231, 76, 60, 0.15); color: var(--accent-red); border-radius: var(--radius-sm); font-size: 12px; transition: all var(--transition-normal); }
.btn-danger:hover { background: rgba(231, 76, 60, 0.3); }

.task-status-badge { padding: 2px 10px; border-radius: 10px; font-size: 11px; font-weight: 500; }
.status-todo { background: rgba(52, 152, 219, 0.15); color: var(--accent-blue); }
.status-in_progress { background: rgba(245, 166, 35, 0.15); color: var(--accent-amber); }
.status-done { background: rgba(39, 174, 96, 0.15); color: var(--accent-green); }
.task-priority-badge { padding: 2px 10px; border-radius: 10px; font-size: 11px; }
.priority-low { background: rgba(52, 152, 219, 0.15); color: var(--accent-blue); }
.priority-medium { background: rgba(245, 166, 35, 0.15); color: var(--accent-amber); }
.priority-high { background: rgba(231, 76, 60, 0.15); color: var(--accent-red); }

.slide-enter-active { transition: transform var(--transition-panel); }
.slide-leave-active { transition: transform 0.2s ease-in; }
.slide-enter-from, .slide-leave-to { transform: translateX(100%); }

@media (max-width: 768px) {
  .app-layout { flex-direction: column; }
  .sidebar { width: 100%; height: auto; flex-direction: row; border-right: none; border-top: 1px solid var(--border-color); order: 3; padding: 8px 0; }
  .sidebar-logo { display: none; }
  .nav-items { flex-direction: row; justify-content: center; padding: 0 16px; gap: 0; }
  .nav-item { padding: 8px 16px; }
  .nav-item.active::before { left: 50%; top: auto; bottom: -8px; transform: translateX(-50%); width: 20px; height: 3px; border-radius: 2px 2px 0 0; }
  .main-area { order: 1; }
  .detail-panel { position: fixed; top: 0; left: 0; right: 0; bottom: 0; width: 100%; z-index: 200; }
}
</style>
