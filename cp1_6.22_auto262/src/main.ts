import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { eventBus } from './eventBus';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);

declare module 'vue' {
  interface ComponentCustomProperties {
    $eventBus: typeof eventBus;
  }
}

app.config.globalProperties.$eventBus = eventBus;
app.provide('eventBus', eventBus);

app.mount('#app');
