<script setup lang="ts">
import type { Article } from '@/shared/types';

defineProps<{ article: Article | null }>();
</script>

<template>
  <div v-if="article" class="article-detail">
    <div class="detail-header">
      <h3 class="detail-title">{{ article.title || '无标题' }}</h3>
      <div class="detail-meta">
        <span class="meta-date">创建于 {{ new Date(article.createdAt).toLocaleString('zh-CN') }}</span>
        <span class="meta-date">更新于 {{ new Date(article.updatedAt).toLocaleString('zh-CN') }}</span>
      </div>
      <div class="detail-tags">
        <span v-for="tag in article.tags" :key="tag" class="tag">{{ tag }}</span>
      </div>
    </div>
    <div class="detail-content">
      <p class="detail-excerpt">{{ article.content.slice(0, 300) }}{{ article.content.length > 300 ? '...' : '' }}</p>
    </div>
  </div>
</template>

<style scoped>
.article-detail { padding: 20px; }
.detail-header { margin-bottom: 16px; }
.detail-title { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
.detail-meta { display: flex; gap: 16px; margin-bottom: 8px; }
.meta-date { font-size: 11px; color: var(--text-secondary); }
.detail-tags { display: flex; gap: 4px; flex-wrap: wrap; }
.tag { padding: 2px 10px; background: rgba(245, 166, 35, 0.15); color: var(--accent-amber); border-radius: 10px; font-size: 12px; }
.detail-excerpt { font-size: 13px; color: var(--text-secondary); line-height: 1.7; white-space: pre-wrap; }
</style>
