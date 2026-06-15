import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Article } from '@/shared/types';
import { articleApi, checkArticleReferences } from '@/shared/api';

export const useArticleStore = defineStore('article', () => {
  const articles = ref<Article[]>(articleApi.getAll());

  const sortedArticles = computed(() =>
    [...articles.value].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  );

  function load() {
    articles.value = articleApi.getAll();
  }

  function create(data: { title: string; content: string; tags: string[] }) {
    const article = articleApi.create(data);
    articles.value.push(article);
    return article;
  }

  function update(id: string, data: Partial<Article>) {
    const result = articleApi.update(id, data);
    if (result) {
      const idx = articles.value.findIndex(a => a.id === id);
      if (idx !== -1) articles.value[idx] = result;
    }
    return result;
  }

  function remove(id: string): { success: boolean; references: ReturnType<typeof checkArticleReferences> } {
    const references = checkArticleReferences(id);
    if (references.length > 0) {
      return { success: false, references };
    }
    const success = articleApi.delete(id);
    if (success) {
      articles.value = articles.value.filter(a => a.id !== id);
    }
    return { success, references: [] };
  }

  function forceRemove(id: string) {
    articleApi.delete(id);
    articles.value = articles.value.filter(a => a.id !== id);
  }

  return { articles, sortedArticles, load, create, update, remove, forceRemove };
});
