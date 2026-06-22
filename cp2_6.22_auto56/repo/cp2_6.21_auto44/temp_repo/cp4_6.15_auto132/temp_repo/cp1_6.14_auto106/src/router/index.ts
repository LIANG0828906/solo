import { createRouter, createWebHistory } from 'vue-router'
import MainView from '@/views/MainView.vue'
import PlantDetail from '@/views/PlantDetail.vue'

const routes = [
  {
    path: '/',
    name: 'main',
    component: MainView,
    meta: { title: '植物总览' }
  },
  {
    path: '/plant/:id',
    name: 'plant-detail',
    component: PlantDetail,
    meta: { title: '植物详情' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.afterEach((to) => {
  const baseTitle = '虚拟植物园'
  document.title = to.meta.title
    ? `${to.meta.title} - ${baseTitle}`
    : baseTitle
})

export default router
