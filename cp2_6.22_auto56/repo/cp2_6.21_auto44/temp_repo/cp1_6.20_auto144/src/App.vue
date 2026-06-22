<template>
  <div class="app-layout">
    <div class="app-main">
      <ControlPanel />
      <PreviewPanel />
    </div>
    <HistoryList />
    <Transition name="toast">
      <div class="toast" v-if="store.toastVisible">{{ store.toastMessage }}</div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import ControlPanel from './components/ControlPanel.vue'
import PreviewPanel from './components/PreviewPanel.vue'
import HistoryList from './components/HistoryList.vue'
import { useFontStore } from './stores/fontStore'

const store = useFontStore()
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  overflow: hidden;
}

body {
  background: #1e1e2e;
  color: #e0e0f0;
  font-family: 'Noto Sans SC', 'Roboto', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  height: 100%;
}
</style>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.app-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.toast {
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  background: #7c5cbf;
  color: #fff;
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 20px rgba(124, 92, 191, 0.4);
  z-index: 9999;
  pointer-events: none;
}

.toast-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}
</style>
