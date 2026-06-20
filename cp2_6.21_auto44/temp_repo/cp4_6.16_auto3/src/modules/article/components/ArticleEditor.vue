<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue';
import { Marked } from 'marked';
import hljs from 'highlight.js';
import type { Article } from '@/shared/types';
import { useArticleStore } from '../stores/article';

const props = defineProps<{ article: Article | null }>();
const emit = defineEmits<{ close: [] }>();

const store = useArticleStore();
const editTitle = ref('');
const editContent = ref('');
const editTags = ref('');
const previewHtml = ref('');
const isEditing = ref(false);
const previewRef = ref<HTMLElement | null>(null);
const splitPos = ref(50);

const marked = new Marked({
  renderer: {
    code({ text, lang }: { text: string; lang?: string }) {
      const language = lang && hljs.getLanguage(lang) ? lang : undefined;
      let highlighted: string;
      if (language) {
        highlighted = hljs.highlight(text, { language }).value;
      } else {
        highlighted = hljs.highlightAuto(text).value;
      }
      return `<pre><code class="hljs language-${lang || 'plaintext'}">${highlighted}</code></pre>`;
    },
  },
});

function renderMarkdown(content: string) {
  previewHtml.value = marked.parse(content) as string;
}

watch(() => props.article, (article) => {
  if (article) {
    editTitle.value = article.title;
    editContent.value = article.content;
    editTags.value = article.tags.join(', ');
    isEditing.value = false;
    renderMarkdown(article.content);
  }
}, { immediate: true });

watch(editContent, (val) => {
  renderMarkdown(val);
});

function handleSave() {
  if (!props.article) return;
  store.update(props.article.id, {
    title: editTitle.value.trim() || '无标题',
    content: editContent.value,
    tags: editTags.value.split(',').map(t => t.trim()).filter(Boolean),
  });
  isEditing.value = false;
}

function startEdit() {
  if (!props.article) return;
  editTitle.value = props.article.title;
  editContent.value = props.article.content;
  editTags.value = props.article.tags.join(', ');
  isEditing.value = true;
}

let dragging = false;
function onSplitDown(e: MouseEvent) {
  dragging = true;
  e.preventDefault();
  const onMove = (ev: MouseEvent) => {
    if (!dragging) return;
    const container = (e.currentTarget as HTMLElement).parentElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const pct = ((ev.clientX - rect.left) / rect.width) * 100;
    splitPos.value = Math.max(20, Math.min(80, pct));
  };
  const onUp = () => {
    dragging = false;
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  };
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-CN');
}
</script>

<template>
  <div v-if="article" class="article-editor">
    <div class="editor-header">
      <button class="btn-back" @click="emit('close')">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>
      <h3 class="editor-title">{{ isEditing ? '编辑笔记' : article.title || '无标题' }}</h3>
      <div class="editor-actions">
        <button v-if="!isEditing" class="btn-edit" @click="startEdit">编辑</button>
        <button v-if="isEditing" class="btn-save" @click="handleSave">保存</button>
      </div>
    </div>

    <div v-if="isEditing" class="split-container">
      <div class="split-pane edit-pane" :style="{ width: splitPos + '%' }">
        <input v-model="editTitle" placeholder="标题" class="edit-title-input" />
        <textarea v-model="editContent" class="edit-textarea" placeholder="使用 Markdown 语法编写..."></textarea>
        <input v-model="editTags" placeholder="标签（逗号分隔）" class="edit-tags-input" />
      </div>
      <div class="split-bar" @mousedown="onSplitDown"></div>
      <div class="split-pane preview-pane" :style="{ width: (100 - splitPos) + '%' }">
        <div class="preview-label">预览</div>
        <div class="markdown-body" v-html="previewHtml"></div>
      </div>
    </div>

    <div v-else class="view-container">
      <div class="view-meta">
        <span class="meta-date">更新于 {{ formatDate(article.updatedAt) }}</span>
        <div class="meta-tags">
          <span v-for="tag in article.tags" :key="tag" class="tag">{{ tag }}</span>
        </div>
      </div>
      <div class="markdown-body" v-html="previewHtml"></div>
    </div>
  </div>
</template>

<style scoped>
.article-editor { height: 100%; display: flex; flex-direction: column; }
.editor-header { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--border-color); }
.btn-back { padding: 4px; color: var(--text-secondary); border-radius: var(--radius-sm); transition: all var(--transition-fast); }
.btn-back:hover { color: var(--accent-amber); background: rgba(245, 166, 35, 0.1); }
.editor-title { flex: 1; font-size: 15px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.editor-actions { display: flex; gap: 8px; }
.btn-edit { padding: 5px 14px; background: var(--bg-card); color: var(--accent-amber); border-radius: var(--radius-sm); font-size: 12px; border: 1px solid var(--accent-amber); transition: all var(--transition-normal); }
.btn-edit:hover { background: rgba(245, 166, 35, 0.15); }
.btn-save { padding: 5px 14px; background: var(--accent-green); color: #fff; border-radius: var(--radius-sm); font-size: 12px; font-weight: 500; transition: all var(--transition-normal); }
.btn-save:hover { background: #219a52; }

.split-container { flex: 1; display: flex; overflow: hidden; }
.split-pane { display: flex; flex-direction: column; overflow: hidden; min-width: 0; }
.edit-pane { padding: 0; }
.edit-title-input { padding: 10px 16px; background: transparent; border: none; border-bottom: 1px solid var(--border-color); color: var(--text-primary); font-size: 16px; font-weight: 600; outline: none; }
.edit-textarea { flex: 1; padding: 12px 16px; background: transparent; border: none; color: var(--text-primary); font-size: 13px; font-family: 'Consolas', 'Fira Code', monospace; line-height: 1.7; resize: none; outline: none; }
.edit-tags-input { padding: 8px 16px; background: transparent; border: none; border-top: 1px solid var(--border-color); color: var(--text-secondary); font-size: 12px; outline: none; }
.edit-tags-input::placeholder { color: var(--text-secondary); }

.split-bar { width: 5px; background: var(--border-color); cursor: col-resize; transition: background var(--transition-fast); flex-shrink: 0; }
.split-bar:hover { background: var(--accent-amber); }

.preview-pane { background: var(--bg-primary); }
.preview-label { padding: 8px 16px; font-size: 11px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid var(--border-color); }

.view-container { flex: 1; overflow-y: auto; }
.view-meta { padding: 12px 20px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; }
.meta-date { font-size: 11px; color: var(--text-secondary); }
.meta-tags { display: flex; gap: 4px; }
.tag { padding: 1px 8px; background: rgba(245, 166, 35, 0.15); color: var(--accent-amber); border-radius: 10px; font-size: 11px; }

.markdown-body { padding: 16px 20px; overflow-y: auto; line-height: 1.8; font-size: 14px; }
.markdown-body :deep(h1) { font-size: 22px; margin: 20px 0 12px; padding-bottom: 6px; border-bottom: 1px solid var(--border-color); }
.markdown-body :deep(h2) { font-size: 18px; margin: 18px 0 10px; padding-bottom: 4px; border-bottom: 1px solid var(--border-color); }
.markdown-body :deep(h3) { font-size: 15px; margin: 14px 0 8px; }
.markdown-body :deep(p) { margin: 8px 0; }
.markdown-body :deep(ul), .markdown-body :deep(ol) { padding-left: 20px; margin: 8px 0; }
.markdown-body :deep(blockquote) { border-left: 3px solid var(--accent-amber); padding: 4px 12px; margin: 8px 0; color: var(--text-secondary); background: rgba(245, 166, 35, 0.05); border-radius: 0 var(--radius-sm) var(--radius-sm) 0; }
.markdown-body :deep(code) { background: rgba(255,255,255,0.08); padding: 1px 6px; border-radius: 3px; font-size: 13px; font-family: 'Consolas', 'Fira Code', monospace; }
.markdown-body :deep(pre) { margin: 12px 0; border-radius: var(--radius-md); overflow-x: auto; }
.markdown-body :deep(pre code) { display: block; padding: 14px; background: #1e1e2e; border-radius: var(--radius-md); font-size: 13px; line-height: 1.6; }
.markdown-body :deep(a) { color: var(--accent-amber); }
.markdown-body :deep(table) { border-collapse: collapse; width: 100%; margin: 12px 0; }
.markdown-body :deep(th), .markdown-body :deep(td) { border: 1px solid var(--border-color); padding: 6px 10px; }
.markdown-body :deep(th) { background: var(--bg-secondary); }
.markdown-body :deep(img) { max-width: 100%; border-radius: var(--radius-md); }
</style>
