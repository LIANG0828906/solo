import { createRouter, createWebHistory } from 'vue-router'
import SongSelect from '@/views/SongSelect.vue'
import GameView from '@/views/GameView.vue'

const routes = [
  {
    path: '/',
    name: 'song-select',
    component: SongSelect,
  },
  {
    path: '/game/:songId',
    name: 'game',
    component: GameView,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
