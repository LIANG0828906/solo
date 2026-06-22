import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(router)
app.mount('#app')

document.addEventListener(
  'click',
  (e) => {
    const target = e.target as HTMLElement
    if (!target) return
    const clickable = target.closest(
      'button, [role="button"], .clickable, .nav-dot-btn, .audio-btn, .close-btn, .hint-key'
    ) as HTMLElement | null
    if (clickable && clickable.classList) {
      clickable.classList.remove('is-clicking')
      void clickable.offsetWidth
      clickable.classList.add('is-clicking')
      setTimeout(() => {
        clickable.classList.remove('is-clicking')
      }, 600)
    }
  },
  true
)
