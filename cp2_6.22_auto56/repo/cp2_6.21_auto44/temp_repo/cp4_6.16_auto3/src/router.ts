import { createRouter, createWebHashHistory } from 'vue-router';
import ArticlePage from '@/pages/ArticlePage.vue';
import TaskPage from '@/pages/TaskPage.vue';
import BookmarkPage from '@/pages/BookmarkPage.vue';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/article' },
    { path: '/article', name: 'article', component: ArticlePage },
    { path: '/task', name: 'task', component: TaskPage },
    { path: '/bookmark', name: 'bookmark', component: BookmarkPage },
  ],
});

export default router;
