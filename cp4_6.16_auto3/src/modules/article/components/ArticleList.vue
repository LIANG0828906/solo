<script setup lang="ts">
import { useArticleStore } from '../stores/article';
import { ref } from 'vue';

const store = useArticleStore();
const showForm = ref(false);
const newTitle = ref('');
const newContent = ref('');
const newTags = ref('');

const emit = defineEmits<{
  select: [id: string];
}>();

function handleCreate() {
  if (!newTitle.value.trim()) return;
  store.create({
    title: newTitle.value.trim(),
    content: newContent.value,
    tags: newTags.value.split(',').map(t => t.trim()).filter(Boolean),
  });
  newTitle.value = '';
  newContent.value = '';
  newTags.value = '';
  showForm.value = false;
}

function handleDelete(id: string) {
  const result = store.remove(id);
  if (!result.success && result.references.length > 0) {
    const taskNames = result.references.map(r => `"${r.title}"`).join('、');
    const confirmed = window.confirm(
      `该笔记被以下任务引用：${taskNames}。删除笔记将同时解除这些引用关系，是否继续？`
    );
    if (confirmed) {
      store.forceRemove(id);
    }
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
</script>

<template>
  <div class="article-list">
    <div class="list-header">
      <h2>笔记</h2>
      <button class="btn-add" @click="showForm = !showForm">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        新建笔记
      </button>
    </div>

    <div v-if="showForm" class="create-form">
      <input v-model="newTitle" placeholder="笔记标题" class="form-input" />
      <textarea v-model="newContent" placeholder="开始书写..." class="form-textarea" rows="4"></textarea>
      <input v-model="newTags" placeholder="标签（逗号分隔）" class="form-input" />
      <div class="form-actions">
        <button class="btn-primary" @click="handleCreate">创建</button>
        <button class="btn-secondary" @click="showForm = false">取消</button>
      </div>
    </div>

    <div class="articles">
      <div
        v-for="article in store.sortedArticles"
        :key="article.id"
        class="article-card"
        @click="emit('select', article.id)"
      >
        <div class="card-content">
          <h3 class="card-title">{{ article.title || '无标题' }}</h3>
          <p class="card-excerpt">{{ article.content.slice(0, 120) || '暂无内容' }}</p>
          <div class="card-meta">
            <span class="card-date">{{ formatDate(article.updatedAt) }}</span>
            <div class="card-tags">
              <span v-for="tag in article.tags.slice(0, 3)" :key="tag" class="tag">{{ tag }}</span>
            </div>
          </div>
        </div>
        <button class="btn-delete" @click.stop="handleDelete(article.id)" title="删除">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 3.5h10M5.5 3.5V2.5a1 1 0 011-1h1a1 1 0 011 1v1M3.5 3.5l.5 8a1 1 0 001 1h4a1 1 0 001-1l.5-8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
        </button>
      </div>
      <div v-if="store.articles.length === 0" class="empty-state">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><path d="M14 8h20a2 2 0 012 2v28a2 2 0 01-2 2H14a2 2 0 01-2-2V10a2 2 0 012-2zM18 16h12M18 22h12M18 28h8" stroke="#8892b0" stroke-width="2" stroke-linecap="round"/></svg>
        <p>还没有笔记，点击上方按钮创建</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.article-list { height: 100%; display: flex; flex-direction: column; }
.list-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--border-color); }
.list-header h2 { font-size: 18px; font-weight: 600; color: var(--text-primary); }
.btn-add { display: flex; align-items: center; gap: 6px; padding: 6px 14px; background: var(--accent-amber); color: var(--bg-primary); border-radius: var(--radius-sm); font-size: 13px; font-weight: 500; transition: all var(--transition-normal); }
.btn-add:hover { background: #e6991e; transform: translateY(-1px); }
.create-form { padding: 16px 20px; border-bottom: 1px solid var(--border-color); background: var(--bg-secondary); display: flex; flex-direction: column; gap: 10px; }
.form-input { padding: 8px 12px; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); color: var(--text-primary); font-size: 13px; outline: none; transition: border-color var(--transition-fast); }
.form-input:focus { border-color: var(--accent-amber); }
.form-textarea { padding: 8px 12px; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); color: var(--text-primary); font-size: 13px; outline: none; resize: vertical; transition: border-color var(--transition-fast); font-family: monospace; }
.form-textarea:focus { border-color: var(--accent-amber); }
.form-actions { display: flex; gap: 8px; }
.btn-primary { padding: 6px 16px; background: var(--accent-amber); color: var(--bg-primary); border-radius: var(--radius-sm); font-size: 13px; font-weight: 500; transition: all var(--transition-normal); }
.btn-primary:hover { background: #e6991e; }
.btn-secondary { padding: 6px 16px; background: var(--bg-card); color: var(--text-secondary); border-radius: var(--radius-sm); font-size: 13px; transition: all var(--transition-normal); }
.btn-secondary:hover { background: var(--bg-card-hover); color: var(--text-primary); }
.articles { flex: 1; overflow-y: auto; padding: 12px 20px; }
.article-card { position: relative; padding: 14px 16px; background: var(--bg-card); border-radius: var(--radius-md); margin-bottom: 10px; cursor: pointer; transition: all var(--transition-fast); border: 1px solid transparent; }
.article-card:hover { background: var(--bg-card-hover); border-color: var(--border-color); transform: translateY(-1px); box-shadow: var(--shadow-card); }
.card-title { font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px; }
.card-excerpt { font-size: 12px; color: var(--text-secondary); line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.card-meta { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }
.card-date { font-size: 11px; color: var(--text-secondary); }
.card-tags { display: flex; gap: 4px; }
.tag { padding: 1px 8px; background: rgba(245, 166, 35, 0.15); color: var(--accent-amber); border-radius: 10px; font-size: 11px; }
.btn-delete { position: absolute; top: 10px; right: 10px; padding: 4px; color: var(--text-secondary); opacity: 0; transition: all var(--transition-fast); border-radius: var(--radius-sm); }
.article-card:hover .btn-delete { opacity: 1; }
.btn-delete:hover { color: var(--accent-red); background: rgba(231, 76, 60, 0.15); }
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; color: var(--text-secondary); gap: 12px; }
.empty-state p { font-size: 13px; }
</style>
