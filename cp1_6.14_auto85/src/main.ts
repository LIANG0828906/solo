import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import CardGame from './game/CardGame.vue'

const app = createApp(CardGame)
const pinia = createPinia()
const router = createRouter({
  history: createWebHashHistory(),
  routes: [{ path: '/', name: 'game', component: CardGame }]
})

app.use(pinia)
app.use(router)
app.mount('#app')
