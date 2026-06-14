<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="app-root min-h-screen">
    <RouterView />
  </div>
</template>

<style>
html, body, #app {
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 100vh;
  overflow-x: hidden;
}

* {
  -webkit-tap-highlight-color: transparent;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei',
    'Noto Sans', Helvetica, Arial, sans-serif;
  color: white;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 8px 40px rgba(150,120,255,0.45); }
  50% { box-shadow: 0 12px 60px rgba(150,120,255,0.7); }
}
</style>
