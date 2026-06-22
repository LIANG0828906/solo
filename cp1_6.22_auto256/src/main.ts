import { createApp } from 'vue'
import { create, NButton, NCard, NModal, NRadio, NRadioGroup, NCheckbox, NCheckboxGroup, NInput, NInputNumber, NSpace, NTag, NAlert, NSpin, NDrawer, NDrawerContent, NMessageProvider } from 'naive-ui'
import './style.css'
import App from './App.vue'

const naive = create({
  components: [
    NButton,
    NCard,
    NModal,
    NRadio,
    NRadioGroup,
    NCheckbox,
    NCheckboxGroup,
    NInput,
    NInputNumber,
    NSpace,
    NTag,
    NAlert,
    NSpin,
    NDrawer,
    NDrawerContent,
    NMessageProvider
  ]
})

const app = createApp(App)
app.use(naive)
app.mount('#app')
