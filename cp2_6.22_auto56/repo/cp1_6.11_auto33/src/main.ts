import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)
app.mount('#app')

const loadingEl = document.getElementById('loading')
if (loadingEl && loadingEl.parentNode) {
  loadingEl.parentNode.removeChild(loadingEl)
}
