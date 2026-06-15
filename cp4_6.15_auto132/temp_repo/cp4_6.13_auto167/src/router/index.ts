import { createRouter, createWebHistory } from 'vue-router'
import MealTracker from '@/views/MealTracker.vue'
import Dashboard from '@/views/Dashboard.vue'

const routes = [
  {
    path: '/',
    redirect: '/tracker'
  },
  {
    path: '/tracker',
    name: 'MealTracker',
    component: MealTracker,
    meta: { title: '饮食记录' }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { title: '营养分析' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
