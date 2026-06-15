<script setup lang="ts">
import { ArticleList, ArticleEditor } from '@/modules/article';
import { useArticleStore } from '@/modules/article/stores/article';
import { ref, computed } from 'vue';

const store = useArticleStore();
const selectedArticleId = ref<string | null>(null);
const showEditor = ref(false);

const selectedArticle = computed(() => {
  if (!selectedArticleId.value) return null;
  return store.articles.find(a => a.id === selectedArticleId.value) || null;
});

function handleSelect(id: string) {
  selectedArticleId.value = id;
  showEditor.value = true;
}

function handleClose() {
  showEditor.value = false;
  selectedArticleId.value = null;
}
</script>

<template>
  <div class="article-page">
    <ArticleList v-if="!showEditor" @select="handleSelect" />
    <ArticleEditor v-else :article="selectedArticle" @close="handleClose" />
  </div>
</template>

<style scoped>
.article-page { height: 100%; }
</style>
